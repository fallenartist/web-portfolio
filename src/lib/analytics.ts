export type AnalyticsEventName =
  | '$pageview'
  | 'project_opened'
  | 'map_node_selected'
  | 'outbound_link_clicked'
  | 'contact_clicked'
  | 'video_started'
  | 'video_progress'
  | 'video_completed'
  | 'video_left'
  | 'language_changed'

export type AnalyticsProperties = Record<string, string | number | boolean>
export type AnalyticsEvent = {
  name: AnalyticsEventName
  properties: AnalyticsProperties
  timestamp: Date
}
type Sink = (event: AnalyticsEvent) => void

let sink: Sink | null = null
let disabled = false
let pending: AnalyticsEvent[] = []
let lastPage = ''

export function pauseAnalytics() {
  sink = null
  disabled = false
}

function deliver(handler: Sink, event: AnalyticsEvent) {
  try {
    handler(event)
  } catch {
    // Analytics must never interrupt navigation, playback or language changes.
  }
}

export function setAnalyticsSink(next: Sink | null) {
  sink = next
  disabled = !next
  const queued = pending
  pending = []
  if (next) queued.forEach((event) => deliver(next, event))
}

export function trackEvent(name: AnalyticsEventName, properties: AnalyticsProperties = {}) {
  if (typeof window === 'undefined' || disabled) return
  const event = {
    name,
    properties: { page_path: window.location.pathname, ...properties },
    timestamp: new Date(),
  }
  if (sink) deliver(sink, event)
  else if (pending.length < 50) pending.push(event)
}

export function trackPageView(path: string, title: string, kind: string, slug?: string) {
  if (typeof window === 'undefined' || lastPage === path) return
  lastPage = path
  trackEvent('$pageview', { page_path: path, page_title: title, page_kind: kind })
  if (kind === 'project') {
    trackEvent('project_opened', {
      project_path: path,
      project_title: title,
      project_slug: slug || path,
    })
  }
}

export function isLocalAnalyticsHost(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname === '[::1]' ||
    hostname === '::1' ||
    hostname.startsWith('127.') ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local')
  )
}
