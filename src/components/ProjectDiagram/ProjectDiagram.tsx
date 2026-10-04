'use client'

import { easeCubicInOut, interpolateRgb, select } from 'd3'
import { sankey, type SankeyLink, type SankeyNode } from 'd3-sankey'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { useBreadcrumb } from '@/components/BreadcrumbProvider'
import type { ProjectDiagramData } from '@/lib/project-diagram'
import styles from './ProjectDiagram.module.scss'

type Column = 'discipline' | 'project' | 'industry'
type Direction = 'asc' | 'desc'
type SortMode = 'alphabetic' | 'count'
type SortState = { mode: SortMode; direction: Direction }

type DiagramNode = {
  id: string
  kind: Column
  title: string
  color: string
  href?: string
  layer: number
  order: number
  clientId?: string
  clientTitle?: string
}

type DiagramLink = {
  id: string
  projectId: string
  disciplineId: string
  industryId?: string
  disciplineColor: string
  industryColor: string
}

type LayoutNode = SankeyNode<DiagramNode, DiagramLink>
type LayoutLink = SankeyLink<DiagramNode, DiagramLink>

const INITIAL_CANVAS_WIDTH = 760
const FLOW_GAP = 3
const DESKTOP_NODE_SIZE = 20
const DESKTOP_NODE_PADDING = 14
const MOBILE_NODE_SIZE = 36
const MOBILE_HIT_PADDING = 4
const MOBILE_LABEL_HEIGHT = 34
const MOBILE_LABEL_GAP = 6
const MOBILE_CLIENT_LABEL_HEIGHT = 16
const MOBILE_CLIENT_LABEL_GAP = 1
const MOBILE_NODE_PADDING = MOBILE_LABEL_HEIGHT + MOBILE_LABEL_GAP + 10
const MOBILE_CLIENT_NODE_PADDING = MOBILE_NODE_PADDING + 28
const DESKTOP_DIAGRAM_TOP = 18
const RESIZE_DEBOUNCE = 160

const alphabetic = (direction: Direction) => (a: string, b: string) =>
  direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
const precise = (value: number) => Number(value.toFixed(3))

function linkPath(link: LayoutLink) {
  const source = link.source as LayoutNode
  const target = link.target as LayoutNode
  const x0 = precise((source.x1 ?? 0) + FLOW_GAP)
  const x1 = precise((target.x0 ?? 0) - FLOW_GAP)
  const y0 = precise(link.y0 ?? 0)
  const y1 = precise(link.y1 ?? 0)
  const middle = precise((x0 + x1) / 2)
  return `M${x0},${y0}C${middle},${y0} ${middle},${y1} ${x1},${y1}`
}

function nodeCenter(node: LayoutNode) {
  return precise(((node.y0 ?? 0) + (node.y1 ?? 0)) / 2)
}

