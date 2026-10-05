'use client'

import { easeCubicOut, select } from 'd3'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { useBreadcrumb } from '@/components/BreadcrumbProvider'
import type { TangledTreeData, TangledTreeNode } from '@/lib/tangled-tree-data'
import {
  constructTangledTreeLayout,
  tangledLinkPath,
  type TangledLayoutLink,
  type TangledLayoutNode,
} from '@/lib/tangled-tree-layout'
import styles from './TangledTree.module.scss'

const RESIZE_DEBOUNCE = 140
const MOBILE_BREAKPOINT = 768

const KIND_LABELS = {
  discipline: 'Discipline',
  project: 'Project',
  industry: 'Industries',
  client: 'Clients',
  agency: 'Agencies',
  tag: 'Tags',
} as const

function mutedColor(color: string) {
  const value = color.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(value)) return '#777777'
  const channel = (offset: number) => parseInt(value.slice(offset, offset + 2), 16)
  const mix = (number: number) => Math.round(number + (255 - number) * 0.28)
  return `rgb(${mix(channel(0))} ${mix(channel(2))} ${mix(channel(4))})`
}

function linkColor(link: TangledLayoutLink) {
  const taxonomy = link.source.kind === 'project' ? link.target : link.source
  return mutedColor(taxonomy.color)
}

function isCoarsePointer() {
  return window.matchMedia('(hover: none), (pointer: coarse)').matches
}

