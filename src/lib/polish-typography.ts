// Apply at the public data boundary, never while saving CMS content.
const shortWords = /(?<![\p{L}\p{N}_])(?:[aiouwz]|oraz|lub|ale|czy)[ \t]+(?=\S)/giu

export function polishText(text: string) {
  return text.replace(shortWords, (match) => match.trimEnd() + '\u00a0')
}

type TextNode = {
  type?: string
  text?: string
  format?: number | string
  children?: TextNode[]
  [key: string]: unknown
}

function richText(root: TextNode): TextNode {
  let text = ''
  const entries: { node: TextNode; start: number }[] = []
  const visit = (node: TextNode) => {
    if (node.type === 'text') {
      if (typeof node.text !== 'string' || (typeof node.format === 'number' && node.format & 16)) {
        text += '\n'
        return
      }
      entries.push({ node, start: text.length })
      text += node.text
      return
    }
    const block = !['link', 'autolink'].includes(node.type || '')
    if (block) text += '\n'
    node.children?.forEach(visit)
    if (block) text += '\n'
  }
  visit(root)
  const replacements = new Map<number, string>()
  for (const match of text.matchAll(shortWords)) {
    const wordLength = match[0].trimEnd().length
    for (let i = wordLength; i < match[0].length; i++) {
      replacements.set(match.index + i, i === wordLength ? '\u00a0' : '')
    }
  }
  const changed = new Map<TextNode, string>()
  for (const { node, start } of entries) {
    const original = node.text || ''
    // Offsets are UTF-16 indices, matching RegExp and string.slice.
    let result = ''
    for (let i = 0; i < original.length; i++) result += replacements.get(start + i) ?? original[i]
    if (result !== original) changed.set(node, result)
  }
  const clone = (node: TextNode): TextNode => ({
    ...node,
    ...(changed.has(node) ? { text: changed.get(node) } : {}),
    ...(node.children ? { children: node.children.map(clone) } : {}),
  })
  return clone(root)
}

const displayFields = new Set([
  'title',
  'label',
  'caption',
  'alt',
  'excerpt',
  'text',
  'projectGuideTitle',
  'siteTitle',
  'metaDescription',
])

export function websiteTypography<T>(data: T, locale: string): T {
  if (locale !== 'pl') return data
  function walk(value: unknown, key = ''): unknown {
    if (typeof value === 'string') return displayFields.has(key) ? polishText(value) : value
    if (Array.isArray(value)) return value.map((item) => walk(item))
    if (!value || typeof value !== 'object') return value
    const node = value as TextNode
    if (node.type === 'root' && Array.isArray(node.children)) return richText(node)
    return Object.fromEntries(
      Object.entries(value).map(([name, child]) => [name, walk(child, name)]),
    )
  }
  return walk(data) as T
}
