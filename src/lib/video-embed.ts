export type VideoProvider = 'vimeo' | 'youtube'
export type VideoPlayback = 'background' | 'standard'

export type VideoEmbed = {
  embedURL: string
  id: string
  provider: VideoProvider
}

function youtubeID(url: URL): string | undefined {
  const hostname = url.hostname.replace(/^www\./, '')
  if (hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0]
  if (!['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(hostname)) return
  if (url.pathname === '/watch') return url.searchParams.get('v') || undefined
  const [kind, id] = url.pathname.split('/').filter(Boolean)
  return ['embed', 'shorts', 'live'].includes(kind) ? id : undefined
}

function vimeoDetails(url: URL): { hash?: string; id: string } | undefined {
  const hostname = url.hostname.replace(/^www\./, '')
  if (!['vimeo.com', 'player.vimeo.com'].includes(hostname)) return
  const segments = url.pathname.split('/').filter(Boolean)
  const idIndex = segments.findIndex((segment) => /^\d+$/.test(segment))
  if (idIndex === -1) return
  const hash = url.searchParams.get('h') || segments[idIndex + 1]
  return { id: segments[idIndex], hash: hash && /^[a-z0-9]+$/i.test(hash) ? hash : undefined }
}

export function getVideoEmbed(value: string, playback: VideoPlayback = 'standard'): VideoEmbed | null {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return null
  }

  if (!['http:', 'https:'].includes(url.protocol)) return null

  const youtube = youtubeID(url)
  if (youtube && /^[\w-]{6,}$/.test(youtube)) {
    const params = new URLSearchParams({ playsinline: '1', rel: '0' })
    if (playback === 'background') {
      params.set('autoplay', '1')
      params.set('controls', '0')
      params.set('loop', '1')
      params.set('mute', '1')
      params.set('playlist', youtube)
    }
    return {
      embedURL: `https://www.youtube-nocookie.com/embed/${youtube}?${params}`,
      id: youtube,
      provider: 'youtube',
    }
  }

  const vimeo = vimeoDetails(url)
  if (vimeo) {
    const params = new URLSearchParams({ dnt: '1', playsinline: '1' })
    if (vimeo.hash) params.set('h', vimeo.hash)
    if (playback === 'background') {
      params.set('autopause', '0')
      params.set('autoplay', '1')
      params.set('background', '1')
      params.set('loop', '1')
      params.set('muted', '1')
    }
    return {
      embedURL: `https://player.vimeo.com/video/${vimeo.id}?${params}`,
      id: vimeo.id,
      provider: 'vimeo',
    }
  }

  return null
}

export function validateVideoURL(value: null | string | undefined): true | string {
  return !value || getVideoEmbed(value) ? true : 'Enter a valid Vimeo or YouTube video URL.'
}
