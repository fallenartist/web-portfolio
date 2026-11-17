'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import * as d3 from 'd3'
import { createD3Lightbox } from '@/lib/lightbox'
import { coverMediaRect, proportionalMediaSize } from '@/lib/media-image'
import { treemapImageSource } from '@/lib/treemap-image'
import { createTreemapMotion } from '@/lib/treemap-motion'
import { createTreemapImageSwap } from '@/lib/treemap-image-swap'
import { useLocale } from '@/components/LocaleProvider'
import { useBreadcrumb } from '@/components/BreadcrumbProvider'
import ProjectStory from '@/components/ProjectStory/ProjectStory'
import { trackPageView } from '@/lib/analytics'
import type { LightboxImage, TreemapData, TreemapNode } from '@/types'
import styles from './Treemap.module.scss'

function pathFor(node: TreemapNode): string {
  return (
    '/' +
    node
      .ancestors()
      .reverse()
      .slice(1)
      .filter((n) => n.data.kind !== 'image')
      .map((n) => encodeURIComponent(n.data.slug))
      .join('/')
  )
}

function imageFor(
  node: TreemapData,
  width: number,
  height: number,
  preserveAspectRatio = false,
): string | null {
  return treemapImageSource(node, width, height, window.devicePixelRatio, preserveAspectRatio)
}

