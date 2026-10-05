'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useBreadcrumb } from '@/components/BreadcrumbProvider'
import type { TangledTreeData, TangledTreeNode } from '@/lib/tangled-tree-data'
import {
  constructTangledTreeLayout,
  tangledLinkPath,
  type TangledLayoutLink,
  type TangledLayoutNode,
} from '@/lib/tangled-tree-layout'
import styles from './TangledTree.module.scss'

const KIND_LABELS = {
  discipline: 'Discipline',
  project: 'Project',
  client: 'Clients',
  agency: 'Agencies',
  industry: 'Industries',
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

export default function TangledTree({
  data,
  overviewPath,
}: {
  data: TangledTreeData
  overviewPath: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { updateBreadcrumb } = useBreadcrumb()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1100)
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [touchNode, setTouchNode] = useState<string | null>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(Math.max(320, Math.round(entry.contentRect.width)))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    updateBreadcrumb([
      { data: { title: 'WORK' }, path: '/' },
      { data: { title: 'Projects' }, path: overviewPath },
      { data: { title: 'Tangled' }, path: pathname },
    ])
    const onBreadcrumb = (event: Event) => {
      router.push((event as CustomEvent<string>).detail)
    }
    window.addEventListener('breadcrumb-click', onBreadcrumb)
    return () => window.removeEventListener('breadcrumb-click', onBreadcrumb)
  }, [overviewPath, pathname, router, updateBreadcrumb])

  const layout = useMemo(() => {
    const mobile = containerWidth < 768
    return constructTangledTreeLayout(data.levels, {
      nodeWidth: mobile ? 122 : Math.max(170, Math.min(270, (containerWidth - 120) / 3)),
      nodeHeight: mobile ? 28 : 24,
      bundleWidth: mobile ? 8 : 11,
      levelPadding: mobile ? 14 : 18,
      curveRadius: mobile ? 10 : 14,
      bandGap: mobile ? 34 : 30,
    })
  }, [containerWidth, data.levels])

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
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches && touchNode !== node.id) {
      event.preventDefault()
      event.stopPropagation()
      setTouchNode(node.id)
    }
  }

  if (!data.levels[1].length) {
    return <p className={styles.empty}>No projects are available for the overview.</p>
  }

  return (
    <section className={styles.page} aria-label="Tangled project relationship overview">
      <header className={styles.header}>
        <nav className={styles.viewSwitch} aria-label="Project overview style">
          <Link href={overviewPath}>Sankey</Link>
          <span aria-current="page">Tangled</span>
        </nav>
        <div className={styles.columns} aria-hidden="true">
          <span>Discipline</span>
          <span>Project</span>
          <span>Client / Agency / Industry / Tags</span>
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
          aria-label="Bundled connections between disciplines, projects, clients, agencies, industries and tags"
        >
          <g className={styles.links} aria-hidden="true">
            {layout.links.map((link) => (
              <path
                className={active && !active.linkIds.has(link.id) ? styles.mutedLink : undefined}
                d={tangledLinkPath(link)}
                key={link.id}
                stroke={linkColor(link)}
              />
            ))}
          </g>

          <g className={styles.bandLabels} aria-hidden="true">
            {bandStarts.map((node) => (
              <text x={node.x + 6} y={node.y - layout.nodeHeight / 2 - 9} key={node.kind}>
                {KIND_LABELS[node.kind]}
              </text>
            ))}
          </g>

          <g className={styles.nodes}>
            {layout.nodes.map((node) => {
              const muted = Boolean(active && !active.nodeIds.has(node.id))
              return (
                <a
                  className={`${styles.node} ${muted ? styles.mutedNode : ''}`}
                  href={node.href}
                  key={node.id}
                  onClick={(event) => handleNodeClick(event, node)}
                  onFocus={() => setActiveNode(node.id)}
                  onBlur={() => setActiveNode(null)}
                  onMouseEnter={() => setActiveNode(node.id)}
                >
                  <title>{`${KIND_LABELS[node.kind]}: ${node.title}`}</title>
                  <path
                    className={styles.nodeOuter}
                    d={`M${node.x} ${node.y - node.height / 2 - 4}L${node.x} ${node.y + node.height / 2 + 4}`}
                    stroke={node.kind === 'project' ? '#111111' : mutedColor(node.color)}
                  />
                  <path
                    className={styles.nodeInner}
                    d={`M${node.x} ${node.y - node.height / 2 - 4}L${node.x} ${node.y + node.height / 2 + 4}`}
                  />
                  <text x={node.x + 7} y={node.y - node.height / 2 - 8}>
                    {node.title}
                  </text>
                  <path
                    className={styles.hitArea}
                    d={`M${node.x - 10} ${node.y - 18}H${node.x + Math.min(layout.nodeWidth - 4, Math.max(64, node.title.length * 8))}V${node.y + 12}H${node.x - 10}Z`}
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
