export function createTreemapTapSelection() {
  let selected: string | null = null
  return {
    // Deliberate second tap, without a double-click timing requirement.
    activate(id: string, previewFirst: boolean) {
      if (!previewFirst || selected === id) {
        selected = null
        return true
      }
      selected = id
      return false
    },
    clear() {
      selected = null
    },
    get selected() {
      return selected
    },
  }
}
