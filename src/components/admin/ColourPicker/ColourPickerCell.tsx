'use client'

import type { DefaultCellComponentProps } from 'payload'

import styles from './ColourPicker.module.scss'

export const ColourPickerCell = ({ cellData }: DefaultCellComponentProps) => {
  const colour = typeof cellData === 'string' ? cellData : ''

  if (!colour) return <span>—</span>

  return (
    <span className={styles.cell}>
      <span className={styles.cellSwatch} style={{ backgroundColor: colour }} />
      {colour}
    </span>
  )
}
