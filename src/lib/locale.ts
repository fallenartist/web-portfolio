export const LOCALES = ['en', 'pl'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_COOKIE = 'portfolio-language'
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'pl'
}

export function availableLocales(languages?: { polishEnabled?: boolean | null } | null): Locale[] {
  return languages?.polishEnabled === true ? ['en', 'pl'] : ['en']
}

export function resolveLocale(
  preference?: string | null,
  acceptLanguage?: string | null,
  available: readonly Locale[] = LOCALES,
): Locale {
  if (isLocale(preference) && available.includes(preference)) return preference

  const languages = (acceptLanguage || '').split(',').map((entry, index) => {
    const [language, ...parameters] = entry.trim().toLowerCase().split(';')
    const quality = parameters.find((parameter) => parameter.trim().startsWith('q='))
    const weight = quality ? Number(quality.trim().slice(2)) : 1
    return { language: language.split('-')[0], weight, index }
  })
  languages.sort((a, b) => b.weight - a.weight || a.index - b.index)
  for (const { language, weight } of languages) {
    if (
      Number.isFinite(weight) &&
      weight > 0 &&
      weight <= 1 &&
      isLocale(language) &&
      available.includes(language)
    )
      return language
  }
  return DEFAULT_LOCALE
}

export function languageSwitchURL(href: string, locale: Locale): URL {
  const url = new URL(href)
  url.searchParams.set('lang', locale)
  return url
}

export const dictionaries = {
  en: {
    language: 'Language',
    up: 'Go up one level',
    breadcrumb: 'Breadcrumb',
    toggleMenu: 'Toggle menu',
    navigation: 'Main navigation',
    portfolio: 'Design Portfolio',
    projects: 'Projects',
    all: 'All',
    view: 'View',
    select: 'Select',
    relationship: 'relationship',
    guide: 'Project guide',
    instruction: 'Select a node or connection to explore related projects.',
    empty: 'No projects are available for the overview.',
    diagram:
      'Bundled connections between disciplines, projects, industries, clients, agencies and tags',
    kinds: {
      root: 'Work',
      discipline: 'Discipline',
      project: 'Project',
      industry: 'Industry',
      client: 'Client',
      agency: 'Agency',
      tag: 'Tag',
    },
    industries: 'Industries',
    tags: 'Tags',
    previousProject: 'Previous project',
    nextProject: 'Next project',
    adjacentProjects: 'Adjacent projects',
    openWebsite: 'Open website',
    newWindow: 'in a new window',
    play: 'Play',
    video: 'video',
    vimeoVideo: 'Vimeo video',
    wholeVideo: 'Show the whole video',
    fillVideo: 'Fill the hero with the video',
    viewImage: 'View image',
    images: 'Project images',
    close: 'Close',
    previousImage: 'Previous image',
    nextImage: 'Next image',
  },
  pl: {
    language: 'Język',
    up: 'Przejdź poziom wyżej',
    breadcrumb: 'Ścieżka nawigacji',
    toggleMenu: 'Otwórz lub zamknij menu',
    navigation: 'Nawigacja główna',
    portfolio: 'Portfolio projektowe',
    projects: 'Projekty',
    all: 'Wszystkie',
    view: 'Zobacz',
    select: 'Wybierz',
    relationship: 'powiązanie',
    guide: 'Mapa projektów',
    instruction: 'Wybierz element lub połączenie, aby odkryć powiązane projekty.',
    empty: 'Brak projektów do wyświetlenia na mapie.',
    diagram: 'Połączenia między dyscyplinami, projektami, branżami, klientami, agencjami i tagami',
    kinds: {
      root: 'Prace',
      discipline: 'Dyscyplina',
      project: 'Projekt',
      industry: 'Branża',
      client: 'Klient',
      agency: 'Agencja',
      tag: 'Tag',
    },
    industries: 'Branże',
    tags: 'Tagi',
    previousProject: 'Poprzedni projekt',
    nextProject: 'Następny projekt',
    adjacentProjects: 'Sąsiednie projekty',
    openWebsite: 'Otwórz stronę',
    newWindow: 'w nowym oknie',
    play: 'Odtwórz',
    video: 'film',
    vimeoVideo: 'Film Vimeo',
    wholeVideo: 'Pokaż cały film',
    fillVideo: 'Wypełnij obszar filmu',
    viewImage: 'Zobacz obraz',
    images: 'Zdjęcia projektu',
    close: 'Zamknij',
    previousImage: 'Poprzedni obraz',
    nextImage: 'Następny obraz',
  },
}

export type Dictionary = (typeof dictionaries)[Locale]
