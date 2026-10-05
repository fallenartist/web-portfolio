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

const MOBILE_BREAKPOINT = 768
type MetadataKind = Extract<TangledNodeKind, 'industry' | 'client' | 'agency' | 'tag'>

const METADATA_KINDS: MetadataKind[] = ['industry', 'client', 'agency', 'tag']

const KIND_LABELS = {
  root: 'Work',
  discipline: 'Discipline',
  project: 'Project',
  industry: 'Industries',
  client: 'Clients',
  agency: 'Agencies',
  tag: 'Tags',
} as const

const KIND_BREADCRUMBS: Record<TangledNodeKind, string> = {
  root: 'Work',
  discipline: 'Discipline',
  project: 'Project',
  industry: 'Industry',
  client: 'Client',
  agency: 'Agency',
  tag: 'Tag',
}

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

function nodePermalink(overviewPath: string, node: TangledTreeNode) {
  return `${overviewPath.replace(/\/$/, '')}/${node.kind}/${encodeURIComponent(node.slug)}`
}

export default function TangledTree({
  data,
  initialSelectedId,
  overviewPath,
}: {
  data: TangledTreeData
  initialSelectedId?: string
  overviewPath: string
}) {
  const router = useRouter()
  const { updateBreadcrumb } = useBreadcrumb()
  const containerRef = useRef<HTMLDivElement>(null)
  const linksRef = useRef<SVGGElement>(null)
  const resizeFrameRef = useRef<number | undefined>(undefined)
  const initialAnimationRef = useRef(false)
  const measuredSizeRef = useRef({ width: 0, height: 0 })
  const [containerSize, setContainerSize] = useState({ width: 1100, height: 700 })
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialSelectedId ?? null)
  const [visibleMetadataKinds, setVisibleMetadataKinds] = useState<Set<MetadataKind>>(
    () => new Set(METADATA_KINDS),
  )

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const applyMeasurement = (width: number, height: number) => {
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

      measuredSizeRef.current = next
      setContainerSize(next)
    }

    const initial = element.getBoundingClientRect()
    applyMeasurement(initial.width, initial.height)
    const observer = new ResizeObserver(([entry]) => {
      window.cancelAnimationFrame(resizeFrameRef.current ?? 0)
      resizeFrameRef.current = window.requestAnimationFrame(() => {
        applyMeasurement(entry.contentRect.width, entry.contentRect.height)
      })
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(resizeFrameRef.current ?? 0)
    }
  }, [])

  useEffect(() => {
    const onBreadcrumb = (event: Event) => {
      router.push((event as CustomEvent<string>).detail)
    }
    window.addEventListener('breadcrumb-click', onBreadcrumb)
    return () => window.removeEventListener('breadcrumb-click', onBreadcrumb)
  }, [overviewPath, router, updateBreadcrumb])

  const mobile = containerSize.width < MOBILE_BREAKPOINT
  const nodeSize = mobile ? 14 : 12
  const allNodes = useMemo(() => data.levels.flat(), [data.levels])
  const nodesById = useMemo(() => new Map(allNodes.map((node) => [node.id, node])), [allNodes])
  const nodesByPermalink = useMemo(
    () => new Map(allNodes.map((node) => [nodePermalink(overviewPath, node), node.id])),
    [allNodes, overviewPath],
  )
  const selectedNode = selectedNodeId ? nodesById.get(selectedNodeId) : undefined
  const displayColors = useMemo(() => buildDisplayColors(data), [data])
  const visibleLevels = useMemo<TangledTreeNode[][]>(
    () => [
      data.levels[0],
      data.levels[1],
      data.levels[2],
      data.levels[3].filter((node) => visibleMetadataKinds.has(node.kind as MetadataKind)),
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
      nodeMarkerWidth: nodeSize,
      padding: mobile ? 8 : 12,
      rootColumnWidth: mobile ? 48 : 88,
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
  }, [containerSize.height, containerSize.width, mobile, nodeSize, visibleLevels])

  useEffect(() => {
    const breadcrumbs = [
      { data: { title: 'WORK' }, path: '/' },
      { data: { title: 'Projects' }, path: overviewPath },
    ]
    if (selectedNode) {
      if (selectedNode.kind !== 'root') {
        breadcrumbs.push({
          data: { title: KIND_BREADCRUMBS[selectedNode.kind] },
          path: overviewPath,
        })
      }
      breadcrumbs.push({
        data: { title: selectedNode.title },
        path: nodePermalink(overviewPath, selectedNode),
      })
    }
    updateBreadcrumb(breadcrumbs)
  }, [overviewPath, selectedNode, updateBreadcrumb])

  useEffect(() => {
    const syncSelectionFromHistory = () => {
      setSelectedNodeId(nodesByPermalink.get(window.location.pathname) ?? null)
      setActiveNode(null)
    }
    window.addEventListener('popstate', syncSelectionFromHistory)
    return () => window.removeEventListener('popstate', syncSelectionFromHistory)
  }, [nodesByPermalink])

  useLayoutEffect(() => {
    if (initialAnimationRef.current) return
    const paths = linksRef.current?.querySelectorAll<SVGPathElement>('path[data-visible-link]')
    if (!paths?.length) return
    initialAnimationRef.current = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

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
  }, [])

  const active = useMemo(() => {
    const id = selectedNodeId || activeNode
    if (!id) return null
    const projectIds = new Set<string>()
    const nodeIds = new Set<string>([id])
    const linkIds = new Set<string>()
    const selected = layout.nodes.find((node) => node.id === id)
    if (!selected) return null

    const projects = layout.nodes.filter((node) => node.kind === 'project')
    if (selected.kind === 'root') {
      projects.forEach((project) => projectIds.add(project.id))
    } else if (selected.kind === 'discipline') {
      projects.forEach((project) => {
        if (project.parentIds.includes(selected.id)) projectIds.add(project.id)
      })
    } else if (selected.kind === 'project') {
      projectIds.add(selected.id)
    } else {
      selected.parentIds.forEach((projectId) => projectIds.add(projectId))
    }

    const disciplineIds = new Set<string>()
    projects.forEach((project) => {
      if (!projectIds.has(project.id)) return
      nodeIds.add(project.id)
      project.parentIds.forEach((disciplineId) => disciplineIds.add(disciplineId))
    })
    disciplineIds.forEach((disciplineId) => nodeIds.add(disciplineId))
    const root = layout.nodes.find((node) => node.kind === 'root')
    if (root && projectIds.size) nodeIds.add(root.id)

    for (const link of layout.links) {
      const rootLink = link.source.kind === 'discipline' && link.target.kind === 'root'
      if (projectIds.has(link.projectId) || (rootLink && disciplineIds.has(link.source.id))) {
        linkIds.add(link.id)
        nodeIds.add(link.source.id)
        nodeIds.add(link.target.id)
      }
    }
    return { linkIds, nodeIds }
  }, [activeNode, layout.links, layout.nodes, selectedNodeId])

  const bandStarts = useMemo(() => {
    const starts: TangledLayoutNode[] = []
    let previous: TangledTreeNode['kind'] | undefined
    for (const node of layout.nodes.filter((item) =>
      METADATA_KINDS.includes(item.kind as MetadataKind),
    )) {
      if (node.kind !== previous) starts.push(node)
      previous = node.kind
    }
    return starts
  }, [layout.nodes])

  const columnPositions = useMemo(() => {
    const first = (kind: TangledNodeKind) => layout.nodes.find((node) => node.kind === kind)?.x
    const disciplineNode = first('discipline') ?? layout.width / 4
    const projectNode = first('project') ?? layout.width / 2
    const metadataNode =
      METADATA_KINDS.map(first).find((position) => position != null) ??
      projectNode + layout.nodeWidth
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
    if (selectedNode?.kind === kind && visibleMetadataKinds.has(kind)) {
      setSelectedNodeId(null)
      window.history.pushState(null, '', overviewPath)
    }
    setVisibleMetadataKinds((current) => {
      const next = new Set(current)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })
  }

  const selectNode = (node: TangledTreeNode) => {
    setSelectedNodeId(node.id)
    setActiveNode(null)
    const nextPath = nodePermalink(overviewPath, node)
    if (window.location.pathname !== nextPath) window.history.pushState(null, '', nextPath)
  }

  const clearSelection = () => {
    setSelectedNodeId(null)
    setActiveNode(null)
    if (window.location.pathname !== overviewPath) window.history.pushState(null, '', overviewPath)
  }

  const handleNodeClick = (event: React.MouseEvent, node: TangledLayoutNode) => {
    event.preventDefault()
    event.stopPropagation()
    selectNode(node)
  }

  const handleNodeKeyDown = (event: React.KeyboardEvent, node: TangledLayoutNode) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    event.stopPropagation()
    selectNode(node)
  }

  const handleLinkClick = (event: React.MouseEvent, link: TangledLayoutLink) => {
    event.preventDefault()
    event.stopPropagation()
    const project = nodesById.get(link.projectId)
    if (project) selectNode(project)
  }

  const handleLinkKeyDown = (event: React.KeyboardEvent, link: TangledLayoutLink) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    const project = nodesById.get(link.projectId)
    if (project) selectNode(project)
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
        onClick={clearSelection}
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
                aria-label={`Select ${link.source.kind === 'project' ? link.source.title : link.target.title} relationship`}
                d={tangledLinkPath(link)}
                key={link.id}
                onClick={(event) => handleLinkClick(event, link)}
                onKeyDown={(event) => handleLinkKeyDown(event, link)}
                onFocus={() => setActiveNode(link.projectId)}
                onBlur={() => setActiveNode(null)}
                onMouseEnter={() => setActiveNode(link.projectId)}
                role="button"
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
              const relationshipSelected = Boolean(selectedNodeId && active?.nodeIds.has(node.id))
              const selected = selectedNodeId === node.id
              const showView = Boolean(
                selectedNodeId &&
                relationshipSelected &&
                (node.kind === 'root' || node.kind === 'discipline' || node.kind === 'project'),
              )
              const nodeHeight = nodeSize + node.height
              const targetHeight = mobile
                ? Math.max(44, nodeHeight + 8)
                : Math.max(28, nodeHeight + 8)
              const labelWidth = Math.max(28, node.columnWidth - nodeSize - 8)
              const labelY = mobile ? node.y - 22 : node.y - nodeHeight / 2 - 17
              return (
                <g
                  aria-label={`Select ${KIND_BREADCRUMBS[node.kind]} ${node.title}`}
                  aria-pressed={selected}
                  className={`${styles.node} ${node.kind === 'project' ? styles.projectNode : ''} ${muted ? styles.mutedNode : ''}`}
                  key={node.id}
                  onClick={(event) => handleNodeClick(event, node)}
                  onKeyDown={(event) => handleNodeKeyDown(event, node)}
                  onFocus={() => setActiveNode(node.id)}
                  onBlur={() => setActiveNode(null)}
                  onMouseEnter={() => setActiveNode(node.id)}
                  role="button"
                  tabIndex={0}
                >
                  <title>{`${KIND_LABELS[node.kind]}: ${node.title}`}</title>
                  <rect
                    className={styles.nodeOuter}
                    fill={
                      relationshipSelected ? '#111111' : (displayColors.get(node.id) ?? node.color)
                    }
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
                    style={{ fill: relationshipSelected ? '#111111' : '#ffffff' }}
                  />
                  <rect
                    className={styles.hitArea}
                    height={targetHeight}
                    width={Math.max(44, node.columnWidth - 4)}
                    x={node.x - 22}
                    y={node.y - targetHeight / 2}
                  />
                  <foreignObject
                    className={`${styles.nodeLabel} ${showView ? styles.selectedLabel : ''}`}
                    height={mobile ? 44 : 24}
                    width={labelWidth}
                    x={node.x + nodeSize / 2 + 5}
                    y={labelY}
                  >
                    <div className={styles.labelRow}>
                      <span className={styles.labelText}>{node.title}</span>
                      {showView && node.href.startsWith('/') ? (
                        <a
                          aria-label={`View ${node.title}`}
                          className={styles.viewLink}
                          href={node.href}
                          onClick={(event) => event.stopPropagation()}
                        >
                          View
                        </a>
                      ) : null}
                    </div>
                  </foreignObject>
                </g>
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
