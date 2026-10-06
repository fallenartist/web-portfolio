import type { CollectionBeforeValidateHook } from 'payload'

/**
 * Projects use PostgreSQL serial IDs. The admin form can retain a temporary
 * string ID after nested block or upload editing, which is not a valid document
 * ID. A create request must always let PostgreSQL allocate the document ID.
 */
export const stripProjectCreateID: CollectionBeforeValidateHook = ({ data, operation }) => {
  if (operation !== 'create' || !data || !Object.hasOwn(data, 'id')) return data

  const { id: _temporaryID, ...projectData } = data
  return projectData
}
