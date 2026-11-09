'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ANALYTICS_PERIODS,
  ANALYTICS_REFRESH_MS,
  formatSessionDuration,
  safeProjectPath,
  analyticsPeriod,
  emptyReport,
  type AnalyticsPeriod,
  type AnalyticsReport,
  type AnalyticsBreakdown,
} from '@/lib/analytics-report'
import styles from './AnalyticsSummary.module.scss'

const format = new Intl.NumberFormat('en-GB')

function change(current: number | null, previous: number | null, percentage = false) {
  if (current === null || previous === null) return 'No previous data'
  if (percentage) {
    const delta = Math.round((current - previous) * 10) / 10
    return delta ? `${delta > 0 ? '+' : ''}${delta} pp vs previous period` : 'No change'
  }
  if (!previous) return current ? 'New activity' : 'No change'
  const delta = Math.round(((current - previous) / previous) * 100)
  return `${delta > 0 ? '+' : ''}${delta}% vs previous period`
}

function Breakdown({
  title,
  rows,
  links = false,
}: {
  title: string
  rows: AnalyticsBreakdown[]
  links?: boolean
}) {
  const maximum = Math.max(1, ...rows.map((row) => row.count))
  return (
    <section className={styles.breakdown}>
      <h3>{title}</h3>
      {!rows.length ? (
        <p className={styles.note}>No activity yet</p>
      ) : (
        <ol>
          {rows.map((row) => (
            <li key={row.key}>
              <span className={styles.bar} style={{ width: `${(row.count / maximum) * 100}%` }} />
              <span className={styles.rowLabel}>
                {links && safeProjectPath(row.key) ? (
                  <a href={row.key} target="_blank" rel="noreferrer">
                    {row.label}
                  </a>
                ) : row.label === 'pl' ? (
                  'Polski'
                ) : row.label === 'en' ? (
                  'English'
                ) : (
                  row.label
                )}
              </span>
              <span className={styles.rowCount}>{format.format(row.count)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default function AnalyticsSummary({ initialReport }: { initialReport: AnalyticsReport }) {
  const [{ report, refreshError }, setActivity] = useState({
    report: initialReport,
    refreshError: '',
  })
  const [days, setDays] = useState(initialReport.days)
  const [loading, setLoading] = useState(false)
  const controller = useRef<AbortController | null>(null)
  const lastRefresh = useRef(0)
  useEffect(() => {
    lastRefresh.current = Date.now()
    return () => controller.current?.abort()
  }, [])

  const selectPeriod = useCallback(async (next: AnalyticsPeriod) => {
    lastRefresh.current = Date.now()
    setDays(next)
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request
    setLoading(true)
    const applyReport = (nextReport: AnalyticsReport) => {
      if (request.signal.aborted) return
      setActivity((previous) => {
        if (
          nextReport.status === 'error' &&
          previous.report.status === 'ready' &&
          previous.report.days === nextReport.days
        ) {
          return {
            report: previous.report,
            refreshError: nextReport.message || 'Could not refresh website activity.',
          }
        }
        return { report: nextReport, refreshError: '' }
      })
    }
    try {
      const response = await fetch(`/api/analytics?days=${next}`, {
        signal: request.signal,
        cache: 'no-store',
      })
      if (!response.ok)
        throw new Error(
          response.status === 401
            ? 'Your admin session has expired. Reload the page and sign in again.'
            : 'Could not load website activity. Please try refreshing.',
        )
      const nextReport: AnalyticsReport = await response.json()
      applyReport(nextReport)
    } catch (error) {
      applyReport(
        emptyReport(
          next,
          'error',
          error instanceof Error && error.message.startsWith('Your admin session')
            ? error.message
            : 'Could not load website activity. Please try refreshing.',
        ),
      )
    } finally {
      if (!request.signal.aborted) {
        lastRefresh.current = Date.now()
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    let stopped = false
    let timer: number
    const schedule = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(
        () => void refresh(),
        Math.max(1000, ANALYTICS_REFRESH_MS - (Date.now() - lastRefresh.current)),
      )
    }
    async function refresh() {
      if (stopped || document.visibilityState === 'hidden') return
      if (Date.now() - lastRefresh.current >= ANALYTICS_REFRESH_MS) await selectPeriod(days)
      if (!stopped) schedule()
    }
    const onVisibility = () => {
      if (document.visibilityState !== 'hidden') schedule()
    }
    schedule()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stopped = true
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [days, selectPeriod])

  const maximum = Math.max(1, ...report.daily.map((day) => day.count))
  const points = report.daily
    .map(
      (day, index) =>
        `${(index * 720) / Math.max(1, report.daily.length - 1)},${132 - (day.count / maximum) * 116}`,
    )
    .join(' ')
  const metrics = [
    { key: 'visitors', label: 'Visitors' },
    { key: 'pageviews', label: 'Page views' },
    { key: 'projects', label: 'Project opens' },
    { key: 'contacts', label: 'Contact clicks' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'sessionDuration', label: 'Avg. session duration' },
    { key: 'bounceRate', label: 'Bounce rate' },
  ] as const

  return (
    <section className={styles.panel} aria-label="Website activity" aria-busy={loading}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Analytics</p>
          <h2>Website activity</h2>
        </div>
        <div className={styles.controls}>
          <button type="button" disabled={loading} onClick={() => void selectPeriod(days)}>
            {loading
              ? 'Refreshing…'
              : report.status === 'error' || refreshError
                ? 'Retry'
                : 'Refresh'}
          </button>
          <label>
            Period{' '}
            <select
              value={days}
              onChange={(event) => void selectPeriod(analyticsPeriod(event.target.value))}
            >
              {ANALYTICS_PERIODS.map((period) => (
                <option key={period} value={period}>
                  Last {period} days
                </option>
              ))}
            </select>
          </label>
          {report.dashboardURL && (
            <a href={report.dashboardURL} target="_blank" rel="noreferrer">
              Open PostHog ↗
            </a>
          )}
        </div>
      </header>
      <div aria-live="polite" className={styles.status}>
        {loading ? 'Updating activity…' : ''}
      </div>
      {refreshError && (
        <p className={styles.refreshError} role="status">
          {refreshError} Showing the last successful figures.
        </p>
      )}
      {report.status !== 'ready' ? (
        <div className={styles.empty} role={report.status === 'error' ? 'status' : undefined}>
          <h3>
            {report.status === 'setup'
              ? 'Connect PostHog to see your audience'
              : 'Activity is temporarily unavailable'}
          </h3>
          <p>{report.message}</p>
        </div>
      ) : (
        <>
          <div className={styles.metrics}>
            {metrics.map(({ key, label }) => (
              <div key={key} className={styles.metric}>
                <span>{label}</span>
                <strong>
                  {key === 'sessionDuration'
                    ? formatSessionDuration(report.current[key])
                    : key === 'bounceRate'
                      ? report.current[key] === null
                        ? '—'
                        : `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(report.current[key])}%`
                      : format.format(report.current[key])}
                </strong>
                <small>
                  {change(report.current[key], report.previous[key], key === 'bounceRate')}
                </small>
              </div>
            ))}
          </div>
          <div className={styles.chart}>
            <div className={styles.chartHeading}>
              <h3>Page views</h3>
              <span>Daily · UTC</span>
            </div>
            {report.current.pageviews ? (
              <svg
                viewBox="0 0 720 150"
                role="img"
                aria-label={`Daily page views over the last ${report.days} days`}
              >
                <path d="M0 132H720" className={styles.axis} />
                <polygon points={`0,150 ${points} 720,150`} className={styles.area} />
                <polyline points={points} className={styles.line} />
              </svg>
            ) : (
              <p className={styles.noTraffic}>
                Your traffic chart will appear after visitors arrive.
              </p>
            )}
            <div className={styles.dates}>
              <span>{report.daily[0]?.date}</span>
              <span>{report.daily.at(-1)?.date}</span>
            </div>
          </div>
          <div className={styles.breakdowns}>
            <Breakdown title="Top projects" rows={report.projects} links />
            <Breakdown title="Traffic sources" rows={report.sources} />
            <Breakdown title="Website language" rows={report.languages} />
          </div>
          <section className={styles.videos} aria-label="Video engagement">
            <div className={styles.chartHeading}>
              <h3>Video engagement</h3>
              <span>Top 12 · Manual starts and autoplay</span>
            </div>
            {!report.videos.length ? (
              <p className={styles.note}>
                Playback data will appear here as visitors watch videos. Tracking starts with this
                update.
              </p>
            ) : (
              <div
                className={styles.videoTableScroll}
                tabIndex={0}
                role="region"
                aria-label="Video engagement table"
              >
                <table className={styles.videoTable}>
                  <thead>
                    <tr>
                      <th scope="col">Video</th>
                      <th scope="col">Starts</th>
                      <th scope="col">Completed</th>
                      <th scope="col">Avg. watched</th>
                      <th scope="col">Left early</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.videos.map((video) => (
                      <tr key={video.key}>
                        <th scope="row">{video.label}</th>
                        <td>
                          {format.format(video.starts)}
                          <small>
                            {format.format(video.manualStarts)} manual ·{' '}
                            {format.format(video.autoplayStarts)} auto
                          </small>
                        </td>
                        <td>
                          {format.format(video.completions)}
                          <small>
                            {Math.round((video.completions / video.starts) * 100)}% of starts
                          </small>
                        </td>
                        <td>{Math.round(video.averageWatchedPercent)}%</td>
                        <td>
                          {format.format(video.leftEarly)}
                          <small>
                            {video.averageExitPercent === null
                              ? 'No exits recorded'
                              : `Avg. exit at ${Math.round(video.averageExitPercent)}%`}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className={styles.note}>
              Auto denotes videos configured for autoplay. Avg. watched measures the portion viewed
              while the tab is visible and excludes skipped sections. Completed means reaching the
              end after watching at least 90%. Exits are best-effort; active viewings may be
              incomplete.
            </p>
          </section>
          <footer className={styles.footer}>
            <span>
              Cookieless visitor estimates reset daily. Auto-refreshes every 5 minutes while
              visible.
            </span>
            {report.updatedAt && (
              <time dateTime={report.updatedAt}>
                Updated{' '}
                {new Intl.DateTimeFormat('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'UTC',
                }).format(new Date(report.updatedAt))}{' '}
                UTC
              </time>
            )}
          </footer>
        </>
      )}
    </section>
  )
}
