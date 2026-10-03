'use client'

import { Button, useDocumentInfo, useUploadControls } from '@payloadcms/ui'
import { type ChangeEvent, useRef } from 'react'

export const ReplaceImageControl = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { docPermissions } = useDocumentInfo()
  const { setUploadControlFile } = useUploadControls()

  if (!docPermissions?.update) return null

  const chooseReplacement = () => {
    inputRef.current?.click()
  }

  const stageReplacement = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (file) {
      // Payload exposes replacement files through UploadControls, but its Upload
      // component only switches from the saved preview to the staged preview after
      // the current file has been cleared. Trigger the existing internal removal
      // action first so replacement remains a single user action.
      const fileDetails = inputRef.current?.closest('.file-details')
      const removeButton = fileDetails?.querySelector<HTMLButtonElement>('.file-details__remove')

      removeButton?.click()
      setUploadControlFile(file)
    }

    // Allow selecting the same file again if the user changes their mind before saving.
    event.target.value = ''
  }

  return (
    <>
      <Button
        buttonStyle="pill"
        margin={false}
        onClick={chooseReplacement}
        size="small"
        type="button"
      >
        Replace image
      </Button>
      <input
        ref={inputRef}
        accept="image/*"
        aria-hidden="true"
        hidden
        onChange={stageReplacement}
        tabIndex={-1}
        type="file"
      />
    </>
  )
}

export default ReplaceImageControl
