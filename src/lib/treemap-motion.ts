// Keep viewport reflows out of an in-flight zoom, and advance navigation only
// after D3 finishes the preceding step (not on a wall-clock timer).
export function createTreemapMotion<T>({
  zoom,
  resize,
  pauseMs = 250,
}: {
  zoom: (node: T, final: boolean) => Promise<boolean>
  resize: () => void
  pauseMs?: number
}) {
  let view = 0
  let navigation = 0
  let animating = false
  let navigating = false
  let resizePending = false
  let disposed = false
  let pauseTimer: ReturnType<typeof setTimeout> | undefined
  let finishPause: (() => void) | undefined
  const flushResize = () => {
    if (!disposed && resizePending && !animating && !navigating) {
      resizePending = false
      resize()
    }
  }
  const cancelNavigation = () => {
    navigation++
    navigating = false
    clearTimeout(pauseTimer)
    finishPause?.()
    finishPause = undefined
    flushResize()
  }
  return {
    beginView() {
      const id = ++view
      animating = true
      return (complete?: () => void) => {
        if (disposed || id !== view) return false
        animating = false
        complete?.()
        flushResize()
        return true
      }
    },
    requestResize() {
      resizePending = true
      flushResize()
    },
    cancelNavigation,
    async navigate(steps: T[]) {
      cancelNavigation()
      const id = navigation
      navigating = true
      try {
        for (let index = 0; index < steps.length; index++) {
          if (disposed || id !== navigation) return
          const completed = await zoom(steps[index], index === steps.length - 1)
          if (!completed || disposed || id !== navigation) return
          if (index < steps.length - 1 && pauseMs > 0) {
            await new Promise<void>((resolve) => {
              finishPause = resolve
              pauseTimer = setTimeout(resolve, pauseMs)
            })
            finishPause = undefined
          }
        }
      } finally {
        if (id === navigation) {
          navigating = false
          flushResize()
        }
      }
    },
    dispose() {
      disposed = true
      view++
      cancelNavigation()
    },
  }
}
