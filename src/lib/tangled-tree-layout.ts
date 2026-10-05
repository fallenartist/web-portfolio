import type { TangledTreeNode } from './tangled-tree-data'

// Adapted from Matteo Abrate's MIT-licensed “Tangled Tree Visualization II”.
// https://observablehq.com/@nitaku/tangled-tree-visualization-ii

export type TangledLayoutNode = TangledTreeNode & {
  level: number
  x: number
  y: number
  height: number
  parents: TangledLayoutNode[]
  bundle?: TangledLayoutBundle
  bundleGroups: TangledNodeBundleGroup[]
  bundleGroupsByID: Map<string, TangledNodeBundleGroup>
}

export type TangledLayoutBundle = {
  id: string
  level: number
  span: number
  index: number
  x: number
  y: number
  parents: TangledLayoutNode[]
  links: TangledLayoutLink[]
}

type TangledNodeBundleGroup = {
  bundles: TangledLayoutBundle[]
  index: number
}

export type TangledLayoutLink = {
  id: string
  projectId: string
  source: TangledLayoutNode
  target: TangledLayoutNode
  bundle: TangledLayoutBundle
  xt: number
  yt: number
  xb: number
  yb: number
  xs: number
  ys: number
  c1: number
  c2: number
}

export type TangledTreeLayout = {
  nodes: TangledLayoutNode[]
  links: TangledLayoutLink[]
  bundles: TangledLayoutBundle[]
  width: number
  height: number
  nodeWidth: number
  nodeHeight: number
}

type LayoutOptions = {
  nodeWidth?: number
  nodeHeight?: number
  bundleWidth?: number
  levelPadding?: number
  metroDistance?: number
  curveRadius?: number
  padding?: number
  bandGap?: number
  targetWidth?: number
  minimumNodeWidth?: number
  nodeMarkerWidth?: number
}

const maximum = <T>(values: T[], accessor: (value: T) => number, fallback = 0) =>
  values.reduce((result, value) => Math.max(result, accessor(value)), fallback)

const minimum = <T>(values: T[], accessor: (value: T) => number, fallback = 0) =>
  values.length
    ? values.reduce((result, value) => Math.min(result, accessor(value)), Infinity)
    : fallback