export default function TangledTree({
  data,
  overviewPath,
}: {
  data: TangledTreeData
  overviewPath: string
}) {
  const router = useRouter()
  const { updateBreadcrumb } = useBreadcrumb()
  const containerRef = useRef<HTMLDivElement>(null)
  const linksRef = useRef<SVGGElement>(null)
  const resizeTimerRef = useRef<number | undefined>(undefined)
  const measuredSizeRef = useRef({ width: 0, height: 0 })
  const [containerSize, setContainerSize] = useState({ width: 1100, height: 700 })
  const [layoutRevision, setLayoutRevision] = useState(0)
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [touchNode, setTouchNode] = useState<string | null>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const applyMeasurement = (width: number, height: number, immediate = false) => {
      const next = {
        width: Math.max(280, Math.round(width)),
        height: Math.max(240, Math.round(height)),
      }
      if (
        measuredSizeRef.current.width === next.width &&
        measuredSizeRef.current.height === next.height
      ) {
        return
      }

      const commit = () => {
        measuredSizeRef.current = next
        setContainerSize(next)
        setLayoutRevision((revision) => revision + 1)
      }
      window.clearTimeout(resizeTimerRef.current)
      if (immediate) commit()
      else resizeTimerRef.current = window.setTimeout(commit, RESIZE_DEBOUNCE)
    }

    const initial = element.getBoundingClientRect()
    applyMeasurement(initial.width, initial.height, true)
    const observer = new ResizeObserver(([entry]) => {
      applyMeasurement(entry.contentRect.width, entry.contentRect.height)
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
      window.clearTimeout(resizeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    updateBreadcrumb([
      { data: { title: 'WORK' }, path: '/' },
      { data: { title: 'Projects' }, path: overviewPath },
    ])
    const onBreadcrumb = (event: Event) => {
      router.push((event as CustomEvent<string>).detail)
    }
    window.addEventListener('breadcrumb-click', onBreadcrumb)
    return () => window.removeEventListener('breadcrumb-click', onBreadcrumb)
  }, [overviewPath, router, updateBreadcrumb])

  const mobile = containerSize.width < MOBILE_BREAKPOINT
  const layout = useMemo(() => {
    const baseNodeHeight = mobile ? 44 : 30
    const options = {
      targetWidth: containerSize.width,
      minimumNodeWidth: mobile ? 70 : 150,
      nodeHeight: baseNodeHeight,
      bundleWidth: mobile ? 2.5 : 10,
      levelPadding: mobile ? 12 : 18,
      curveRadius: mobile ? 8 : 14,
      metroDistance: 5,
      bandGap: mobile ? 36 : 34,
      padding: mobile ? 8 : 12,
    }
    const initial = constructTangledTreeLayout(data.levels, options)
    if (initial.height >= containerSize.height) return initial
    const scale = Math.min(1.35, containerSize.height / initial.height)
    return constructTangledTreeLayout(data.levels, {
      ...options,
      nodeHeight: baseNodeHeight * scale,
      levelPadding: options.levelPadding * scale,
      bandGap: options.bandGap * scale,
    })
  }, [containerSize.height, containerSize.width, data.levels, mobile])

  useLayoutEffect(() => {
    const paths = linksRef.current?.querySelectorAll<SVGPathElement>('path[data-visible-link]')
    if (!paths?.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    paths.forEach((path, index) => {
      const length = path.getTotalLength()
      select(path)
        .interrupt('layout')
        .attr('stroke-dasharray', `${length} ${length}`)
        .attr('stroke-dashoffset', length)
        .transition('layout')
        .delay(Math.min(index * 5, 180))
        .duration(480)
        .ease(easeCubicOut)
        .attr('stroke-dashoffset', 0)
        .on('end', () => {
          path.removeAttribute('stroke-dasharray')
          path.removeAttribute('stroke-dashoffset')
        })
    })

    return () => {
      paths.forEach((path) => select(path).interrupt('layout'))
    }
  }, [layout, layoutRevision])

  const active = useMemo(() => {
    const id = activeNode || touchNode
    if (!id) return null
    const projectIds = new Set<string>()
    const nodeIds = new Set<string>([id])
    const linkIds = new Set<string>()
    const selected = layout.nodes.find((node) => node.id === id)
    if (!selected) return null

    if (selected.kind === 'project') projectIds.add(selected.id)
    for (const link of layout.links) {
      if (link.source.id === id || link.target.id === id) projectIds.add(link.projectId)
    }
    for (const link of layout.links) {
      if (projectIds.has(link.projectId)) {
        linkIds.add(link.id)
        nodeIds.add(link.source.id)
        nodeIds.add(link.target.id)
      }
    }
    return { linkIds, nodeIds }
  }, [activeNode, layout.links, layout.nodes, touchNode])

  const projectHrefs = useMemo(
    () =>
      new Map(
        layout.nodes.filter((node) => node.kind === 'project').map((node) => [node.id, node.href]),
      ),
    [layout.nodes],
  )

  const bandStarts = useMemo(() => {
    const starts: TangledLayoutNode[] = []
    let previous: TangledTreeNode['kind'] | undefined
    for (const node of layout.nodes.filter((item) => item.level === 2)) {
      if (node.kind !== previous) starts.push(node)
      previous = node.kind
    }
    return starts
  }, [layout.nodes])

  const handleNodeClick = (event: React.MouseEvent, node: TangledLayoutNode) => {
    if (isCoarsePointer() && touchNode !== node.id) {
      event.preventDefault()
      event.stopPropagation()
      setTouchNode(node.id)
    }
  }

  const handleLinkClick = (event: React.MouseEvent, link: TangledLayoutLink) => {
    event.preventDefault()
    event.stopPropagation()
    if (isCoarsePointer() && touchNode !== link.projectId) {
      setTouchNode(link.projectId)
      return
    }
    const href = projectHrefs.get(link.projectId)
    if (href) router.push(href)
  }

  const handleLinkKeyDown = (event: React.KeyboardEvent, link: TangledLayoutLink) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    const href = projectHrefs.get(link.projectId)
    if (href) router.push(href)
  }

  if (!data.levels[1].length) {
    return <p className={styles.empty}>No projects are available for the overview.</p>
  }

  const nodeSize = mobile ? 14 : 12

  return (
    <section className={styles.page} aria-label="Project relationship overview">
      <header className={styles.header}>
        <div className={styles.columns} aria-hidden="true">
          <span>Discipline</span>
          <span>Project</span>
          <span>Industry / Client / Agency / Tags</span>
        </div>
      </header>

      <div
        className={styles.scroller}
        ref={containerRef}
        onClick={() => setTouchNode(null)}
        onMouseLeave={() => setActiveNode(null)}
      >
        <svg
          className={styles.canvas}
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="img"
          aria-label="Bundled connections between disciplines, projects, industries, clients, agencies and tags"
        >
          <g className={styles.links} ref={linksRef} aria-hidden="true">
            {layout.links.map((link) => (
              <path
                className={active && !active.linkIds.has(link.id) ? styles.mutedLink : undefined}
                data-visible-link="true"
                d={tangledLinkPath(link)}
                key={link.id}
                stroke={linkColor(link)}
              />
            ))}
          </g>

          <g className={styles.linkTargets}>
            {layout.links.map((link) => (
              <path
                aria-label={`Open ${link.source.kind === 'project' ? link.source.title : link.target.title}`}
                d={tangledLinkPath(link)}
                key={link.id}
                onClick={(event) => handleLinkClick(event, link)}
                onKeyDown={(event) => handleLinkKeyDown(event, link)}
                onFocus={() => setActiveNode(link.projectId)}
                onBlur={() => setActiveNode(null)}
                onMouseEnter={() => setActiveNode(link.projectId)}
                role="link"
                tabIndex={0}
              />
            ))}
          </g>

          <g className={styles.bandLabels} aria-hidden="true">
            {bandStarts.map((node) => (
              <text x={node.x + nodeSize} y={node.y - node.height / 2 - 24} key={node.kind}>
                {KIND_LABELS[node.kind]}
              </text>
            ))}
          </g>

          <g className={styles.nodes}>
            {layout.nodes.map((node) => {
              const muted = Boolean(active && !active.nodeIds.has(node.id))
              const nodeHeight = nodeSize + node.height
              const targetHeight = mobile
                ? Math.max(44, nodeHeight + 8)
                : Math.max(28, nodeHeight + 8)
              const labelWidth = Math.max(28, layout.nodeWidth - nodeSize - 8)
              return (
                <a
                  className={`${styles.node} ${node.kind === 'project' ? styles.projectNode : ''} ${muted ? styles.mutedNode : ''}`}
                  href={node.href}
                  key={node.id}
                  onClick={(event) => handleNodeClick(event, node)}
                  onFocus={() => setActiveNode(node.id)}
                  onBlur={() => setActiveNode(null)}
                  onMouseEnter={() => setActiveNode(node.id)}
                >
                  <title>{`${KIND_LABELS[node.kind]}: ${node.title}`}</title>
                  <rect
                    className={styles.nodeOuter}
                    fill={node.kind === 'project' ? '#111111' : mutedColor(node.color)}
                    height={nodeHeight}
                    rx={nodeSize / 2}
                    width={nodeSize}
                    x={node.x - nodeSize / 2}
                    y={node.y - nodeHeight / 2}
                  />
                  <rect
                    className={styles.nodeInner}
                    height={Math.max(2, nodeHeight - 4)}
                    rx={(nodeSize - 4) / 2}
                    width={nodeSize - 4}
                    x={node.x - (nodeSize - 4) / 2}
                    y={node.y - nodeHeight / 2 + 2}
                  />
                  {mobile ? (
                    <foreignObject
                      className={styles.mobileLabel}
                      height={44}
                      width={labelWidth}
                      x={node.x + nodeSize / 2 + 4}
                      y={node.y - 22}
                    >
                      <span>{node.title}</span>
                    </foreignObject>
                  ) : (
                    <text x={node.x + nodeSize / 2 + 5} y={node.y - nodeHeight / 2 - 7}>
                      {node.title}
                    </text>
                  )}
                  <rect
                    className={styles.hitArea}
                    height={targetHeight}
                    width={Math.max(44, layout.nodeWidth - 4)}
                    x={node.x - 22}
                    y={node.y - targetHeight / 2}
                  />
                </a>
              )
            })}
          </g>
        </svg>
      </div>
      <p className={styles.attribution}>
        Routing adapted from{' '}
        <a href="https://observablehq.com/@nitaku/tangled-tree-visualization-ii">
          Tangled Tree Visualization II
        </a>{' '}
        by Matteo Abrate.
      </p>
    </section>
  )
}
