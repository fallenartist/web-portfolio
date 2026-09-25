'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import * as d3 from 'd3'
import { createD3Lightbox } from '@/lib/lightbox'
import { useBreadcrumb } from '@/components/BreadcrumbProvider'
import ProjectStory from '@/components/ProjectStory/ProjectStory'
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

function imageFor(node: TreemapData, width: number, height: number): string | null {
  const target = Math.max(width, height) * window.devicePixelRatio
  const sizes = node.sizes
  for (const name of ['thumbnail', 'small', 'medium', 'large'] as const) {
    const image = sizes?.[name]
    if (image?.url && Math.max(image.width || 0, image.height || 0) >= target) return image.url
  }
  return node.image || null
}

export default function Treemap({ data }: { data: TreemapData }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigateRef = useRef<(path: string) => void>(() => {})
  const navigateProjectRef = useRef<(project: TreemapData) => void>(() => {})
  const pathname = usePathname()
  const { updateBreadcrumb } = useBreadcrumb()
  const [storyProject, setStoryProject] = useState<TreemapData | null>(null)
  const [storyVisible, setStoryVisible] = useState(false)
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
    let projectMode = false
    let storyTimer: ReturnType<typeof setTimeout> | undefined
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
    const lightbox = createD3Lightbox({
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
    const level = (d: TreemapNode) => ({ root: 0, category: 1, project: 2, image: 3 })[d.data.kind]
    const fill = (d: TreemapNode) => {
      let ancestor: TreemapNode | null = d
      while (ancestor && ancestor.data.kind !== 'category') ancestor = ancestor.parent
      const slug = ancestor?.data.slug || d.data.slug
      return ancestor?.data.color || livePalette.get(slug) || color(slug)
    }
    const cells = svg
      .selectAll<SVGGElement, TreemapNode>('g')
      .data(root.descendants(), (d) => d.data.id)
      .join('g')
      .attr('class', (d) => `${styles.node} ${styles['level' + level(d)]}`)
      .attr('role', 'button')
      .attr('aria-label', (d) => d.data.title || d.data.alt || 'View image')
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
      .attr('href', (d) => d.data.sizes?.thumbnail?.url || d.data.image || null)
      .attr('class', styles.lores)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('preserveAspectRatio', 'xMidYMid slice')
    // Preserve overlay stacking: category labels above projects above gallery images.
    cells.sort((a, b) => b.depth - a.depth)

    function zoom(
      node: TreemapNode,
      changeHistory = false,
      preserveStory = false,
      transitionDuration = duration,
    ) {
      if (disposed) return
      const isProject = node.data.kind === 'project'
      projectMode = isProject
      clearTimer(storyTimer)
      if (isProject) {
        const projectIndex = projectNodes.indexOf(node)
        setStoryNeighbors({
          previous: projectNodes[projectIndex - 1]?.data || null,
          next: projectNodes[projectIndex + 1]?.data || null,
        })
        if (!preserveStory) {
          setStoryVisible(false)
          setStoryProject(node.data)
          storyTimer = schedule(() => {
            container!.scrollTop = 0
            setStoryVisible(true)
          }, duration)
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
      document.title = `${node.data.title} — ${data.settings?.siteTitle || 'Design Portfolio'}`
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
      cells.transition(transition).attr('transform', (d) => `translate(${x(d.x0)},${y(d.y0)})`)
      cells.select('rect').transition(transition).attr('width', innerW).attr('height', innerH)
      cells
        .select('text')
        .transition(transition)
        .attr('x', (d) => innerW(d) / 2)
        .attr('y', (d) => innerH(d) / 2)
      cells.select('svg').transition(transition).attr('width', innerW).attr('height', innerH)
      cells
        .classed(styles.hide, (d) => d.data.kind !== 'image' && d.depth <= node.depth)
        .attr('tabindex', (d) =>
          d.parent === node && (d.data.kind !== 'image' || d.data.hero) ? 0 : -1,
        )
        .attr('aria-hidden', (d) =>
          d.parent === node && (d.data.kind !== 'image' || d.data.hero) ? null : 'true',
        )
      cells
        .filter((d) => d.data.kind === 'image')
        .select('image')
        .attr('href', (d) =>
          d.parent === node
            ? imageFor(d.data, innerW(d), innerH(d))
            : d.data.sizes?.thumbnail?.url || d.data.image || null,
        )
    }
    function goToPath(path: string) {
      const target = root.descendants().find((d) => d.data.kind !== 'image' && pathFor(d) === path)
      if (target && target !== current) zoom(target)
    }
    navigateRef.current = goToPath
    function animateToProject(project: TreemapData) {
      const target = projectNodes.find((node) => node.data.id === project.id)
      if (!target || target === current) return

      clearTimer(storyTimer)
      setStoryVisible(false)
      container!.scrollTop = 0

      const currentAncestors = current.ancestors()
      const targetAncestors = target.ancestors()
      const commonAncestor = currentAncestors.find((node) => targetAncestors.includes(node)) || root
      const upward = currentAncestors.slice(1, currentAncestors.indexOf(commonAncestor) + 1)
      const downward = targetAncestors.slice(0, targetAncestors.indexOf(commonAncestor)).reverse()
      const steps = [...upward, ...downward]
      const stepDuration = duration || 0

      steps.forEach((step, index) => {
        schedule(
          () => zoom(step, step === target, false, stepDuration),
          index * stepDuration,
        )
      })
    }
    navigateProjectRef.current = animateToProject
    function activate(node: TreemapNode) {
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
      const path = (event as CustomEvent<string>).detail
      const target = root.descendants().find((d) => d.data.kind !== 'image' && pathFor(d) === path)
      if (target) zoom(target, true)
    }
    const onPopState = () => goToPath(window.location.pathname)
    window.addEventListener('breadcrumb-click', onBreadcrumb)
    window.addEventListener('popstate', onPopState)
    let resizeTimer: ReturnType<typeof setTimeout> | undefined
    const observer = new ResizeObserver(() => {
      clearTimer(resizeTimer)
      resizeTimer = schedule(() => {
        const nextWidth = element.clientWidth || 1
        const nextHeight = element.clientHeight || 1
        if (nextWidth === width && nextHeight === height) return
        width = nextWidth
        height = nextHeight
        treemap.size([width, height])(root)
        zoom(current, false, true, 0)
      }, 250)
    })
    observer.observe(element)
    zoom(
      root
        .descendants()
        .find((n) => n.data.kind !== 'image' && pathFor(n) === window.location.pathname) || root,
    )

    // Keep autoplay opt-in settings, but cancel every scheduled step on activity/unmount.
    const featured = root.descendants().filter((n) => n.data.featured && n.data.kind === 'image')
    let autoplayTimer: ReturnType<typeof setTimeout> | undefined
    let index = 0
    function play() {
      if (projectMode) return
      const node = featured[index++ % featured.length]
      if (!node) return
      zoom(node, false)
      autoplayTimer = schedule(() => {
        if (node.parent) zoom(node.parent, false)
        autoplayTimer = schedule(play, data.settings?.autoplayInterval ?? 3000)
      }, data.settings?.autoplayInterval ?? 3000)
    }
    function resetIdle() {
      clearTimer(autoplayTimer)
      if (data.settings?.enableAutoplay && featured.length && duration && !document.hidden) {
        autoplayTimer = schedule(play, data.settings.autoplayDelay)
      }
    }
    const activity = ['pointermove', 'pointerdown', 'keydown', 'scroll'] as const
    for (const event of activity) window.addEventListener(event, resetIdle, { passive: true })
    document.addEventListener('visibilitychange', resetIdle)
    resetIdle()
    return () => {
      disposed = true
      observer.disconnect()
      for (const timer of timers) clearTimeout(timer)
      window.removeEventListener('breadcrumb-click', onBreadcrumb)
      window.removeEventListener('popstate', onPopState)
      for (const event of activity) window.removeEventListener(event, resetIdle)
      document.removeEventListener('visibilitychange', resetIdle)
      svg.interrupt()
      svg.selectAll('*').interrupt().remove()
      lightbox.destroy()
      navigateRef.current = () => {}
      navigateProjectRef.current = () => {}
    }
  }, [data, updateBreadcrumb])

  useEffect(() => {
    navigateRef.current(pathname)
  }, [pathname])

  return (
    <div
      className={`${styles.treemapContainer} ${storyVisible ? styles.storyOpen : ''}`}
      ref={containerRef}
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
            project={storyProject}
            previousProject={storyNeighbors.previous}
            nextProject={storyNeighbors.next}
            onNavigateProject={(project) => navigateProjectRef.current(project)}
          />
        </div>
      )}
    </div>
  )
}
