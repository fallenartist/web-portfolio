'use client'

import { useEffect } from 'react'
import { useLocale } from '@/components/LocaleProvider'
import {
  isLocalAnalyticsHost,
  setAnalyticsSink,
  trackEvent,
  trackCurrentPageView,
} from '@/lib/analytics'
import {
  getAnalyticsConsent,
  browserAllowsAnalytics,
  subscribeAnalyticsConsent,
} from '@/lib/analytics-consent'
import { createConsentAnalyticsSession } from '@/lib/consent-analytics-session'
import { getPostHogOptions } from '@/lib/posthog-options'

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
    const allowed = () => active && getAnalyticsConsent() === 'accepted' && browserAllowsAnalytics()
    const referrer = document.referrer ? new URL(document.referrer) : null
    const source =
      referrer && referrer.origin !== window.location.origin ? referrer.hostname : 'Direct'
    const stop = createConsentAnalyticsSession({
      token: config.token,
      allowed,
      subscribe: subscribeAnalyticsConsent,
      load: () => import('posthog-js').then(({ default: posthog }) => posthog),
      onStop: () => setAnalyticsSink(null),
      options: getPostHogOptions(config, allowed),
      onReady: (posthog) => {
        setAnalyticsSink(({ name, properties, timestamp }) => {
          if (!allowed()) return
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
        trackCurrentPageView()
      },
    })

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
      stop()
    }
  }, [config, locale])

  return null
}
