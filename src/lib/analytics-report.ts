export const ANALYTICS_PERIODS = [7, 30, 90] as const
export const ANALYTICS_REFRESH_MS = 5 * 60 * 1000
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number]
export type AnalyticsTotals = {
  visitors: number
  pageviews: number
  projects: number
  contacts: number
  sessions: number
  sessionDuration: number | null
  bounceRate: number | null
}
export type AnalyticsBreakdown = { key: string; label: string; count: number }
export type VideoAnalytics = {
  key: string
  label: string
  starts: number
  completions: number
  averageWatchSeconds: number
  averageWatchedPercent: number
  manualStarts: number
  autoplayStarts: number
  leftEarly: number
  averageExitPercent: number | null
  milestones: [number, number, number, number]
}
export interface AnalyticsReport {
  status: 'ready' | 'setup' | 'error'
  message?: string
  days: AnalyticsPeriod
  updatedAt?: string
  dashboardURL?: string
  current: AnalyticsTotals
  previous: AnalyticsTotals
  daily: { date: string; count: number }[]
  projects: AnalyticsBreakdown[]
  sources: AnalyticsBreakdown[]
  languages: AnalyticsBreakdown[]
  videos: VideoAnalytics[]
}

export function analyticsPeriod(value: unknown): AnalyticsPeriod {
  const days = Number(value)
  return days === 7 || days === 90 ? days : 30
}

export function emptyReport(
  days: AnalyticsPeriod,
  status: AnalyticsReport['status'],
  message: string,
): AnalyticsReport {
  const zero: AnalyticsTotals = {
    visitors: 0,
    pageviews: 0,
    projects: 0,
    contacts: 0,
    sessions: 0,
    sessionDuration: null,
    bounceRate: null,
  }
  return {
    days,
    status,
    message,
    current: { ...zero },
    previous: { ...zero },
    daily: [],
    projects: [],
    sources: [],
    languages: [],
    videos: [],
  }
}

export function analyticsDateRange(days: AnalyticsPeriod, now = new Date()) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  const start = new Date(end.getTime() - days * 86_400_000)
  const previousStart = new Date(start.getTime() - days * 86_400_000)
  const date = (value: Date) => value.toISOString().slice(0, 10)
  return { start: date(start), end: date(end), previousStart: date(previousStart) }
}

// Only validated periods and generated ISO dates enter SQL. No user-supplied SQL is accepted.
export function buildAnalyticsQuery(days: AnalyticsPeriod, now = new Date()) {
  const { start, end, previousStart } = analyticsDateRange(days, now)
  const current = `timestamp >= toDateTime('${start}', 'UTC') AND timestamp < toDateTime('${end}', 'UTC')`
  const knownEvents = "event IN ('$pageview', 'project_opened', 'contact_clicked')"
  // HogQL requires a consistent numeric type across UNION branches, including averages.
  const numeric = (...expressions: string[]) =>
    expressions.map((expression) => `toFloat(${expression})`).join(', ')
  return `WITH video_views AS (
    SELECT toString(properties.video_key) AS video_key, toString(properties.viewing_id) AS viewing_id,
      argMax(toString(properties.video_label), timestamp) AS video_label,
      max(toFloat(properties.watch_seconds)) AS watch_seconds,
      max(toFloat(properties.watched_percent)) AS watched_percent,
      max(if(event = 'video_completed' AND toFloat(properties.watched_percent) >= 90, 1, 0)) AS completed,
      max(if(properties.autoplay = true, 1, 0)) AS autoplay,
      max(if(event = 'video_left', 1, 0)) AS left_video,
      argMaxIf(toFloat(properties.position_percent), timestamp, event = 'video_left') AS exit_percent
    FROM events WHERE ${current} AND event IN ('video_started', 'video_progress', 'video_completed', 'video_left')
    GROUP BY video_key, viewing_id HAVING countIf(event = 'video_started') > 0
  ), video_summary AS (
    SELECT video_key, any(video_label) AS video_label, count() AS starts,
      sum(completed) AS completions, avg(watch_seconds) AS avg_watch_seconds, avg(watched_percent) AS avg_watched_percent,
      countIf(autoplay = 0) AS manual_starts, countIf(autoplay = 1) AS autoplay_starts,
      countIf(left_video = 1 AND completed = 0) AS left_early,
      avgIf(exit_percent, left_video = 1 AND completed = 0) AS avg_exit_percent,
      countIf(watched_percent >= 25) AS reached_25, countIf(watched_percent >= 50) AS reached_50,
      countIf(watched_percent >= 75) AS reached_75, countIf(watched_percent >= 90) AS reached_90
    FROM video_views GROUP BY video_key ORDER BY starts DESC, video_key LIMIT 12
  ) SELECT * FROM (
    SELECT 'totals' AS section, if(timestamp >= toDateTime('${start}', 'UTC'), 'current', 'previous') AS key,
      '' AS label, ${numeric("countIf(event = '$pageview')", "uniqIf(distinct_id, event = '$pageview')", "countIf(event = 'project_opened')", "countIf(event = 'contact_clicked')")}
    FROM events WHERE timestamp >= toDateTime('${previousStart}', 'UTC') AND timestamp < toDateTime('${end}', 'UTC') AND ${knownEvents}
    GROUP BY key
    UNION ALL
    SELECT 'sessions', if($start_timestamp >= toDateTime('${start}', 'UTC'), 'current', 'previous') AS period,
      '', ${numeric('count()', 'avg($session_duration)', '100.0 * avg($is_bounce)', '0')}
    FROM sessions
    WHERE $start_timestamp >= toDateTime('${previousStart}', 'UTC') AND $start_timestamp < toDateTime('${end}', 'UTC') AND $pageview_count > 0
    GROUP BY period
    UNION ALL
    SELECT 'daily', toString(toDate(toTimeZone(timestamp, 'UTC'))), '', ${numeric('count()', '0', '0', '0')}
    FROM events WHERE ${current} AND event = '$pageview' GROUP BY toDate(toTimeZone(timestamp, 'UTC'))
    UNION ALL
    SELECT 'projects', project_path, project_title, ${numeric('opens', '0', '0', '0')} FROM (
      SELECT toString(properties.project_path) AS project_path, argMax(toString(properties.project_title), timestamp) AS project_title, count() AS opens
      FROM events WHERE ${current} AND event = 'project_opened' GROUP BY properties.project_path
      ORDER BY opens DESC LIMIT 8
    )
    UNION ALL
    SELECT 'sources', traffic_source, '', ${numeric('views', '0', '0', '0')} FROM (
      SELECT coalesce(nullIf(toString(properties.traffic_source), ''), 'Direct') AS traffic_source, count() AS views
      FROM events WHERE ${current} AND event = '$pageview' GROUP BY traffic_source
      ORDER BY views DESC LIMIT 6
    )
    UNION ALL
    SELECT 'languages', coalesce(nullIf(toString(properties.site_language), ''), 'Unknown'), '', ${numeric('count()', '0', '0', '0')}
    FROM events WHERE ${current} AND event = '$pageview' GROUP BY 2
    UNION ALL
    SELECT 'videos', video_key, video_label, ${numeric('starts', 'completions', 'avg_watch_seconds', 'avg_watched_percent')} FROM video_summary
    UNION ALL
    SELECT 'video_progress', video_key, video_label, ${numeric('reached_25', 'reached_50', 'reached_75', 'reached_90')} FROM video_summary
    UNION ALL
    SELECT 'video_details', video_key, video_label, ${numeric('manual_starts', 'autoplay_starts', 'left_early', 'avg_exit_percent')} FROM video_summary
  ) LIMIT 200`
}

