export function decodeTreemapImage(src: string): Promise<boolean> {
  const image = new window.Image()
  image.decoding = 'async'
  image.src = src
  return new Promise((resolve) => {
    // A stalled request must not indefinitely block opening a project.
    const timer = setTimeout(() => resolve(false), 15_000)
    image.decode().then(
      () => {
        clearTimeout(timer)
        resolve(true)
      },
      () => {
        clearTimeout(timer)
        resolve(false)
      },
    )
  })
}

export function createTreemapImageSwap(decode = decodeTreemapImage) {
  let generation = 0
  let disposed = false
  let cancelCurrent = () => {}
  return {
    beginView() {
      cancelCurrent()
      const id = ++generation
      const cancelled = new Promise<boolean>((resolve) => {
        cancelCurrent = () => resolve(false)
      })
      return async (src: string, geometryFinished: Promise<unknown>, apply: () => void) => {
        if (disposed) return false
        try {
          const ready = await Promise.race([
            Promise.all([decode(src), geometryFinished]).then(([decoded]) => decoded),
            cancelled,
          ])
          if (!ready || disposed || id !== generation) return false
          apply()
          return true
        } catch {
          // Failed loads or interrupted motion leave the current image intact.
          return false
        }
      }
    },
    dispose() {
      disposed = true
      generation++
      cancelCurrent()
    },
  }
}
