export type VideoProvider = 'vimeo'
export type VideoPlayback = 'background' | 'standard'

export type VideoOptions = {
  autoplay?: boolean | null
  controls?: boolean | null
  loop?: boolean | null
  muted?: boolean | null
}

export type VideoEmbed = {
  embedURL: string
  id: string
  provider: VideoProvider
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

export function getVideoEmbed(
  value: string,
  options: VideoOptions | VideoPlayback = {},
): VideoEmbed | null {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return null
  }

  if (!['http:', 'https:'].includes(url.protocol)) return null

  const playbackOptions: VideoOptions =
    typeof options === 'string'
      ? options === 'background'
        ? { autoplay: true, controls: false, loop: true, muted: true }
        : { controls: true }
      : options
  const autoplay = playbackOptions.autoplay === true
  const muted = autoplay || playbackOptions.muted === true
  const controls = playbackOptions.controls !== false
  const loop = playbackOptions.loop === true

  const vimeo = vimeoDetails(url)
  if (vimeo) {
    const params = new URLSearchParams({ dnt: '1', playsinline: '1' })
    if (vimeo.hash) params.set('h', vimeo.hash)
    if (autoplay) params.set('autoplay', '1')
    if (!controls) params.set('controls', '0')
    if (muted) params.set('muted', '1')
    if (loop) params.set('loop', '1')
    if (autoplay || loop) params.set('autopause', '0')
    return {
      embedURL: `https://player.vimeo.com/video/${vimeo.id}?${params}`,
      id: vimeo.id,
      provider: 'vimeo',
    }
  }

  return null
}

export function validateVideoURL(value: null | string | undefined): true | string {
  return !value || getVideoEmbed(value) ? true : 'Enter a valid Vimeo video URL.'
}
