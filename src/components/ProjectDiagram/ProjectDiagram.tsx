'use client'

import { easeCubicInOut, interpolateRgb, select } from 'd3'
import { sankey, type SankeyLink, type SankeyNode } from 'd3-sankey'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import type { ProjectDiagramData } from '@/lib/project-diagram'
import styles from './ProjectDiagram.module.scss'

type Column = 'category' | 'project' | 'industry'
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
  categoryId: string
  industryId?: string
  categoryColor: string
  industryColor: string
}

type LayoutNode = SankeyNode<DiagramNode, DiagramLink>
type LayoutLink = SankeyLink<DiagramNode, DiagramLink>

const MIN_CANVAS_WIDTH = 760
const FLOW_GAP = 3
const NODE_PADDING = 16
const NODE_HEIGHT = 20

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
  const containerRef = useRef<HTMLDivElement>(null)
  const linksRef = useRef<SVGGElement>(null)
  const nodesRef = useRef<SVGGElement>(null)
  const previousPathsRef = useRef(new Map<string, string>())
  const previousNodePositionsRef = useRef(new Map<string, number>())
  const [width, setWidth] = useState(MIN_CANVAS_WIDTH)
  const [sorts, setSorts] = useState<Record<Column, SortState>>({
    category: { mode: 'alphabetic', direction: 'asc' },
    project: { mode: 'alphabetic', direction: 'asc' },
    industry: { mode: 'alphabetic', direction: 'asc' },
  })
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const measure = () => {
      setWidth(Math.max(MIN_CANVAS_WIDTH, element.clientWidth))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    measure()
    return () => observer.disconnect()
  }, [])

  const layout = useMemo(() => {
    const categoryCounts = new Map<string, number>()
    const industryCounts = new Map<string, number>()
    for (const project of data.projects) {
      categoryCounts.set(project.categoryId, (categoryCounts.get(project.categoryId) || 0) + 1)
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
    const categories = sortItems(data.categories, sorts.category, categoryCounts)
    const industries = sortItems(data.industries, sorts.industry, industryCounts)
    const sortProject = alphabetic(sorts.project.direction)
    const projects = [...data.projects].sort((a, b) =>
      sorts.project.mode === 'count'
        ? sortProject(a.clientTitle, b.clientTitle) || sortProject(a.title, b.title)
        : sortProject(a.title, b.title),
    )
    const categoryMap = new Map(categories.map((item) => [item.id, item]))
    const industryMap = new Map(industries.map((item) => [item.id, item]))
    const nodes: DiagramNode[] = [
      ...categories.map((item, order) => ({ ...item, kind: 'category' as const, layer: 0, order })),
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
      const categoryColor = categoryMap.get(project.categoryId)?.color || '#777777'
      const industryColor = project.industryId
        ? industryMap.get(project.industryId)?.color || '#BBBBBB'
        : categoryColor
      const shared = {
        projectId: project.id,
        categoryId: project.categoryId,
        industryId: project.industryId,
        categoryColor,
        industryColor,
      }
      links.push({
        ...shared,
        id: `${project.categoryId}-${project.id}`,
        source: project.categoryId,
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

    const requiredByProjects =
      projects.length * NODE_HEIGHT + Math.max(0, projects.length - 1) * NODE_PADDING
    const requiredByCategories =
      categories.length * NODE_HEIGHT + Math.max(0, categories.length - 1) * NODE_PADDING
    const requiredByIndustries =
      industries.length * NODE_HEIGHT + Math.max(0, industries.length - 1) * NODE_PADDING
    const height = Math.max(
      240,
      76 + Math.max(requiredByProjects, requiredByCategories, requiredByIndustries),
    )
    const nodeWidth = Math.max(10, Math.min(20, width * 0.0125))
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
      .nodePadding(NODE_PADDING)
      .iterations(32)
      .extent([
        [4, 44],
        [width - 4, height - 18],
      ])

    return { graph: generator({ nodes, links }), height, nodeWidth }
  }, [data, sorts, width])

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
      const y = precise(singleNode ? firstCenter - 6 : firstCenter)
      const maxY = precise(singleNode ? lastCenter + 6 : lastCenter)
      const middle = precise((y + maxY) / 2)
      const span = precise(maxY - y)
      return {
        id,
        title: first.clientTitle || 'Unassigned client',
        x,
        y,
        middle,
        path: `M${x + 5},${y}C${x},${y} ${x},${y + span * 0.2} ${x},${middle - 5}C${x},${middle - 2} ${x - 1},${middle} ${x - 4},${middle}C${x - 1},${middle} ${x},${middle + 2} ${x},${middle + 5}C${x},${y + span * 0.8} ${x},${maxY} ${x + 5},${maxY}`,
      }
    })
  }, [layout.graph.nodes, sorts.project.mode])

  useLayoutEffect(() => {
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
  }, [layout.graph.links, layout.graph.nodes, nodeMap])

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
      link.categoryId === activeNode ||
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
          {(['category', 'project', 'industry'] as const).map((column) => (
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
        <svg
          className={styles.canvas}
          height={layout.height}
          viewBox={`0 0 ${width} ${layout.height}`}
          width={width}
          role="img"
          aria-label="Connections from project categories through projects to client industries"
          onClick={() => setSelectedNode(null)}
        >
          <defs>
            <clipPath id="flow-reveal">
              <rect
                className={styles.flowReveal}
                height={layout.height}
                width={width}
                x="0"
                y="0"
              />
            </clipPath>
            {data.projects.map((project) => {
              const category = nodeMap.get(project.categoryId)
              const industry = project.industryId ? nodeMap.get(project.industryId) : undefined
              const projectNode = nodeMap.get(project.id)
              if (!category || !projectNode) return null
              return (
                <linearGradient
                  gradientUnits="userSpaceOnUse"
                  id={`flow-${project.id}`}
                  key={project.id}
                  x1={precise((category.x1 ?? 0) + FLOW_GAP)}
                  x2={precise((industry?.x0 ?? projectNode.x0 ?? 0) - FLOW_GAP)}
                  y1="0"
                  y2="0"
                >
                  <stop offset="0" stopColor={interpolateRgb(category.color, '#ffffff')(0.48)} />
                  <stop
                    offset="1"
                    stopColor={interpolateRgb(industry?.color || category.color, '#ffffff')(0.48)}
                  />
                </linearGradient>
              )
            })}
          </defs>

          <g className={styles.links} clipPath="url(#flow-reveal)" ref={linksRef}>
            {flowGroups.map(([projectId, links]) => (
              <g
                className={links.some(isRelated) ? styles.flowGroup : styles.flowGroupMuted}
                key={projectId}
              >
                {links.map((link) => (
                  <path
                    data-link-id={link.id}
                    d={linkPath(link)}
                    key={link.id}
                    stroke={`url(#flow-${link.projectId})`}
                    strokeWidth={precise(Math.max(1, link.width ?? 1))}
                  />
                ))}
              </g>
            ))}
          </g>

          <g className={styles.clientGroups} aria-hidden="true">
            {clientGroups.map((group) => (
              <g key={group.id}>
                <path d={group.path} />
                <text x={group.x - 12} y={group.middle} textAnchor="end">
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
              return (
                <g
                  className={clickable ? styles.clickableNode : styles.node}
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
                >
                  <rect x={x0} y={-height / 2} width={x1 - x0} height={height} fill={node.color} />
                  <text
                    x={industry ? x0 - FLOW_GAP - 8 : x1 + FLOW_GAP + 8}
                    y={0}
                    textAnchor={industry ? 'end' : 'start'}
                  >
                    {node.title}
                  </text>
                  <title>
                    {node.kind === 'industry' ? `${node.title} (industry)` : `Open ${node.title}`}
                  </title>
                </g>
              )
            })}
          </g>
        </svg>
      </div>
    </section>
  )
}
