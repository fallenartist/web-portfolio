'use client'

import { Upload, useConfig, useDocumentInfo } from '@payloadcms/ui'

import { ReplaceImageControl } from './ReplaceImageControl'

export const MediaUpload = () => {
  const { getEntityConfig } = useConfig()
  const { initialState } = useDocumentInfo()
  const collection = getEntityConfig({ collectionSlug: 'media' })

  if (!collection.upload) return null

  return (
    <Upload
      collectionSlug="media"
      customActions={[<ReplaceImageControl key="replace-image" />]}
      initialState={initialState}
      uploadConfig={collection.upload}
    />
  )
}

export default MediaUpload
