'use client'

import { useEffect, useRef } from 'react'
import type { PlayerEventMap } from '@vimeo/player'
import { trackEvent } from '@/lib/analytics'
import { createVideoWatchTracker } from '@/lib/video-analytics'
import { getVideoEmbed } from '@/lib/video-embed'

export function useVideoAnalytics({
  url,
  enabled,
  autoplay,
  placement,
  label,
  blockID = '',
}: {
  url: string
  enabled: boolean
  autoplay: boolean
  placement: 'hero' | 'story' | 'page'
  label: string
  blockID?: string
}) {
  const ref = useRef<HTMLIFrameElement>(null)
  const trackerRef = useRef<ReturnType<typeof createVideoWatchTracker> | null>(null)
  const videoID = getVideoEmbed(url)?.id || ''

  useEffect(() => {
    if (!enabled || !ref.current || !videoID) return
    let active = true
    let detach: (() => void) | undefined
    // Keep a viewing across iframe URL changes (e.g. the hero fit/controls toggle).
    const tracker =
      trackerRef.current ??
      createVideoWatchTracker(
        {
          video_key: `${window.location.pathname}:${placement}:${blockID}:${videoID}`,
          video_id: videoID,
          video_label: label,
          project_path: window.location.pathname,
          page_path: window.location.pathname,
          placement,
          autoplay,
          viewing_id:
            globalThis.crypto?.randomUUID?.() ??
            `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        },
        trackEvent,
      )
    trackerRef.current = tracker
    tracker.visibility(document.visibilityState !== 'hidden')
    const iframe = ref.current
    void import('@vimeo/player')
      .then(async ({ default: Player }) => {
        if (!active) return
        const player = new Player(iframe)
        const removeListeners: (() => void)[] = []
        const listen = (
          event: 'playing' | 'timeupdate' | 'pause' | 'seeking' | 'seeked' | 'ended',
          handler: (data: PlayerEventMap['playing']) => void,
        ) => {
          player.on(event, handler)
          removeListeners.push(() => player.off(event, handler))
        }
        listen('playing', tracker.play)
        listen('timeupdate', tracker.update)
        listen('pause', tracker.pause)
        listen('seeking', tracker.seeking)
        listen('seeked', tracker.seeked)
        listen('ended', tracker.ended)
        const onRate = ({ playbackRate }: PlayerEventMap['playbackratechange']) =>
          tracker.rate(playbackRate)
        player.on('playbackratechange', onRate)
        removeListeners.push(() => player.off('playbackratechange', onRate))
        detach = () => removeListeners.forEach((remove) => remove())
        try {
          await player.ready()
          const [paused, seconds, duration, rate] = await Promise.all([
            player.getPaused(),
            player.getCurrentTime(),
            player.getDuration(),
            player.getPlaybackRate(),
          ])
          if (!active) return
          tracker.rate(rate)
          if (paused) tracker.update({ seconds, duration })
          else if (seconds > 0) tracker.play({ seconds, duration })
        } catch {
          // Playback and navigation must still work if Vimeo blocks its API.
        }
      })
      .catch(() => {})
    return () => {
      active = false
      detach?.()
    }
  }, [enabled, url, videoID, placement, label, blockID, autoplay])

  useEffect(() => {
    const visibility = () => trackerRef.current?.visibility(document.visibilityState !== 'hidden')
    // Hidden-tab snapshots retain progress if the browser never delivers pagehide.
    const leave = () => trackerRef.current?.leave()
    const resume = (event: PageTransitionEvent) => {
      if (event.persisted) trackerRef.current?.resume()
    }
    window.addEventListener('pagehide', leave)
    window.addEventListener('pageshow', resume)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      leave()
      trackerRef.current = null
      window.removeEventListener('pagehide', leave)
      window.removeEventListener('pageshow', resume)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])
  return ref
}
