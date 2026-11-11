type PositionedBlock = {
  width?: 'content' | 'wide' | 'half' | null
  alignment?: 'left' | 'center' | 'right' | null
}

// Pair neighbouring complementary half-width blocks, preserving their authored order.
// A centre-aligned half block keeps its own row; old blocks retain content width.
export function arrangePageBlocks<T extends PositionedBlock>(blocks: T[]): T[][] {
  const rows: T[][] = []
  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index]
    const next = blocks[index + 1]
    const side = block.alignment || 'left'
    const nextSide = next?.alignment || 'left'
    if (
      block.width === 'half' &&
      next?.width === 'half' &&
      side !== 'center' &&
      nextSide !== 'center' &&
      side !== nextSide
    ) {
      rows.push([block, next])
      index++
    } else rows.push([block])
  }
  return rows
}
