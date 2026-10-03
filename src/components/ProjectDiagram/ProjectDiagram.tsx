'use client'

import { interpolateRgb } from 'd3'
import { sankey, type SankeyLink, type SankeyNode } from 'd3-sankey'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

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
const FLOW_GAP = 5
const NODE_PADDING = 18
const NODE_HEIGHT = 11

const alphabetic = (direction: Direction) => (a: string, b: string) =>
  direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a)

function linkPath(link: LayoutLink) {
  const source = link.source as LayoutNode
  const target = link.target as LayoutNode
  const x0 = (source.x1 ?? 0) + FLOW_GAP
  const x1 = (target.x0 ?? 0) - FLOW_GAP
  const y0 = link.y0 ?? 0
  const y1 = link.y1 ?? 0
  const middle = (x0 + x1) / 2
  return `M${x0},${y0}C${middle},${y0} ${middle},${y1} ${x1},${y1}`
}

function nodeCenter(node: LayoutNode) {
  return ((node.y0 ?? 0) + (node.y1 ?? 0)) / 2
}

export default function ProjectDiagram({ data }: { data: ProjectDiagramData }) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(MIN_CANVAS_WIDTH)
  const [sorts, setSorts] = useState<Record<Column, SortState>>({
    category: { mode: 'alphabetic', direction: 'asc' },
    project: { mode: 'alphabetic', direction: 'asc' },
    industry: { mode: 'alphabetic', direction: 'asc' },
  })
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

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
    const projects = [...data.projects].sort(
      (a, b) => sortProject(a.clientTitle, b.clientTitle) || sortProject(a.title, b.title),
    )
    const categoryMap = new Map(categories.map((item) => [item.id, item]))
    const industryMap = new Map(industries.map((item) => [item.id, item]))
    const nodes: DiagramNode[] = [
      ...categories.map((item, order) => ({ ...item, kind: 'category' as const, layer: 0, order })),
      ...projects.map((item, order) => {
        const categoryColor = categoryMap.get(item.categoryId)?.color || '#777777'
        const industryColor = item.industryId
          ? industryMap.get(item.industryId)?.color || '#BBBBBB'
          : categoryColor
        return {
          id: item.id,
          kind: 'project' as const,
          title: item.title,
          href: item.href,
          color: interpolateRgb(categoryColor, industryColor)(0.5),
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
  const clientGroups = useMemo(() => {
    const grouped = new Map<string, LayoutNode[]>()
    for (const node of layout.graph.nodes) {
      if (node.kind !== 'project' || !node.clientId) continue
      const group = grouped.get(node.clientId) || []
      group.push(node)
      grouped.set(node.clientId, group)
    }
    return [...grouped.entries()]
      .filter(([, nodes]) => nodes.length > 1)
      .map(([id, nodes]) => {
        const first = nodes[0]
        const x = (first.x0 ?? 0) - 18
        const y = Math.min(...nodes.map((node) => node.y0 ?? 0))
        const maxY = Math.max(...nodes.map((node) => node.y1 ?? 0))
        const middle = (y + maxY) / 2
        const span = maxY - y
        return {
          id,
          title: first.clientTitle || 'Unassigned client',
          x,
          y,
          middle,
          path: `M${x + 8},${y}C${x + 1},${y} ${x + 1},${y + span * 0.2} ${x + 1},${middle - 6}C${x + 1},${middle - 2} ${x - 2},${middle} ${x - 7},${middle}C${x - 2},${middle} ${x + 1},${middle + 2} ${x + 1},${middle + 6}C${x + 1},${y + span * 0.8} ${x + 1},${maxY} ${x + 8},${maxY}`,
        }
      })
  }, [layout.graph.nodes])

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
              ? 'desc'
              : 'asc',
      },
    }))
  }

  const isRelated = (link: LayoutLink) => {
    if (!hoveredNode) return true
    const source = link.source as LayoutNode
    const target = link.target as LayoutNode
    return source.id === hoveredNode || target.id === hoveredNode || link.projectId === hoveredNode
  }

  const navigate = (node: LayoutNode) => {
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
                {column !== 'project' && (
                  <button
                    aria-label={`Sort ${column} by ${sorts[column].mode === 'count' && sorts[column].direction === 'desc' ? 'fewest' : 'most'} entries`}
                    className={sorts[column].mode === 'count' ? styles.activeSort : undefined}
                    onClick={() => selectSort(column, 'count')}
                    type="button"
                  >
                    123
                  </button>
                )}
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
        >
          <defs>
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
                  x1={(category.x1 ?? 0) + FLOW_GAP}
                  x2={(industry?.x0 ?? projectNode.x0 ?? 0) - FLOW_GAP}
                  y1="0"
                  y2="0"
                >
                  <stop offset="0" stopColor={interpolateRgb(category.color, '#ffffff')(0.68)} />
                  <stop
                    offset="1"
                    stopColor={interpolateRgb(industry?.color || category.color, '#ffffff')(0.68)}
                  />
                </linearGradient>
              )
            })}
          </defs>

          <g className={styles.links}>
            {layout.graph.links.map((link) => (
              <path
                className={isRelated(link) ? styles.link : styles.linkMuted}
                d={linkPath(link)}
                key={link.id}
                stroke={`url(#flow-${link.projectId})`}
                strokeWidth={Math.max(1, link.width ?? 1)}
              />
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

          <g className={styles.nodes}>
            {layout.graph.nodes.map((node) => {
              const clickable = Boolean(node.href)
              const x0 = node.x0 ?? 0
              const x1 = node.x1 ?? x0
              const y0 = node.y0 ?? 0
              const y1 = node.y1 ?? y0
              const industry = node.kind === 'industry'
              return (
                <g
                  className={clickable ? styles.clickableNode : styles.node}
                  key={node.id}
                  onClick={() => navigate(node)}
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
                >
                  <rect
                    x={x0}
                    y={y0}
                    width={x1 - x0}
                    height={Math.max(1, y1 - y0)}
                    fill={node.color}
                  />
                  <text
                    x={industry ? x0 - FLOW_GAP - 8 : x1 + FLOW_GAP + 8}
                    y={nodeCenter(node)}
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