export function safeProjectPath(path: string) {
  return path.startsWith('/') && !path.startsWith('//') && !/[\\\u0000-\u001f]/.test(path)
}

export function formatSessionDuration(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds)) return '—'
  const total = Math.max(0, Math.round(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remainder = total % 60
  if (hours) return `${hours}h ${minutes}m`
  if (minutes) return `${minutes}m ${remainder.toString().padStart(2, '0')}s`
  return `${remainder}s`
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null
}

function count(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, number) : 0
}

export function parseAnalyticsReport(
  rows: unknown,
  days: AnalyticsPeriod,
  now = new Date(),
): AnalyticsReport {
  if (!Array.isArray(rows)) throw new Error('Invalid analytics response')
  const report = emptyReport(days, 'ready', '')
  report.updatedAt = now.toISOString()
  const { start } = analyticsDateRange(days, now)
  const daily = new Map<string, number>()
  const videos = new Map<string, VideoAnalytics>()
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 7) throw new Error('Invalid analytics row')
    const [section, key, label, a, b, c, d] = row as unknown[]
    if (typeof key !== 'string') continue
    if (section === 'totals' && (key === 'current' || key === 'previous')) {
      report[key] = {
        ...report[key],
        pageviews: count(a),
        visitors: count(b),
        projects: count(c),
        contacts: count(d),
      }
    } else if (section === 'sessions' && (key === 'current' || key === 'previous')) {
      const sessions = count(a)
      const bounceRate = optionalNumber(c)
      report[key] = {
        ...report[key],
        sessions,
        sessionDuration: sessions ? optionalNumber(b) : null,
        bounceRate: sessions && bounceRate !== null ? Math.min(100, bounceRate) : null,
      }
    } else if (
      section === 'videos' ||
      section === 'video_progress' ||
      section === 'video_details'
    ) {
      const video = videos.get(key) ?? {
        key,
        label: typeof label === 'string' && label ? label : key,
        starts: 0,
        completions: 0,
        averageWatchSeconds: 0,
        averageWatchedPercent: 0,
        manualStarts: 0,
        autoplayStarts: 0,
        leftEarly: 0,
        averageExitPercent: null,
        milestones: [0, 0, 0, 0],
      }
      if (section === 'videos')
        Object.assign(video, {
          starts: count(a),
          completions: count(b),
          averageWatchSeconds: count(c),
          averageWatchedPercent: Math.min(100, count(d)),
        })
      if (section === 'video_progress') video.milestones = [count(a), count(b), count(c), count(d)]
      if (section === 'video_details')
        Object.assign(video, {
          manualStarts: count(a),
          autoplayStarts: count(b),
          leftEarly: count(c),
          averageExitPercent: count(c) ? optionalNumber(d) : null,
        })
      videos.set(key, video)
    } else if (section === 'daily') daily.set(key.slice(0, 10), count(a))
    else if (section === 'projects' || section === 'sources' || section === 'languages') {
      report[section].push({
        key,
        label: typeof label === 'string' && label ? label : key,
        count: count(a),
      })
    }
  }
  report.projects.sort((a, b) => b.count - a.count)
  report.sources.sort((a, b) => b.count - a.count)
  report.videos = [...videos.values()]
    .filter((video) => video.starts > 0)
    .sort((a, b) => b.starts - a.starts)
  for (let index = 0; index < days; index++) {
    const date = new Date(new Date(start).getTime() + index * 86_400_000).toISOString().slice(0, 10)
    report.daily.push({ date, count: daily.get(date) || 0 })
  }
  return report
}