export default function Treemap({ data }: { data: TreemapData }) {
  const { text } = useLocale()
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigateRef = useRef<(path: string) => void>(() => {})
  const navigateProjectRef = useRef<(project: TreemapData) => void>(() => {})
  const pathname = usePathname()
  const { updateBreadcrumb } = useBreadcrumb()
  const [storyProject, setStoryProject] = useState<TreemapData | null>(null)
  const [storyVisible, setStoryVisible] = useState(false)
  const [storyFallbackImage, setStoryFallbackImage] = useState<string | undefined>()
  const [preferStoryFallback, setPreferStoryFallback] = useState(false)
  const [storyNeighbors, setStoryNeighbors] = useState<{
    previous: TreemapData | null
    next: TreemapData | null
  }>({ previous: null, next: null })

  useEffect(() => {
    const element = svgRef.current
    const container = containerRef.current
    if (!element || !container) return
    const svg = d3.select(element)
    svg.selectAll('*').remove()
    let width = element.clientWidth || 1
    let height = element.clientHeight || 1
    const treemap = d3
      .treemap<TreemapData>()
      .size([width, height])
      .tile(d3.treemapSquarify)
      .paddingInner(0)
      .round(true)
    const root = treemap(
      d3
        .hierarchy(data)
        .sum((d) =>
          (d.kind === 'image' && d.hero) || (d.kind === 'project' && !d.children?.length)
            ? (d.priority ?? 100)
            : 0,
        )
        .sort((a, b) => b.height - a.height || (b.value ?? 0) - (a.value ?? 0)),
    )
    const projectNodes: TreemapNode[] = []
    root.eachBefore((node) => {
      if (node.data.kind === 'project') projectNodes.push(node)
    })
    let current = root
    let disposed = false
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const schedule = (fn: () => void, delay: number) => {
      const id = setTimeout(() => {
        timers.delete(id)
        if (!disposed) fn()
      }, delay)
      timers.add(id)
      return id
    }
    const clearTimer = (id: ReturnType<typeof setTimeout> | undefined) => {
      if (id) {
        clearTimeout(id)
        timers.delete(id)
      }
    }
    const motion = createTreemapMotion<TreemapNode>({
      zoom: (node, final) => zoom(node, final),
      resize: resizeTreemap,
      pauseMs: duration ? 250 : 0,
    })
    const cancelProjectNavigation = motion.cancelNavigation
    const imageSwaps = createTreemapImageSwap()
    const lightbox = createD3Lightbox({
      labels: text,
      imagePathPrefix: '',
      transitionDuration: duration ? 400 : 0,
    })
    const x = d3.scaleLinear().domain([0, width]).range([0, width])
    const y = d3.scaleLinear().domain([0, height]).range([0, height])
    const livePalette = new Map([
      ['identity', 'rgb(250, 200, 0)'],
      ['interactive', 'rgb(50, 0, 250)'],
      ['offline', 'rgb(250, 0, 50)'],
    ])
    const color = d3
      .scaleOrdinal<string, string>()
      .range(['rgb(250, 200, 0)', 'rgb(50, 0, 250)', 'rgb(250, 0, 50)'])
    const level = (d: TreemapNode) =>
      ({ root: 0, discipline: 1, project: 2, image: 3 })[d.data.kind]
    const fill = (d: TreemapNode) => {
      let ancestor: TreemapNode | null = d
      while (ancestor && ancestor.data.kind !== 'discipline') ancestor = ancestor.parent
      const slug = ancestor?.data.slug || d.data.slug
      return ancestor?.data.color || livePalette.get(slug) || color(slug)
    }
    const heroCrop = (d: TreemapNode, containerWidth: number, containerHeight: number) =>
      coverMediaRect(
        containerWidth,
        containerHeight,
        d.data.width,
        d.data.height,
        d.data.focalX,
        d.data.focalY,
      )
    const cells = svg
      .selectAll<SVGGElement, TreemapNode>('g')
      .data(root.descendants(), (d) => d.data.id)
      .join('g')
      .attr('class', (d) => `${styles.node} ${styles['level' + level(d)]}`)
      .attr('role', 'button')
      .attr('aria-label', (d) => d.data.title || d.data.alt || text.viewImage)
      .classed(
        styles.loading,
        (d) => d.data.kind === 'image' || (d.data.kind === 'project' && Boolean(d.data.thumb)),
      )
    // Every asset reveals its own cell; the initial layout itself stays still.
    const revealCell = function (this: SVGImageElement) {
      d3.select(this.closest('g')).classed(styles.loading, false)
    }
    cells
      .append('rect')
      .attr('id', (d) => `tile-${d.data.id}`)
      .style('fill', fill)
    cells
      .append('clipPath')
      .attr('id', (d) => `clip-${d.data.id}`)
      .append('use')
      .attr('href', (d) => `#tile-${d.data.id}`)
    cells
      .filter((d) => d.data.kind !== 'image')
      .append('text')
      .attr('clip-path', (d) => `url(#clip-${d.data.id})`)
      .attr('class', styles.label)
      .text((d) => d.data.title || '?')
    cells
      .filter((d) => d.data.kind === 'project')
      .append('svg')
      .attr('overflow', 'hidden')
      .append('image')
      .on('load.reveal error.reveal', revealCell)
      .attr('href', (d) => d.data.thumb || null)
      .attr('class', styles.thumb)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('preserveAspectRatio', 'xMidYMid meet')
    cells
      .filter((d) => d.data.kind === 'image')
      .append('svg')
      .attr('overflow', 'hidden')
      .append('image')
      .on('load.reveal error.reveal', revealCell)
      .attr('href', (d) =>
        d.data.hero
          ? imageFor(d.data, d.x1 - d.x0, d.y1 - d.y0, true)
          : d.data.sizes?.thumbnail?.url || d.data.image || null,
      )
      .attr('class', styles.lores)
      .attr('x', (d) => (d.data.hero ? heroCrop(d, d.x1 - d.x0, d.y1 - d.y0).x : 0))
      .attr('y', (d) => (d.data.hero ? heroCrop(d, d.x1 - d.x0, d.y1 - d.y0).y : 0))
      .attr('width', (d) =>
        d.data.hero ? heroCrop(d, d.x1 - d.x0, d.y1 - d.y0).width : d.x1 - d.x0,
      )
      .attr('height', (d) =>
        d.data.hero ? heroCrop(d, d.x1 - d.x0, d.y1 - d.y0).height : d.y1 - d.y0,
      )
      .attr('preserveAspectRatio', 'xMidYMid slice')
    const titlePresentation = data.settings?.projectTitle
    const heroDimColor = /^#[0-9a-f]{6}$/i.test(titlePresentation?.dimColor || '')
      ? titlePresentation!.dimColor
      : '#000000'
    const heroDimOpacity =
      titlePresentation?.placement === 'overlay'
        ? Math.min(90, Math.max(0, titlePresentation.dimIntensity)) / 100
        : 0
    cells
      .filter((d) => d.data.kind === 'image' && d.data.hero === true)
      .append('rect')
      .attr('class', styles.heroOverlay)
      .attr('clip-path', (d) => `url(#clip-${d.data.id})`)
      .style('fill', heroDimColor)
      .style('fill-opacity', 0)
    // Preserve overlay stacking: discipline labels above projects above gallery images.
    cells.sort((a, b) => b.depth - a.depth)
    cells
      .filter((d) => d.data.kind === 'project')
      .append('foreignObject')
      .attr('class', styles.touchTitle)
      .attr('aria-hidden', 'true')
      .append('xhtml:div')
      .append('xhtml:span')
      .text((d) => d.data.title)

    function zoom(
      node: TreemapNode,
      changeHistory = false,
      preserveStory = false,
      transitionDuration = duration,
    ): Promise<boolean> {
      if (disposed) return Promise.resolve(false)
      const finishView = motion.beginView()
      const swapWhenReady = imageSwaps.beginView()
      const isProject = node.data.kind === 'project'
      if (isProject) {
        const projectIndex = projectNodes.indexOf(node)
        setStoryNeighbors({
          previous: projectNodes[projectIndex - 1]?.data || null,
          next: projectNodes[projectIndex + 1]?.data || null,
        })
        if (!preserveStory) {
          setStoryVisible(false)
          setPreferStoryFallback(false)
          const currentCover = cells
            .filter((d) => d.parent === node && d.data.hero === true)
            .select<SVGImageElement>('image')
          setStoryFallbackImage(
            currentCover.empty() ? undefined : currentCover.attr('href') || undefined,
          )
          setStoryProject(node.data)
        }
      } else {
        setStoryVisible(false)
        setStoryProject(null)
        setStoryNeighbors({ previous: null, next: null })
      }
      current = node
      if (changeHistory) {
        const path = pathFor(node)
        if (window.location.pathname !== path) window.history.pushState({}, '', path)
      }
      updateBreadcrumb(
        node
          .ancestors()
          .reverse()
          .filter((n) => n.data.kind !== 'image')
          .map((n) => ({ data: { title: n.data.title }, path: pathFor(n) })),
      )
      document.title = `${node.data.title} — ${data.settings?.siteTitle || text.portfolio}`
      trackPageView(pathFor(node), node.data.title, node.data.kind, node.data.slug)
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute('content', node.data.excerpt || node.data.title)
      const gap = window.innerWidth < 640 ? 2 : 4
      const viewportWidth = element!.clientWidth
      const viewportHeight = element!.clientHeight
      x.domain([node.x0, node.x1]).range([0, viewportWidth + gap])
      y.domain([node.y0, node.y1]).range([0, viewportHeight + gap])
      const w = (d: TreemapNode) => Math.max(0, x(d.x1) - x(d.x0))
      const h = (d: TreemapNode) => Math.max(0, y(d.y1) - y(d.y0))
      const innerW = (d: TreemapNode) => Math.max(0, w(d) - gap)
      const innerH = (d: TreemapNode) => Math.max(0, h(d) - gap)
      const transition = d3.transition().duration(transitionDuration).ease(d3.easeExpInOut)
      const cellTransition = cells
        .transition(transition)
        .attr('transform', (d) => `translate(${x(d.x0)},${y(d.y0)})`)
      cells.select('rect').transition(transition).attr('width', innerW).attr('height', innerH)
      const heroOverlays = cells.select<SVGRectElement>(`.${styles.heroOverlay}`)
      const heroOverlayTransition = heroOverlays
        .transition(transition)
        .attr('width', innerW)
        .attr('height', innerH)
        .style('fill-opacity', (d) => (isProject && d.parent === node ? heroDimOpacity : 0))
      cells
        .select('text')
        .transition(transition)
        .attr('x', (d) => innerW(d) / 2)
        .attr('y', (d) => innerH(d) / 2)
      cells.select('svg').transition(transition).attr('width', innerW).attr('height', innerH)
      cells
        .select('foreignObject')
        .transition(transition)
        .attr('x', 8)
        .attr('y', (d) => Math.max(4, innerH(d) - 70))
        .attr('width', (d) => Math.max(0, innerW(d) - 16))
        .attr('height', (d) => Math.max(0, Math.min(66, innerH(d) - 8)))
      cells
        .classed(styles.hide, (d) => d.data.kind !== 'image' && d.depth <= node.depth)
        .attr('tabindex', (d) =>
          d.parent === node && (d.data.kind !== 'image' || d.data.hero) ? 0 : -1,
        )
        .attr('aria-hidden', (d) =>
          d.parent === node && (d.data.kind !== 'image' || d.data.hero) ? null : 'true',
        )
      const images = cells.filter((d) => d.data.kind === 'image').select<SVGImageElement>('image')
      const targetSource = (d: TreemapNode) =>
        d.data.hero
          ? isProject && d.parent === node
            ? proportionalMediaSize(d.data.sizes, d.data.width, d.data.height)?.url ||
              d.data.image ||
              null
            : imageFor(
                d.data,
                Math.min(innerW(d), viewportWidth),
                Math.min(innerH(d), viewportHeight),
                true,
              )
          : d.parent === node
            ? imageFor(d.data, innerW(d), innerH(d))
            : d.data.sizes?.thumbnail?.url || d.data.image || null
      const imageTransition = images
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .transition(transition)
        .attr('x', (d) => (d.data.hero ? heroCrop(d, innerW(d), innerH(d)).x : 0))
        .attr('y', (d) => (d.data.hero ? heroCrop(d, innerW(d), innerH(d)).y : 0))
        .attr('width', (d) => (d.data.hero ? heroCrop(d, innerW(d), innerH(d)).width : innerW(d)))
        .attr('height', (d) => (d.data.hero ? heroCrop(d, innerW(d), innerH(d)).height : innerH(d)))
      const geometryFinished = Promise.all([
        cellTransition.end(),
        imageTransition.end(),
        heroOverlayTransition.end(),
      ])
      const coverReady: Promise<boolean>[] = []
      images.each((d, index, elements) => {
        const image = elements[index]
        const src = targetSource(d)
        if (!src) return
        const cover = isProject && d.parent === node && d.data.hero === true
        const visible =
          x(d.x1) > 0 && x(d.x0) < viewportWidth && y(d.y1) > 0 && y(d.y0) < viewportHeight
        if (!cover && !visible) return
        if (image.getAttribute('href') === src && !cover) return
        const ready = swapWhenReady(src, geometryFinished, () => {
          if (image.getAttribute('href') !== src) image.setAttribute('href', src)
        })
        // Visible tiles upgrade independently; only the selected cover gates
        // the story handoff. Off-screen images keep their existing source.
        if (cover) coverReady.push(ready)
      })
      return geometryFinished
        .then(() => Promise.all(coverReady))
        .then((decodedCovers) =>
          finishView(() => {
            if (isProject && !preserveStory) {
              container!.scrollTop = 0
              setPreferStoryFallback(decodedCovers.some((ready) => !ready))
              setStoryVisible(true)
            }
          }),
        )
        .catch(() => {
          finishView()
          return false
        })
    }
    function goToPath(path: string) {
      const target = root.descendants().find((d) => d.data.kind !== 'image' && pathFor(d) === path)
      // pushState also updates usePathname. That notification must not cancel
      // the transition which is already travelling to the same node.
      if (target && target !== current) {
        cancelProjectNavigation()
        void zoom(target)
      }
    }
    navigateRef.current = goToPath
    function animateToProject(project: TreemapData) {
      const target = projectNodes.find((node) => node.data.id === project.id)
      if (!target || target === current) return

      cancelProjectNavigation()
      setStoryVisible(false)
      container!.scrollTop = 0

      const currentAncestors = current.ancestors()
      const targetAncestors = target.ancestors()
      const commonAncestor = currentAncestors.find((node) => targetAncestors.includes(node)) || root
      const upward = currentAncestors.slice(1, currentAncestors.indexOf(commonAncestor) + 1)
      const downward = targetAncestors.slice(0, targetAncestors.indexOf(commonAncestor)).reverse()
      const steps = [...upward, ...downward]
      void motion.navigate(steps)
    }
    navigateProjectRef.current = animateToProject
    function activate(node: TreemapNode) {
      cancelProjectNavigation()
      if (node.data.kind === 'image' && node.data.image) {
        const images: LightboxImage[] = (node.parent?.children || [])
          .filter((n) => n.data.image)
          .map((n) => ({
            data: { id: n.data.id, image: n.data.image!, title: n.data.title, alt: n.data.alt },
          }))
        lightbox.open(
          {
            data: {
              id: node.data.id,
              image: node.data.image,
              title: node.data.title,
              alt: node.data.alt,
            },
          },
          images,
        )
      } else zoom(node, true)
    }
    cells
      .on('click', (_event, d) => activate(d))
      .on('keydown', (event: KeyboardEvent, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          activate(d)
        }
      })
    const onBreadcrumb = (event: Event) => {
      cancelProjectNavigation()
      const path = (event as CustomEvent<string>).detail
      const target = root.descendants().find((d) => d.data.kind !== 'image' && pathFor(d) === path)
      if (target) zoom(target, true)
    }
    const onPopState = () => {
      cancelProjectNavigation()
      goToPath(window.location.pathname)
    }
    window.addEventListener('breadcrumb-click', onBreadcrumb)
    window.addEventListener('popstate', onPopState)
    let resizeTimer: ReturnType<typeof setTimeout> | undefined
    function resizeTreemap() {
      const nextWidth = element!.clientWidth || 1
      const nextHeight = element!.clientHeight || 1
      if (nextWidth === width && nextHeight === height) return
      width = nextWidth
      height = nextHeight
      treemap.size([width, height])(root)
      void zoom(current, false, true, 0)
    }
    const observer = new ResizeObserver(() => {
      clearTimer(resizeTimer)
      resizeTimer = schedule(() => motion.requestResize(), 250)
    })
    observer.observe(element)
    zoom(
      root
        .descendants()
        .find((n) => n.data.kind !== 'image' && pathFor(n) === window.location.pathname) || root,
      false,
      false,
      0,
    )

    return () => {
      disposed = true
      motion.dispose()
      imageSwaps.dispose()
      observer.disconnect()
      for (const timer of timers) clearTimeout(timer)
      window.removeEventListener('breadcrumb-click', onBreadcrumb)
      window.removeEventListener('popstate', onPopState)
      svg.interrupt()
      svg.selectAll('*').interrupt().remove()
      lightbox.destroy()
      navigateRef.current = () => {}
      navigateProjectRef.current = () => {}
    }
  }, [data, text, updateBreadcrumb])

  useEffect(() => {
    navigateRef.current(pathname)
  }, [pathname])

  return (
    <div
      className={`${styles.treemapContainer} ${storyVisible ? styles.storyOpen : ''}`}
      ref={containerRef}
      data-project-scroll
    >
      <svg
        ref={svgRef}
        className={styles.treemap}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Portfolio projects"
      />
      {storyProject && (
        <div className={styles.storyStage} aria-hidden={!storyVisible} inert={!storyVisible}>
          <ProjectStory
            key={storyProject.id}
            project={storyProject}
            heroFallbackImage={storyFallbackImage}
            preferHeroFallback={preferStoryFallback}
            titleSettings={data.settings?.projectTitle}
            storyTextSettings={data.settings?.storyText}
            descriptionSettings={data.settings?.projectDescription}
            projectGuidePath={data.settings?.projectGuidePath}
            previousProject={storyNeighbors.previous}
            nextProject={storyNeighbors.next}
            onNavigateProject={(project) => navigateProjectRef.current(project)}
          />
        </div>
      )}
    </div>
  )
}
