import type { Setting } from '@/payload-types'
import type { Locale } from '@/lib/locale'

export const cookieDefaults = {
  en: {
    title: 'Cookies!',
    message:
      'Actually, just one cookie needed to better understand my visitors. Will you allow to use cookies for analytics?',
    details:
      'Includes approximate location, click activity and session recordings. Form input values are masked.',
    acceptLabel: 'Sure!',
    rejectLabel: 'Reject',
    privacyLabel: 'Privacy details',
  },
  pl: {
    title: 'Ciasteczka!',
    message:
      'Właściwie to wystarczy jedno ciasteczko, aby lepiej poznać odwiedzających moją stronę. Czy pozwolisz na używanie plików cookie do analityki?',
    details:
      'Obejmuje przybliżoną lokalizację, kliknięcia i nagrania sesji. Wartości pól formularzy są maskowane.',
    acceptLabel: 'Jasne!',
    rejectLabel: 'Odrzucam',
    privacyLabel: 'Szczegóły prywatności',
  },
}

export interface CookieBannerSettings {
  title: string
  message: string
  acceptLabel: string
  rejectLabel: string
  privacyLabel: string
  privacyHref?: string
  iconURL?: string
}

export function getCookieBannerSettings(
  settings: Setting['cookies'],
  locale: Locale,
): CookieBannerSettings {
  const defaults = cookieDefaults[locale]
  const page = settings?.privacyPage
  const icon = settings?.icon
  return {
    title: settings?.title?.trim() || defaults.title,
    message: settings?.message?.trim() || defaults.message,
    acceptLabel: settings?.acceptLabel?.trim() || defaults.acceptLabel,
    rejectLabel: settings?.rejectLabel?.trim() || defaults.rejectLabel,
    privacyLabel: settings?.privacyLabel?.trim() || defaults.privacyLabel,
    privacyHref:
      page && typeof page === 'object' && page._status === 'published'
        ? `/${encodeURIComponent(page.slug)}`
        : undefined,
    iconURL: icon && typeof icon === 'object' ? icon.url || undefined : undefined,
  }
}
