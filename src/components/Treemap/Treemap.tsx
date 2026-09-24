'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import * as d3 from 'd3'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { createD3Lightbox } from '@/lib/lightbox'
import { useBreadcrumb } from '@/components/BreadcrumbProvider'
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
  const toggleInfoRef = useRef<() => void>(() => {})
  const pathname = usePathname()
  const { updateBreadcrumb } = useBreadcrumb()
  const [project, setProject] = useState<TreemapData | null>(null)
  const [infoVisible, setInfoVisible] = useState(false)

  useEffect(() => {
    const element = svgRef.current
    const container = containerRef.current
    if (!element || !container) return
    const svg = d3.select(element)
    svg.selectAll('*').remove()
    const width = element.clientWidth || 1
    const height = element.clientHeight || 1
    const root = d3
      .treemap<TreemapData>()
      .size([width, height])
      .tile(d3.treemapSquarify)
      .paddingInner(0)
      .round(true)(
      d3
        .hierarchy(data)
        .sum((d) =>
          d.kind === 'image' || (d.kind === 'project' && !d.children?.length)
            ? (d.priority ?? 100)
            : 0,
        )
        .sort((a, b) => b.height - a.height || (b.value ?? 0) - (a.value ?? 0)),
    )
    let current = root
    let infoOpen = false
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
    const color = d3.scaleOrdinal<string, string>(d3.schemeDark2)
    const level = (d: TreemapNode) => ({ root: 0, category: 1, project: 2, image: 3 })[d.data.kind]
    const fill = (d: TreemapNode) => {
      let ancestor: TreemapNode | null = d
      while (ancestor && ancestor.data.kind !== 'category') ancestor = ancestor.parent
      return ancestor?.data.color || color(ancestor?.data.slug || d.data.slug)
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
      .append('image')
      .attr('href', (d) => d.data.thumb || null)
      .attr('class', styles.thumb)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('preserveAspectRatio', 'xMidYMid meet')
    cells
      .filter((d) => d.data.kind === 'image')
      .append('svg')
      .append('image')
      .attr('clip-path', (d) => `url(#clip-${d.data.id})`)
      .attr('href', (d) => d.data.sizes?.thumbnail?.url || d.data.image || null)
      .attr('class', styles.lores)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('preserveAspectRatio', 'xMidYMid slice')
    // Preserve overlay stacking: category labels above projects above gallery images.
    cells.sort((a, b) => b.depth - a.depth)

    function setInfo(open: boolean) {
      infoOpen = open
      setInfoVisible(open)
    }
    function zoom(node: TreemapNode, changeHistory = false, preserveInfo = false) {
      if (disposed) return
      const isProject = node.data.kind === 'project'
      if (!preserveInfo) setInfo(isProject && window.innerWidth > 768)
      current = node
      setProject(isProject ? node.data : null)
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
      const transition = d3.transition().duration(duration).ease(d3.easeExpInOut)
      cells.transition(transition).attr('transform', (d) => `translate(${x(d.x0)},${y(d.y0)})`)
      cells
        .select('rect')
        .transition(transition)
        .attr('width', (d) => Math.max(0, w(d) - gap))
        .attr('height', (d) => Math.max(0, h(d) - gap))
      cells
        .select('text')
        .transition(transition)
        .attr('x', (d) => w(d) / 2)
        .attr('y', (d) => h(d) / 2)
      cells.select('svg').transition(transition).attr('width', w).attr('height', h)
      cells
        .classed(styles.hide, (d) => d.data.kind !== 'image' && d.depth <= node.depth)
        .attr('tabindex', (d) => (d.parent === node ? 0 : -1))
        .attr('aria-hidden', (d) => (d.parent === node ? null : 'true'))
      cells
        .filter((d) => d.data.kind === 'image')
        .select('image')
        .attr('href', (d) =>
          d.parent === node
            ? imageFor(d.data, w(d), h(d))
            : d.data.sizes?.thumbnail?.url || d.data.image || null,
        )
    }
    function goToPath(path: string) {
      const target = root.descendants().find((d) => d.data.kind !== 'image' && pathFor(d) === path)
      if (target && target !== current) zoom(target)
    }
    navigateRef.current = goToPath
    toggleInfoRef.current = () => {
      if (current.data.kind === 'project') setInfo(!infoOpen)
    }
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
      resizeTimer = schedule(() => zoom(current, false, true), 120)
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
      toggleInfoRef.current = () => {}
    }
  }, [data, updateBreadcrumb])

  useEffect(() => {
    navigateRef.current(pathname)
  }, [pathname])

  return (
    <div className={styles.treemapContainer} ref={containerRef}>
      <button
        type="button"
        className={`${styles.showInfo} ${project ? styles.show : ''}`}
        aria-label="Toggle project information"
        aria-expanded={infoVisible}
        onClick={() => toggleInfoRef.current()}
      >
        i
      </button>
      <div
        className={`${styles.info} ${infoVisible ? styles.visible : ''}`}
        aria-hidden={!infoVisible}
        inert={!infoVisible}
      >
        <div className={styles.infoWrapper}>
          {project?.desc ? <RichText data={project.desc} /> : project && <h1>{project.title}</h1>}
        </div>
      </div>
      <svg
        ref={svgRef}
        className={`${styles.treemap} ${infoVisible ? styles.infoVisible : ''}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Portfolio projects"
      />
    </div>
  )
}