export default function ProjectDiagram({ data }: { data: ProjectDiagramData }) {
  const router = useRouter()
  const { updateBreadcrumb } = useBreadcrumb()
  const containerRef = useRef<HTMLDivElement>(null)
  const linksRef = useRef<SVGGElement>(null)
  const nodesRef = useRef<SVGGElement>(null)
  const resizeTimerRef = useRef<number | undefined>(undefined)
  const measuredWidthRef = useRef<number | null>(null)
  const measuredMobileRef = useRef(false)
  const previousPathsRef = useRef(new Map<string, string>())
  const previousNodePositionsRef = useRef(new Map<string, number>())
  const entranceCompleteRef = useRef(false)
  const [width, setWidth] = useState(INITIAL_CANVAS_WIDTH)
  const [isMobile, setIsMobile] = useState(false)
  const [measured, setMeasured] = useState(false)
  const [sorts, setSorts] = useState<Record<Column, SortState>>({
    discipline: { mode: 'alphabetic', direction: 'asc' },
    project: { mode: 'alphabetic', direction: 'asc' },
    industry: { mode: 'alphabetic', direction: 'asc' },
  })
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const measure = () => {
      const nextWidth = Math.max(1, Math.round(element.getBoundingClientRect().width))
      const nextMobile = window.matchMedia('(max-width: 767px)').matches
      if (measuredWidthRef.current === nextWidth && measuredMobileRef.current === nextMobile) {
        return
      }

      if (measuredWidthRef.current == null) {
        measuredWidthRef.current = nextWidth
        measuredMobileRef.current = nextMobile
        setWidth(nextWidth)
        setIsMobile(nextMobile)
        setMeasured(true)
        return
      }

      setMeasured(false)
      window.clearTimeout(resizeTimerRef.current)
      resizeTimerRef.current = window.setTimeout(() => {
        const finalWidth = Math.max(1, Math.round(element.getBoundingClientRect().width))
        const finalMobile = window.matchMedia('(max-width: 767px)').matches
        measuredWidthRef.current = finalWidth
        measuredMobileRef.current = finalMobile
        previousPathsRef.current.clear()
        previousNodePositionsRef.current.clear()
        entranceCompleteRef.current = false
        setWidth(finalWidth)
        setIsMobile(finalMobile)
        setMeasured(true)
      }, RESIZE_DEBOUNCE)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    measure()
    return () => {
      observer.disconnect()
      window.clearTimeout(resizeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    updateBreadcrumb([
      { data: { title: 'WORK' }, path: '/' },
      { data: { title: 'Projects' }, path: '/projects' },
    ])
    const onBreadcrumb = (event: Event) => {
      router.push((event as CustomEvent<string>).detail)
    }
    window.addEventListener('breadcrumb-click', onBreadcrumb)
    return () => window.removeEventListener('breadcrumb-click', onBreadcrumb)
  }, [router, updateBreadcrumb])

  const layout = useMemo(() => {
    const disciplineCounts = new Map<string, number>()
    const industryCounts = new Map<string, number>()
    for (const project of data.projects) {
      disciplineCounts.set(
        project.disciplineId,
        (disciplineCounts.get(project.disciplineId) || 0) + 1,
      )
      if (project.industryId) {
        industryCounts.set(project.industryId, (industryCounts.get(project.industryId) || 0) + 1)
      }
    }
    const sortItems = <T extends { id: string; title: string }>(
      items: T[],
      sort: SortState,
      counts: Map<string, number>,
    ) => {
      const byTitle = alphabetic(sort.direction)
      return [...items].sort((a, b) => {
        if (sort.mode === 'count') {
          const difference = (counts.get(a.id) || 0) - (counts.get(b.id) || 0)
          if (difference !== 0) return sort.direction === 'asc' ? difference : -difference
        }
        return byTitle(a.title, b.title)
      })
    }
    const disciplines = sortItems(data.disciplines, sorts.discipline, disciplineCounts)
    const industries = sortItems(data.industries, sorts.industry, industryCounts)
    const sortProject = alphabetic(sorts.project.direction)
    const projects = [...data.projects].sort((a, b) =>
      sorts.project.mode === 'count'
        ? sortProject(a.clientTitle, b.clientTitle) || sortProject(a.title, b.title)
        : sortProject(a.title, b.title),
    )
    const disciplineMap = new Map(disciplines.map((item) => [item.id, item]))
    const industryMap = new Map(industries.map((item) => [item.id, item]))
    const nodes: DiagramNode[] = [
      ...disciplines.map((item, order) => ({
        ...item,
        kind: 'discipline' as const,
        layer: 0,
        order,
      })),
      ...projects.map((item, order) => {
        return {
          id: item.id,
          kind: 'project' as const,
          title: item.title,
          href: item.href,
          color: '#111111',
          layer: 1,
          order,
          clientId: item.clientId,
          clientTitle: item.clientTitle,
        }
      }),
      ...industries.map((item, order) => ({ ...item, kind: 'industry' as const, layer: 2, order })),
    ]
    const links: Array<DiagramLink & { source: string; target: string; value: number }> = []
    for (const project of projects) {
      const disciplineColor = disciplineMap.get(project.disciplineId)?.color || '#777777'
      const industryColor = project.industryId
        ? industryMap.get(project.industryId)?.color || '#BBBBBB'
        : disciplineColor
      const shared = {
        projectId: project.id,
        disciplineId: project.disciplineId,
        industryId: project.industryId,
        disciplineColor,
        industryColor,
      }
      links.push({
        ...shared,
        id: `${project.disciplineId}-${project.id}`,
        source: project.disciplineId,
        target: project.id,
        value: 1,
      })
      if (project.industryId) {
        links.push({
          ...shared,
          id: `${project.id}-${project.industryId}`,
          source: project.id,
          target: project.industryId,
          value: 1,
        })
      }
    }

    const nodeWidth = isMobile ? MOBILE_NODE_SIZE : DESKTOP_NODE_SIZE
    const groupedByClient = sorts.project.mode === 'count'
    const nodePadding = isMobile
      ? groupedByClient
        ? MOBILE_CLIENT_NODE_PADDING
        : MOBILE_NODE_PADDING
      : DESKTOP_NODE_PADDING
    const diagramTop = isMobile
      ? MOBILE_LABEL_HEIGHT +
        MOBILE_LABEL_GAP +
        (groupedByClient ? MOBILE_CLIENT_LABEL_HEIGHT + MOBILE_CLIENT_LABEL_GAP : 0) +
        2
      : DESKTOP_DIAGRAM_TOP
    const contentHeight =
      projects.length * nodeWidth + Math.max(0, projects.length - 1) * nodePadding
    const height = Math.max(240, diagramTop + contentHeight + 18)
    const extentBottom = diagramTop + contentHeight
    const generator = sankey<
      { nodes: DiagramNode[]; links: typeof links },
      DiagramNode,
      DiagramLink
    >()
      .nodeId((node) => node.id)
      .nodeAlign((node) => node.layer)
      .nodeSort((a, b) => a.order - b.order)
      .linkSort((a, b) => {
        const targetDifference = (a.target as DiagramNode).order - (b.target as DiagramNode).order
        return targetDifference || (a.source as DiagramNode).order - (b.source as DiagramNode).order
      })
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      .iterations(32)
      .extent([
        [4, diagramTop],
        [width - 4, extentBottom],
      ])

    const graph = generator({ nodes, links })
    for (let layer = 0; layer < 3; layer += 1) {
      const column = graph.nodes
        .filter((node) => node.layer === layer)
        .sort((a, b) => a.order - b.order)
      const columnHeight =
        column.reduce((total, node) => total + (node.y1! - node.y0!), 0) +
        Math.max(0, column.length - 1) * nodePadding
      let y = diagramTop + (contentHeight - columnHeight) / 2
      for (const node of column) {
        const nodeHeight = node.y1! - node.y0!
        node.y0 = y
        node.y1 = y + nodeHeight
        y = node.y1 + nodePadding
      }
    }
    generator.update(graph)

    return { graph, height, nodeWidth }
  }, [data, isMobile, sorts, width])

  const nodeMap = useMemo(
    () => new Map(layout.graph.nodes.map((node) => [node.id, node])),
    [layout.graph.nodes],
  )
  const flowGroups = useMemo(() => {
    const grouped = new Map<string, LayoutLink[]>()
    for (const link of layout.graph.links) {
      const group = grouped.get(link.projectId) || []
      group.push(link)
      grouped.set(link.projectId, group)
    }
    return [...grouped.entries()]
  }, [layout.graph.links])
  const clientGroups = useMemo(() => {
    if (sorts.project.mode !== 'count') return []
    const grouped = new Map<string, LayoutNode[]>()
    for (const node of layout.graph.nodes) {
      if (node.kind !== 'project' || !node.clientId) continue
      const group = grouped.get(node.clientId) || []
      group.push(node)
      grouped.set(node.clientId, group)
    }
    return [...grouped.entries()].map(([id, groupNodes]) => {
      const nodes = [...groupNodes].sort((a, b) => nodeCenter(a) - nodeCenter(b))
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const x = precise((first.x0 ?? 0) - 12)
      const firstCenter = nodeCenter(first)
      const lastCenter = nodeCenter(last)
      const singleNode = first.id === last.id
      const y = precise(firstCenter)
      const maxY = precise(lastCenter)
      const middle = precise((y + maxY) / 2)
      const span = precise(maxY - y)
      const mobileX = precise(width / 3)
      const mobileRight = precise((first.x0 ?? 0) - FLOW_GAP)
      const mobileRadius = 4
      const mobilePath = singleNode
        ? undefined
        : `M${mobileRight},${y}H${mobileX + mobileRadius}Q${mobileX},${y} ${mobileX},${y + mobileRadius}V${maxY - mobileRadius}Q${mobileX},${maxY} ${mobileX + mobileRadius},${maxY}H${mobileRight}`
      return {
        id,
        title: first.clientTitle || 'Unassigned client',
        x,
        y,
        middle,
        path: singleNode
          ? `M${x - 4},${middle}H${x + 5}`
          : `M${x + 5},${y}C${x},${y} ${x},${y + span * 0.2} ${x},${middle - 5}C${x},${middle - 2} ${x - 1},${middle} ${x - 4},${middle}C${x - 1},${middle} ${x},${middle + 2} ${x},${middle + 5}C${x},${y + span * 0.8} ${x},${maxY} ${x + 5},${maxY}`,
        mobilePath,
        mobileTextX: precise(width / 2),
        mobileTextY: precise(
          (first.y0 ?? 0) -
            MOBILE_LABEL_HEIGHT -
            MOBILE_LABEL_GAP -
            MOBILE_CLIENT_LABEL_GAP -
            MOBILE_CLIENT_LABEL_HEIGHT / 2,
        ),
      }
    })
  }, [layout.graph.nodes, sorts.project.mode, width])

  useLayoutEffect(() => {
    if (!measured) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const nextPaths = new Map<string, string>()
    const nextNodePositions = new Map<string, number>()

    linksRef.current?.querySelectorAll<SVGPathElement>('path[data-link-id]').forEach((path) => {
      const id = path.dataset.linkId
      const nextPath = path.getAttribute('d')
      if (!id || !nextPath) return
      nextPaths.set(id, nextPath)
      if (reduceMotion) return

      const previousPath = previousPathsRef.current.get(id)
      const pathSelection = select(path).interrupt()
      if (previousPath && previousPath !== nextPath) {
        pathSelection
          .attr('d', previousPath)
          .transition()
          .duration(650)
          .ease(easeCubicInOut)
          .attr('d', nextPath)
      }
    })

    nodesRef.current?.querySelectorAll<SVGGElement>('g[data-node-id]').forEach((node) => {
      const id = node.dataset.nodeId
      if (!id) return
      const layoutNode = nodeMap.get(id)
      if (!layoutNode) return
      const nextPosition = nodeCenter(layoutNode)
      nextNodePositions.set(id, nextPosition)
      const previousPosition = previousNodePositionsRef.current.get(id)
      if (reduceMotion || previousPosition == null || previousPosition === nextPosition) return
      select(node)
        .interrupt()
        .attr('transform', `translate(0 ${previousPosition})`)
        .transition()
        .duration(650)
        .ease(easeCubicInOut)
        .attr('transform', `translate(0 ${nextPosition})`)
    })

    previousPathsRef.current = nextPaths
    previousNodePositionsRef.current = nextNodePositions
  }, [layout.graph.links, layout.graph.nodes, measured, nodeMap])

  useEffect(() => {
    if (!measured) return
    if (entranceCompleteRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      entranceCompleteRef.current = true
      return
    }
    const paths = linksRef.current?.querySelectorAll<SVGPathElement>('path[data-link-id]')
    if (!paths?.length) return

    let finishTimer: number | undefined
    const timer = window.setTimeout(() => {
      let remaining = paths.length
      paths.forEach((path) => {
        const length = path.getTotalLength()
        const reverse = path.dataset.direction === 'reverse'
        const groupIndex = Number(path.dataset.groupIndex || 0)
        select(path)
          .interrupt('entrance')
          .attr('stroke-dasharray', `${length} ${length}`)
          .attr('stroke-dashoffset', reverse ? -length : length)
          .transition('entrance')
          .delay(320 + groupIndex * 65)
          .duration(520)
          .ease(easeCubicInOut)
          .attr('stroke-dashoffset', 0)
          .on('end', () => {
            path.removeAttribute('stroke-dasharray')
            path.removeAttribute('stroke-dashoffset')
            remaining -= 1
            if (remaining === 0) entranceCompleteRef.current = true
          })
      })
      const groupCount = Math.ceil(paths.length / 2)
      finishTimer = window.setTimeout(
        () => {
          paths.forEach((path) => {
            select(path).interrupt('entrance')
            path.removeAttribute('stroke-dasharray')
            path.removeAttribute('stroke-dashoffset')
          })
          entranceCompleteRef.current = true
        },
        320 + Math.max(0, groupCount - 1) * 65 + 620,
      )
    }, 100)

    return () => {
      window.clearTimeout(timer)
      if (finishTimer != null) window.clearTimeout(finishTimer)
      if (entranceCompleteRef.current) return
      paths.forEach((path) => {
        select(path).interrupt('entrance')
        path.removeAttribute('stroke-dasharray')
        path.removeAttribute('stroke-dashoffset')
      })
    }
  }, [layout.graph.links, measured])

  const selectSort = (column: Column, mode: SortMode) => {
    setSorts((current) => ({
      ...current,
      [column]: {
        mode,
        direction:
          current[column].mode === mode
            ? current[column].direction === 'asc'
              ? 'desc'
              : 'asc'
            : mode === 'count'
              ? column === 'project'
                ? 'asc'
                : 'desc'
              : 'asc',
      },
    }))
  }

  const isRelated = (link: LayoutLink) => {
    const activeNode = hoveredNode || selectedNode
    if (!activeNode) return true
    return (
      link.disciplineId === activeNode ||
      link.projectId === activeNode ||
      link.industryId === activeNode
    )
  }

  const navigate = (node: LayoutNode, confirmOnTouch = false) => {
    if (
      confirmOnTouch &&
      window.matchMedia('(hover: none), (pointer: coarse)').matches &&
      selectedNode !== node.id
    ) {
      setSelectedNode(node.id || null)
      return
    }
    if (node.href) router.push(node.href)
  }

  if (data.projects.length === 0) {
    return <p className={styles.empty}>No projects are available for the overview.</p>
  }

  return (
    <section className={styles.page} aria-label="Project relationship overview">
      <div className={styles.diagram} ref={containerRef}>
        <div className={styles.headers}>
          {(['discipline', 'project', 'industry'] as const).map((column) => (
            <div className={styles.columnHeader} data-column={column} key={column}>
              <span className={styles.columnTitle}>{column}</span>
              <span className={styles.sortControls}>
                <button
                  aria-label={`Sort ${column} ${sorts[column].direction === 'asc' ? 'descending' : 'ascending'} alphabetically`}
                  className={sorts[column].mode === 'alphabetic' ? styles.activeSort : undefined}
                  onClick={() => selectSort(column, 'alphabetic')}
                  type="button"
                >
                  {sorts[column].mode === 'alphabetic' && sorts[column].direction === 'desc'
                    ? 'Z–A'
                    : 'A–Z'}
                </button>
                <button
                  aria-label={
                    column === 'project'
                      ? 'Group projects by client'
                      : `Sort ${column} by ${sorts[column].mode === 'count' && sorts[column].direction === 'desc' ? 'fewest' : 'most'} entries`
                  }
                  className={sorts[column].mode === 'count' ? styles.activeSort : undefined}
                  onClick={() => selectSort(column, 'count')}
                  type="button"
                >
                  123
                </button>
              </span>
            </div>
          ))}
        </div>
        {measured && (
          <svg
            className={styles.canvas}
            height={layout.height}
            viewBox={`0 0 ${width} ${layout.height}`}
            width={width}
            role="img"
            aria-label="Connections from design disciplines through projects to client industries"
            onClick={() => setSelectedNode(null)}
          >
            <defs>
              {data.projects.map((project) => {
                const discipline = nodeMap.get(project.disciplineId)
                const industry = project.industryId ? nodeMap.get(project.industryId) : undefined
                const projectNode = nodeMap.get(project.id)
                if (!discipline || !projectNode) return null
                return (
                  <linearGradient
                    gradientUnits="userSpaceOnUse"
                    id={`flow-${project.id}`}
                    key={project.id}
                    x1={precise((discipline.x1 ?? 0) + FLOW_GAP)}
                    x2={precise((industry?.x0 ?? projectNode.x0 ?? 0) - FLOW_GAP)}
                    y1="0"
                    y2="0"
                  >
                    <stop
                      offset="0"
                      stopColor={interpolateRgb(discipline.color, '#ffffff')(0.48)}
                    />
                    <stop
                      offset="1"
                      stopColor={interpolateRgb(
                        industry?.color || discipline.color,
                        '#ffffff',
                      )(0.48)}
                    />
                  </linearGradient>
                )
              })}
            </defs>

            <g className={styles.links} ref={linksRef}>
              {flowGroups.map(([projectId, links], groupIndex) => (
                <g
                  className={links.some(isRelated) ? styles.flowGroup : styles.flowGroupMuted}
                  key={projectId}
                >
                  {links.map((link) => {
                    const source = link.source as LayoutNode
                    const fromIndustry = source.kind === 'project'
                    return (
                      <path
                        data-direction={fromIndustry ? 'reverse' : 'forward'}
                        data-group-index={groupIndex}
                        data-link-id={link.id}
                        d={linkPath(link)}
                        key={link.id}
                        stroke={`url(#flow-${link.projectId})`}
                        strokeWidth={precise(Math.max(1, link.width ?? 1))}
                      />
                    )
                  })}
                </g>
              ))}
            </g>

            <g className={styles.clientGroups} aria-hidden="true">
              {clientGroups.map((group) => (
                <g key={group.id}>
                  {(!isMobile || group.mobilePath) && (
                    <path d={isMobile ? group.mobilePath : group.path} />
                  )}
                  <text
                    className={isMobile ? styles.mobileClientTitle : undefined}
                    x={isMobile ? group.mobileTextX : group.x - 12}
                    y={isMobile ? group.mobileTextY : group.middle}
                    textAnchor={isMobile ? 'middle' : 'end'}
                  >
                    {group.title}
                  </text>
                </g>
              ))}
            </g>

            <g className={styles.nodes} ref={nodesRef}>
              {layout.graph.nodes.map((node) => {
                const clickable = Boolean(node.href)
                const x0 = precise(node.x0 ?? 0)
                const x1 = precise(node.x1 ?? x0)
                const y0 = precise(node.y0 ?? 0)
                const y1 = precise(node.y1 ?? y0)
                const height = precise(Math.max(1, y1 - y0))
                const industry = node.kind === 'industry'
                const mobileColumn =
                  node.kind === 'discipline' ? 0 : node.kind === 'project' ? 1 : 2
                const mobileLabelWidth = width / 3 - 8
                const mobileLabelX =
                  node.kind === 'discipline'
                    ? x0
                    : node.kind === 'industry'
                      ? x1 - mobileLabelWidth
                      : mobileColumn * (width / 3) + 4
                return (
                  <g
                    className={`${clickable ? styles.clickableNode : styles.node} ${styles.nodeEntrance}`}
                    data-node-id={node.id}
                    key={node.id}
                    onClick={(event) => {
                      event.stopPropagation()
                      navigate(node, true)
                    }}
                    onKeyDown={(event) => {
                      if (clickable && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault()
                        navigate(node)
                      }
                    }}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    role={clickable ? 'link' : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    transform={`translate(0 ${nodeCenter(node)})`}
                    style={{
                      animationDelay: `${node.kind === 'project' ? 0 : node.kind === 'discipline' ? 60 : 120}ms`,
                    }}
                  >
                    {isMobile && (
                      <rect
                        className={styles.hitArea}
                        x={x0 - MOBILE_HIT_PADDING}
                        y={-height / 2 - MOBILE_HIT_PADDING}
                        width={x1 - x0 + MOBILE_HIT_PADDING * 2}
                        height={height + MOBILE_HIT_PADDING * 2}
                      />
                    )}
                    <rect
                      className={styles.nodeShape}
                      x={x0}
                      y={-height / 2}
                      width={x1 - x0}
                      height={height}
                      fill={node.color}
                    />
                    {isMobile ? (
                      <foreignObject
                        className={styles.mobileNodeLabel}
                        data-column={node.kind}
                        x={mobileLabelX}
                        y={-height / 2 - MOBILE_LABEL_HEIGHT - MOBILE_LABEL_GAP}
                        width={mobileLabelWidth}
                        height={MOBILE_LABEL_HEIGHT}
                      >
                        <div
                          className={styles.mobileNodeLabelInner}
                          data-client-grouped={sorts.project.mode === 'count' ? 'true' : undefined}
                          data-column={node.kind}
                        >
                          {node.title}
                        </div>
                      </foreignObject>
                    ) : (
                      <text
                        x={industry ? x0 - FLOW_GAP - 8 : x1 + FLOW_GAP + 8}
                        y={0}
                        textAnchor={industry ? 'end' : 'start'}
                      >
                        {node.title}
                      </text>
                    )}
                    <title>
                      {node.kind === 'industry' ? `${node.title} (industry)` : `Open ${node.title}`}
                    </title>
                  </g>
                )
              })}
            </g>
          </svg>
        )}
      </div>
    </section>
  )
}
