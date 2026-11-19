import type { PostHogConfig } from 'posthog-js'

export function getPostHogOptions(
  config: { apiHost: string; appHost: string; mode?: 'cookies' | 'cookieless' },
  allowed: () => boolean,
): Partial<PostHogConfig> {
  const cookieless = config.mode === 'cookieless'
  return {
    api_host: config.apiHost,
    ui_host: config.appHost,
    cookieless_mode: cookieless ? 'always' : undefined,
    persistence: cookieless ? 'memory' : 'cookie',
    disable_persistence: cookieless,
    cookie_expiration: 180,
    cross_subdomain_cookie: false,
    opt_out_capturing_by_default: !cookieless,
    opt_out_persistence_by_default: true,
    opt_out_capturing_persistence_type: 'localStorage',
    person_profiles: 'never',
    autocapture: cookieless
      ? false
      : {
          element_attribute_ignorelist: ['href', 'src', 'value'],
          capture_copied_text: false,
        },
    capture_pageview: false,
    capture_pageleave: true,
    disable_session_recording: cookieless,
    session_recording: {
      maskAllInputs: true,
      blockSelector: 'iframe, [data-private], input[type="file"]',
      recordCrossOriginIframes: false,
    },
    enable_recording_console_log: false,
    capture_heatmaps: false,
    capture_dead_clicks: false,
    capture_performance: false,
    capture_exceptions: false,
    disable_surveys: true,
    disable_web_experiments: true,
    disable_product_tours: true,
    respect_dnt: true,
    save_campaign_params: false,
    before_send: (event) => {
      if (!event || !allowed()) return null
      for (const key of [
        '$current_url',
        '$referrer',
        '$initial_current_url',
        '$initial_referrer',
      ]) {
        const value = event.properties[key]
        if (typeof value !== 'string') continue
        try {
          const url = new URL(value)
          event.properties[key] = url.origin + url.pathname
        } catch {
          delete event.properties[key]
        }
      }
      return event
    },
  }
}
