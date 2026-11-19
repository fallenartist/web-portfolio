'use client'

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useLocale } from '@/components/LocaleProvider'
import type { CookieBannerSettings } from '@/lib/cookie-settings'
import {
  clearAnalyticsStorage,
  getAnalyticsConsent,
  saveAnalyticsConsent,
  subscribeAnalyticsConsent,
} from '@/lib/analytics-consent'
import CookieIcon from './CookieIcon'
import styles from './CookieConsent.module.scss'

const CookieConsentContext = createContext<{
  label: string
  iconURL?: string
  openSettings: (returnFocus: HTMLElement | null) => void
} | null>(null)
export const useCookieConsent = () => useContext(CookieConsentContext)
const serverChoice = () => 'loading' as const

export default function CookieConsent({
  children,
  settings,
  prompt,
  projectToken,
}: {
  children: React.ReactNode
  settings: CookieBannerSettings
  prompt: boolean
  projectToken?: string
}) {
  const { locale } = useLocale()
  const choice = useSyncExternalStore(subscribeAnalyticsConsent, getAnalyticsConsent, serverChoice)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const panel = useRef<HTMLElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const visible =
    settings.enabled && (settingsOpen || (prompt && !dismissed && choice === 'pending'))
  useEffect(() => {
    if (visible) panel.current?.focus({ preventScroll: true })
  }, [visible])

  useEffect(() => {
    if (!settings.enabled || choice === 'pending' || choice === 'rejected')
      clearAnalyticsStorage(projectToken)
  }, [choice, projectToken, settings.enabled])

  const close = (dismiss = false) => {
    setSettingsOpen(false)
    setDismissed(dismiss)
    if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true })
  }
  const save = (next: 'accepted' | 'rejected') => {
    saveAnalyticsConsent(next)
    if (next === 'rejected') clearAnalyticsStorage(projectToken)
    close()
  }
  const label = locale === 'pl' ? 'Ustawienia plików cookie' : 'Cookie settings'

  return (
    <CookieConsentContext.Provider
      value={
        settings.enabled
          ? {
              label,
              iconURL: settings.iconURL,
              openSettings: (trigger) => {
                returnFocus.current = trigger
                setSettingsOpen(true)
              },
            }
          : null
      }
    >
      {children}
      {visible && (
        <section
          ref={panel}
          className={`${styles.banner} ph-no-capture`}
          role="dialog"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-description"
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              close(true)
            }
          }}
        >
          <div className={styles.heading}>
            <h2 id="cookie-consent-title">{settings.title}</h2>
            <span className={styles.icon}>
              <CookieIcon url={settings.iconURL} size={26} />
            </span>
          </div>
          <p id="cookie-consent-description">{settings.message}</p>
          {choice !== 'pending' && choice !== 'loading' && (
            <p className={styles.selection} role="status">
              {locale === 'pl'
                ? choice === 'accepted'
                  ? 'Zgoda na analitykę udzielona.'
                  : 'Brak zgody na analitykę.'
                : choice === 'accepted'
                  ? 'Analytics allowed.'
                  : 'Analytics not allowed.'}
            </p>
          )}
          {settings.privacyHref && (
            <a className={styles.privacy} href={settings.privacyHref}>
              {settings.privacyLabel}
            </a>
          )}
          <div className={styles.actions}>
            <button type="button" className={styles.accept} onClick={() => save('accepted')}>
              {settings.acceptLabel}
            </button>
            <button type="button" onClick={() => save('rejected')}>
              {settings.rejectLabel}
            </button>
          </div>
        </section>
      )}
    </CookieConsentContext.Provider>
  )
}
