import type { PostHog, PostHogConfig } from 'posthog-js'

export type ConsentAnalyticsClient = Pick<
  PostHog,
  | 'capture'
  | 'set_config'
  | 'opt_in_capturing'
  | 'opt_out_capturing'
  | 'startSessionRecording'
  | 'stopSessionRecording'
  | 'reset'
> & { init: (token: string, options: Partial<PostHogConfig>) => unknown }

// Owns the asynchronous SDK lifecycle. Permission is checked again after loading
// so rejecting while the import is pending can never initialize PostHog.
export function createConsentAnalyticsSession({
  token,
  options,
  allowed,
  subscribe,
  load,
  onReady,
  onStop,
}: {
  token: string
  options: Partial<PostHogConfig>
  allowed: () => boolean
  subscribe: (onChange: () => void) => () => void
  load: () => Promise<ConsentAnalyticsClient>
  onReady: (client: ConsentAnalyticsClient) => void
  onStop: () => void
}) {
  let client: ConsentAnalyticsClient | undefined
  let initialized = false
  let running = false
  let loading = false
  let closed = false
  let needsCleanup = false

  const stop = () => {
    onStop()
    if (client && needsCleanup) {
      needsCleanup = false
      running = false
      try {
        client.stopSessionRecording()
        client.opt_out_capturing()
        client.reset(true)
        client.opt_out_capturing()
        client.set_config({
          autocapture: false,
          capture_pageleave: false,
          disable_session_recording: true,
        })
      } catch {
        /* The independent consent gate still rejects every capture. */
      }
    }
  }
  const sync = () => {
    if (closed) return
    if (!allowed()) {
      stop()
      return
    }
    if (running || loading) return
    loading = true
    onStop()
    void load()
      .then((loaded) => {
        if (closed || !allowed()) return
        client = loaded
        needsCleanup = true
        if (!initialized) {
          client.init(token, options)
          initialized = true
        } else client.set_config(options)
        client.opt_in_capturing({ captureEventName: false })
        running = true
        if (!allowed()) {
          stop()
          return
        }
        client.startSessionRecording()
        onReady(client)
      })
      .catch(() => {
        stop()
      })
      .finally(() => {
        loading = false
      })
  }
  const unsubscribe = subscribe(sync)
  sync()
  return () => {
    closed = true
    unsubscribe()
    onStop()
    // Leaving a page does not revoke a still-valid saved choice.
    if (running) {
      client?.stopSessionRecording()
      client?.set_config({ autocapture: false, capture_pageleave: false })
    }
  }
}
