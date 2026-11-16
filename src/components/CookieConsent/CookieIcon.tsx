import styles from './CookieIcon.module.scss'

export default function CookieIcon({ url, size = 24 }: { url?: string; size?: number }) {
  if (url)
    return (
      <span
        className={styles.mediaIcon}
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          maskImage: `url(${JSON.stringify(url)})`,
          WebkitMaskImage: `url(${JSON.stringify(url)})`,
        }}
      />
    )
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-9-9 4 4 0 0 0 4 4 4 4 0 0 0 5 5Z" />
      <circle cx="7.5" cy="9" r="1" fill="currentColor" />
      <circle cx="8" cy="15.5" r="1" fill="currentColor" />
      <circle cx="14.5" cy="15" r="1" fill="currentColor" />
    </svg>
  )
}
