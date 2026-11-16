export type ConsentChoice = 'accepted' | 'rejected'
export type AnalyticsConsent = ConsentChoice | 'pending'
export const CONSENT_STORAGE_KEY = 'portfolio-analytics-consent-v1'
export const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000
const changeEvent = 'portfolio-analytics-consent-changed'
type ConsentRecord = { version: 1; choice: ConsentChoice; expiresAt: number }
let memory: string | null = null
let memoryOnly = false

export function parseAnalyticsConsent(raw: string | null, now = Date.now()): ConsentRecord | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw)
    return value?.version === 1 &&
      ['accepted', 'rejected'].includes(value.choice) &&
      Number.isFinite(value.expiresAt) &&
      value.expiresAt > now &&
      value.expiresAt <= now + CONSENT_MAX_AGE_MS
      ? value
      : null
  } catch {
    return null
  }
}

function readRecord(): ConsentRecord | null {
  if (typeof window === 'undefined') return null
  try {
    return parseAnalyticsConsent(
      memoryOnly ? memory : window.localStorage.getItem(CONSENT_STORAGE_KEY),
    )
  } catch {
    return parseAnalyticsConsent(memory)
  }
}

export function getAnalyticsConsent(): AnalyticsConsent {
  return readRecord()?.choice || 'pending'
}

export function saveAnalyticsConsent(choice: ConsentChoice) {
  memory = JSON.stringify({ version: 1, choice, expiresAt: Date.now() + CONSENT_MAX_AGE_MS })
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, memory)
    memoryOnly = false
  } catch {
    memoryOnly = true
  }
  window.dispatchEvent(new Event(changeEvent))
}

export function subscribeAnalyticsConsent(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined
  const schedule = () => {
    clearTimeout(timer)
    const record = readRecord()
    if (record)
      timer = setTimeout(notify, Math.min(record.expiresAt - Date.now() + 10, 2_147_483_647))
  }
  const notify = () => {
    schedule()
    onChange()
  }
  const storage = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY || event.key === null) notify()
  }
  schedule()
  window.addEventListener(changeEvent, notify)
  window.addEventListener('storage', storage)
  window.addEventListener('focus', notify)
  document.addEventListener('visibilitychange', notify)
  return () => {
    clearTimeout(timer)
    window.removeEventListener(changeEvent, notify)
    window.removeEventListener('storage', storage)
    window.removeEventListener('focus', notify)
    document.removeEventListener('visibilitychange', notify)
  }
}

export const serverAnalyticsConsent = () => 'pending' as const

export function browserAllowsAnalytics() {
  if (typeof navigator === 'undefined') return false
  const privacy = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string }
  const legacy =
    typeof window !== 'undefined'
      ? (window as Window & { doNotTrack?: string }).doNotTrack
      : undefined
  return ![privacy.doNotTrack, privacy.msDoNotTrack, privacy.globalPrivacyControl, legacy].some(
    (value) => value === true || value === '1' || value === 'yes',
  )
}

// Also clear old tracking state when the SDK was never loaded in this tab
// (for example, an IP-excluded visitor withdrawing an earlier choice).
export function clearAnalyticsStorage(token: string | undefined) {
  if (!token || !/^[a-zA-Z0-9_-]+$/.test(token) || typeof window === 'undefined') return
  const prefix = `ph_${token}_`
  try {
    for (const name of document.cookie.split(';').map((part) => part.trim().split('=')[0])) {
      if (!name.startsWith(prefix)) continue
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`
      const parts = window.location.hostname.split('.')
      for (let i = 0; i < parts.length - 1; i++) {
        document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${parts.slice(i).join('.')}; SameSite=Lax`
      }
    }
  } catch {
    /* Tracking storage can be unavailable in private browsing. */
  }
  for (const kind of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[kind]
      const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i))
      keys.forEach((key) => {
        if (key?.startsWith(prefix)) storage.removeItem(key)
      })
    } catch {
      /* Keep the consent controls working without browser storage. */
    }
  }
}
