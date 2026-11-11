import type { AnalyticsEventName, AnalyticsProperties } from '@/lib/analytics'

type Playback = { seconds: number; duration: number }
type Emit = (name: AnalyticsEventName, properties: AnalyticsProperties) => void

// One viewing per mounted video. Coverage excludes seeks and counts replayed sections once.
export function createVideoWatchTracker(
  properties: AnalyticsProperties,
  emit: Emit,
  now = () => performance.now(),
) {
  let started = false
  let playing = false
  let visible = true
  let seeking = false
  let finished = false
  let completed = false
  let duration = 0
  let position = 0
  let previousTime = now()
  let rate = 1
  let watchSeconds = 0
  let ranges: [number, number][] = []
  const milestones = new Set<number>()
  let lastSnapshot = ''

  const coverage = () => ranges.reduce((sum, [start, end]) => sum + end - start, 0)
  const snapshot = () => ({
    ...properties,
    duration_seconds: duration,
    position_seconds: Math.round(position * 10) / 10,
    position_percent: duration ? Math.min(100, (position / duration) * 100) : 0,
    watch_seconds: Math.round(watchSeconds * 10) / 10,
    watched_percent: duration ? Math.min(100, (coverage() / duration) * 100) : 0,
  })
  function send(name: AnalyticsEventName, extra: AnalyticsProperties = {}) {
    emit(name, { ...snapshot(), ...extra })
  }
  function checkpoint(reason: string) {
    if (!started || finished) return
    const signature = JSON.stringify(snapshot())
    if (signature === lastSnapshot) return
    lastSnapshot = signature
    send('video_progress', { reason, milestone: 0 })
  }
  function endOfVideo() {
    // Vimeo looped videos do not emit ended; detect their wrap in update() too.
    if (completed || !started) return
    if (!duration || coverage() / duration < 0.9) {
      checkpoint('end')
      return
    }
    completed = true
    send('video_completed')
  }
  function update(data: Playback) {
    if (finished || !Number.isFinite(data.seconds) || !Number.isFinite(data.duration)) return
    duration = Math.max(0, data.duration)
    const next = Math.max(0, Math.min(duration, data.seconds))
    const time = now()
    const elapsed = Math.max(0, (time - previousTime) / 1000)
    const delta = next - position
    if (started && playing && visible && !seeking) {
      if (delta > 0 && delta <= elapsed * rate + 0.75) {
        watchSeconds += Math.min(elapsed, delta / rate)
        const sorted = [...ranges, [position, next] as [number, number]].sort((a, b) => a[0] - b[0])
        ranges = []
        for (const range of sorted) {
          const last = ranges.at(-1)
          if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1])
          else ranges.push([...range])
        }
      }
      if (duration && position >= duration - 1 && next < 1 && delta < 0) endOfVideo()
    }
    position = next
    previousTime = time
    const percent = duration ? (coverage() / duration) * 100 : 0
    for (const milestone of [25, 50, 75, 90]) {
      if (percent >= milestone && !milestones.has(milestone)) {
        milestones.add(milestone)
        send('video_progress', { milestone, reason: 'milestone' })
      }
    }
  }
  return {
    play(data: Playback) {
      update(data)
      playing = true
      if (!started && !finished) {
        started = true
        send('video_started')
      }
    },
    update,
    pause(data: Playback) {
      update(data)
      playing = false
      checkpoint('pause')
    },
    seeking(data: Playback) {
      seeking = true
      update(data)
    },
    seeked(data: Playback) {
      update(data)
      seeking = false
    },
    rate(value: number) {
      if (Number.isFinite(value) && value > 0) rate = value
    },
    visibility(value: boolean) {
      if (!value) checkpoint('background')
      visible = value
      previousTime = now()
    },
    ended(data: Playback) {
      update(data)
      playing = false
      endOfVideo()
    },
    leave() {
      if (!started || finished) return
      send('video_left', { completed })
      finished = true
    },
    resume() {
      finished = false
      previousTime = now()
    },
  }
}
