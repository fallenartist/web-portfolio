import type { Access } from 'payload'

export const readPublishedPages: Access = ({ req }) =>
  req.user ? true : { _status: { equals: 'published' } }

export const editPages: Access = ({ req }) => Boolean(req.user)