export function constructTangledTreeLayout(
  inputLevels: TangledTreeNode[][],
  options: LayoutOptions = {},
): TangledTreeLayout {
  const padding = options.padding ?? 12
  const nodeHeight = options.nodeHeight ?? 24
  const levelPadding = options.levelPadding ?? 18
  const metroDistance = options.metroDistance ?? 4
  const curveRadius = options.curveRadius ?? 14
  const bandGap = options.bandGap ?? 28
  const nodeMarkerWidth = options.nodeMarkerWidth ?? 0
  const minimumFamilyHeight = nodeHeight

  const levels = inputLevels.map((level, levelIndex) =>
    level.map((node): TangledLayoutNode => ({
      ...node,
      parentIds: [...node.parentIds],
      level: levelIndex,
      x: 0,
      y: 0,
      height: 0,
      parents: [],
      bundleGroups: [],
      bundleGroupsByID: new Map(),
    })),
  )
  const nodes = levels.flat()
  const nodeIndex = new Map(nodes.map((node) => [node.id, node]))
  for (const node of nodes) {
    node.parents = node.parentIds.flatMap((id) => {
      const parent = nodeIndex.get(id)
      return parent ? [parent] : []
    })
  }

  const levelBundles: TangledLayoutBundle[][] = levels.map((level, levelIndex) => {
    const index = new Map<string, TangledLayoutBundle>()
    for (const node of level) {
      if (!node.parents.length) continue
      const id = node.parents
        .map((parent) => parent.id)
        .sort()
        .join('-X-')
      let bundle = index.get(id)
      if (bundle) {
        bundle.parents.push(...node.parents)
      } else {
        bundle = {
          id,
          parents: [...node.parents],
          level: levelIndex,
          span: levelIndex - minimum(node.parents, (parent) => parent.level),
          index: index.size,
          x: 0,
          y: 0,
          links: [],
        }
        index.set(id, bundle)
      }
      node.bundle = bundle
    }
    return [...index.values()]
  })

  let bundleWidth = options.bundleWidth ?? 12
  let nodeWidth = options.nodeWidth ?? 180
  const targetWidth = options.targetWidth
  if (targetWidth) {
    const bundleChannels = levelBundles.reduce((total, level) => total + level.length, 0)
    const minimumNodeWidth = options.minimumNodeWidth ?? 72
    const horizontalBudget = Math.max(1, targetWidth - 3 * padding)
    if (bundleChannels) {
      const availableForBundles = horizontalBudget - 3 * minimumNodeWidth
      bundleWidth = Math.max(0.5, Math.min(bundleWidth, availableForBundles / bundleChannels))
    }
    nodeWidth = Math.max(12, (horizontalBudget - bundleChannels * bundleWidth) / 3)
  }

  const bundles = levelBundles.flat()
  const links: TangledLayoutLink[] = []
  for (const source of nodes) {
    if (!source.bundle) continue
    for (const target of source.parents) {
      const projectId = source.kind === 'project' ? source.id : target.id
      const link: TangledLayoutLink = {
        id: `${source.id}--${target.id}`,
        projectId,
        source,
        target,
        bundle: source.bundle,
        xt: 0,
        yt: 0,
        xb: 0,
        yb: 0,
        xs: 0,
        ys: 0,
        c1: 0,
        c2: 0,
      }
      source.bundle.links.push(link)
      links.push(link)
    }
  }

  for (const bundle of bundles) {
    for (const parent of bundle.parents) {
      let group = parent.bundleGroupsByID.get(bundle.id)
      if (!group) {
        group = { bundles: [], index: 0 }
        parent.bundleGroupsByID.set(bundle.id, group)
      }
      group.bundles.push(bundle)
    }
  }
  for (const node of nodes) {
    node.bundleGroups = [...node.bundleGroupsByID.values()].sort(
      (a, b) =>
        maximum(b.bundles, (bundle) => bundle.span) - maximum(a.bundles, (bundle) => bundle.span),
    )
    node.bundleGroups.forEach((group, index) => {
      group.index = index
    })
    node.height = (Math.max(1, node.bundleGroups.length) - 1) * metroDistance
  }

  let xOffset = padding
  let yOffset = padding
  levels.forEach((level, levelIndex) => {
    xOffset += levelBundles[levelIndex].length * bundleWidth
    yOffset += levelPadding
    level.forEach((node, nodeIndex) => {
      if (levelIndex === 2 && nodeIndex > 0 && node.kind !== level[nodeIndex - 1].kind) {
        yOffset += bandGap
      }
      node.x = node.level * nodeWidth + xOffset
      node.y = nodeHeight + yOffset + node.height / 2
      yOffset += nodeHeight + node.height
    })
  })

  let precedingNodes = 0
  levels.forEach((level, levelIndex) => {
    levelBundles[levelIndex].forEach((bundle) => {
      bundle.x =
        maximum(bundle.parents, (parent) => parent.x) +
        nodeWidth +
        (levelBundles[levelIndex].length - 1 - bundle.index) * bundleWidth
      bundle.y = precedingNodes * nodeHeight
    })
    precedingNodes += level.length
  })

  const setLinkCoordinates = (link: TangledLayoutLink) => {
    const group = link.target.bundleGroupsByID.get(link.bundle.id)
    link.xt = link.target.x + nodeMarkerWidth / 2
    link.yt =
      link.target.y +
      (group?.index ?? 0) * metroDistance -
      (link.target.bundleGroups.length * metroDistance) / 2 +
      metroDistance / 2
    link.xb = link.bundle.x
    link.yb = link.bundle.y
    link.xs = link.source.x - nodeMarkerWidth / 2
    link.ys = link.source.y
  }
  links.forEach(setLinkCoordinates)

  let negativeOffset = 0
  levels.forEach((level, levelIndex) => {
    const bundleClearance = minimum(
      levelBundles[levelIndex],
      (bundle) =>
        minimum(bundle.links, (link) => link.ys - 2 * curveRadius - (link.yt + curveRadius)),
      0,
    )
    negativeOffset += -minimumFamilyHeight + bundleClearance
    level.forEach((node) => {
      node.y -= negativeOffset
    })
  })

  links.forEach((link) => {
    setLinkCoordinates(link)
    link.c1 =
      link.source.level - link.target.level > 1
        ? Math.max(
            0,
            Math.min(nodeWidth + curveRadius, link.xb - link.xt, link.yb - link.yt) - curveRadius,
          )
        : curveRadius
    link.c2 = curveRadius
  })

  return {
    nodes,
    links,
    bundles,
    width: targetWidth ?? maximum(nodes, (node) => node.x) + nodeWidth + 2 * padding,
    height: maximum(nodes, (node) => node.y) + nodeHeight / 2 + 2 * padding,
    nodeWidth,
    nodeHeight,
  }
}

export function tangledLinkPath(link: TangledLayoutLink) {
  return [
    `M${link.xt} ${link.yt}`,
    `L${link.xb - link.c1} ${link.yt}`,
    `A${link.c1} ${link.c1} 90 0 1 ${link.xb} ${link.yt + link.c1}`,
    `L${link.xb} ${link.ys - link.c2}`,
    `A${link.c2} ${link.c2} 90 0 0 ${link.xb + link.c2} ${link.ys}`,
    `L${link.xs} ${link.ys}`,
  ].join('')
}
