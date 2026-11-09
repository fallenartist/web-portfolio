'use client'

import { useEffect } from 'react'
import { useLocale } from '@/components/LocaleProvider'
import { isLocalAnalyticsHost, pauseAnalytics, setAnalyticsSink, trackEvent } from '@/lib/analytics'

export interface PublicAnalyticsConfig {
  token: string
  apiHost: string
  appHost: string
  trackLocalhost: boolean
}

export default function Analytics({ config }: { config: PublicAnalyticsConfig | null }) {
  const { locale } = useLocale()

  useEffect(() => {
    if (!config || (!config.trackLocalhost && isLocalAnalyticsHost(window.location.hostname))) {
      setAnalyticsSink(null)
      return
    }
    let active = true
    pauseAnalytics()
    const referrer = document.referrer ? new URL(document.referrer) : null
    const source =
      referrer && referrer.origin !== window.location.origin ? referrer.hostname : 'Direct'

    void import('posthog-js')
      .then(({ default: posthog }) => {
        if (!active) return
        posthog.init(config.token, {
          api_host: config.apiHost,
          ui_host: config.appHost,
          cookieless_mode: 'always',
          persistence: 'memory',
          person_profiles: 'never',
          autocapture: false,
          capture_pageview: false,
          capture_pageleave: true,
          disable_session_recording: true,
          capture_heatmaps: false,
          capture_dead_clicks: false,
          capture_performance: false,
          capture_exceptions: false,
          disable_surveys: true,
          disable_web_experiments: true,
          disable_product_tours: true,
          advanced_disable_feature_flags: true,
          respect_dnt: true,
          save_campaign_params: false,
          before_send: (event) => {
            if (!event) return null
            // Never forward query strings or fragments (including email-bearing campaign links).
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
        })
        setAnalyticsSink(({ name, properties, timestamp }) => {
          posthog.capture(
            name,
            {
              ...properties,
              site_language: locale,
              traffic_source: source,
              $current_url:
                window.location.origin +
                (typeof properties.page_path === 'string'
                  ? properties.page_path
                  : window.location.pathname),
              $title: properties.page_title || document.title,
            },
            { timestamp, send_instantly: true, transport: 'sendBeacon' },
          )
        })
      })
      .catch(() => setAnalyticsSink(null))

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (!(target instanceof HTMLAnchorElement)) return
      const url = new URL(target.href, window.location.href)
      if (url.protocol === 'mailto:' || url.protocol === 'tel:') {
        trackEvent('contact_clicked', { method: url.protocol.slice(0, -1) })
      } else if (
        ['https:', 'http:'].includes(url.protocol) &&
        url.origin !== window.location.origin
      ) {
        trackEvent('outbound_link_clicked', {
          destination_host: url.hostname,
          destination_path: url.pathname,
        })
      }
    }
    document.addEventListener('click', onClick)
    return () => {
      active = false
      document.removeEventListener('click', onClick)
      pauseAnalytics()
    }
  }, [config, locale])

  return null
}
