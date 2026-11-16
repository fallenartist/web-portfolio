import styles from './WebsiteLink.module.scss'

export function WebsiteLink() {
  return (
    <a
      className={styles.link}
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View website (opens in a new tab)"
    >
      <span>View website</span>
      <span aria-hidden="true">↗</span>
    </a>
  )
}
