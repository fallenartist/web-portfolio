'use client'

import { easeCubicOut, schemeCategory10, schemeDark2, schemeTableau10, select } from 'd3'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { useBreadcrumb } from '@/components/BreadcrumbProvider'
import type { TangledNodeKind, TangledTreeData, TangledTreeNode } from '@/lib/tangled-tree-data'
import {
  constructTangledTreeLayout,
  tangledLinkPath,
  type TangledLayoutLink,
  type TangledLayoutNode,
} from '@/lib/tangled-tree-layout'
import styles from './TangledTree.module.scss'

const RESIZE_DEBOUNCE = 140
const MOBILE_BREAKPOINT = 768
type MetadataKind = Extract<TangledNodeKind, 'industry' | 'client' | 'agency' | 'tag'>

const METADATA_KINDS: MetadataKind[] = ['industry', 'client', 'agency', 'tag']

const KIND_LABELS = {
  discipline: 'Discipline',
  project: 'Project',
  industry: 'Industries',
  client: 'Clients',
  agency: 'Agencies',
  tag: 'Tags',
} as const

function linkColor(link: TangledLayoutLink, colors: Map<string, string>) {
  const taxonomy = link.source.kind === 'project' ? link.target : link.source
  return colors.get(taxonomy.id) ?? taxonomy.color
}

function buildDisplayColors(data: TangledTreeData) {
  const colors = new Map<string, string>()
  const indexes: Record<'client' | 'agency' | 'tag', number> = {
    client: 0,
    agency: 0,
    tag: 0,
  }
  const palettes = {
    client: schemeCategory10,
    agency: schemeDark2,
    tag: schemeTableau10,
  }

  for (const node of data.levels.flat()) {
    if (node.kind === 'client' || node.kind === 'agency' || node.kind === 'tag') {
      const palette = palettes[node.kind]
      colors.set(node.id, palette[indexes[node.kind]++ % palette.length])
    } else {
      colors.set(node.id, node.color)
    }
  }
  return colors
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
  const [visibleMetadataKinds, setVisibleMetadataKinds] = useState<Set<MetadataKind>>(
    () => new Set(METADATA_KINDS),
  )

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
  const nodeSize = mobile ? 14 : 12
  const displayColors = useMemo(() => buildDisplayColors(data), [data])
  const visibleLevels = useMemo<TangledTreeNode[][]>(
    () => [
      data.levels[0],
      data.levels[1],
      data.levels[2].filter((node) => visibleMetadataKinds.has(node.kind as MetadataKind)),
    ],
    [data.levels, visibleMetadataKinds],
  )
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
      bandGap: mobile ? 54 : 48,
      padding: mobile ? 8 : 12,
    }
    const initial = constructTangledTreeLayout(visibleLevels, options)
    if (initial.height >= containerSize.height) return initial
    const scale = Math.min(1.35, containerSize.height / initial.height)
    return constructTangledTreeLayout(visibleLevels, {
      ...options,
      nodeHeight: baseNodeHeight * scale,
      levelPadding: options.levelPadding * scale,
      bandGap: options.bandGap * scale,
    })
  }, [containerSize.height, containerSize.width, mobile, visibleLevels])

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

  const columnPositions = useMemo(() => {
    const first = (level: number) => layout.nodes.find((node) => node.level === level)?.x
    const disciplineNode = first(0) ?? 0
    const projectNode = first(1) ?? layout.width / 3
    const metadataNode = first(2) ?? projectNode + layout.nodeWidth
    const discipline = disciplineNode + nodeSize
    const project = projectNode + nodeSize
    const metadata = metadataNode + nodeSize
    return {
      paddingLeft: `${discipline}px`,
      gridTemplateColumns: `${Math.max(1, project - discipline)}px ${Math.max(
        1,
        metadata - project,
      )}px minmax(0, 1fr)`,
    }
  }, [layout.nodeWidth, layout.nodes, layout.width, nodeSize])

  const toggleMetadataKind = (kind: MetadataKind) => {
    setActiveNode(null)
    setTouchNode(null)
    setVisibleMetadataKinds((current) => {
      const next = new Set(current)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })
  }

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

  return (
    <section className={styles.page} aria-label="Project relationship overview">
      <header className={styles.header}>
        <div className={styles.columns} style={columnPositions}>
          <span>Discipline</span>
          <span>Project</span>
          <div className={styles.metadataControls} aria-label="Visible relationship groups">
            {METADATA_KINDS.map((kind) => {
              const visible = visibleMetadataKinds.has(kind)
              return (
                <button
                  aria-pressed={visible}
                  className={visible ? styles.activeControl : undefined}
                  key={kind}
                  onClick={() => toggleMetadataKind(kind)}
                  type="button"
                >
                  {KIND_LABELS[kind]}
                </button>
              )
            })}
          </div>
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
                stroke={linkColor(link, displayColors)}
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
              <text x={node.x + nodeSize} y={node.y - node.height / 2 - 36} key={node.kind}>
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
                    fill={displayColors.get(node.id) ?? node.color}
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
