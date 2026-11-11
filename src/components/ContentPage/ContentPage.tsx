'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  RichText,
  LinkJSXConverter,
  type JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react'
import type { Media, Page } from '@/payload-types'
import { useBreadcrumb } from '@/components/BreadcrumbProvider'
import { useLocale } from '@/components/LocaleProvider'
import { useVideoAnalytics } from '@/components/Analytics/useVideoAnalytics'
import { trackPageView } from '@/lib/analytics'
import { getInternalLinkHref, type MenuItem } from '@/lib/menu-links'
import { proportionalMediaSize } from '@/lib/media-image'
import { getVideoEmbed } from '@/lib/video-embed'
import { arrangePageBlocks } from '@/lib/page-layout'
import { firstPageImage, populatedPageImage } from '@/lib/page-images'
import { storyTextStyle, type StoryTextAppearance } from '@/lib/story-typography'
import styles from './ContentPage.module.scss'

type ContentBlock = NonNullable<Page['content']>[number]
function PageImage({
  image,
  alt = '',
  eager = false,
}: {
  image: Media
  alt?: string
  eager?: boolean
}) {
  const size = proportionalMediaSize(image.sizes, image.width, image.height)
  const src = size?.url || image.url
  if (!src) return null
  return (
    <Image
      src={src}
      alt={alt || image.alt || ''}
      width={size?.width || image.width || 1200}
      height={size?.height || image.height || 800}
      sizes="(max-width: 768px) 100vw, 1120px"
      loading={eager ? 'eager' : 'lazy'}
      unoptimized
    />
  )
}

function PageVideo({
  block,
  title,
}: {
  block: Extract<ContentBlock, { blockType: 'pageVideo' }>
  title: string
}) {
  const embed = getVideoEmbed(block.url, { controls: true })
  const embedURL = embed?.embedURL
  const [ratio, setRatio] = useState(16 / 9)
  const { text } = useLocale()
  const ref = useVideoAnalytics({
    url: embed?.embedURL || '',
    enabled: Boolean(embed),
    autoplay: false,
    placement: 'page',
    label: `${title} — ${block.caption || text.video}`,
    blockID: block.id || '',
  })
  useEffect(() => {
    if (!ref.current || !embedURL) return
    let active = true
    const iframe = ref.current
    void import('@vimeo/player')
      .then(async ({ default: Player }) => {
        if (!active) return
        const player = new Player(iframe)
        const [width, height] = await Promise.all([player.getVideoWidth(), player.getVideoHeight()])
        if (active && width > 0 && height > 0) setRatio(width / height)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [embedURL, ref])
  if (!embed) return null
  return (
    <div
      className={styles.video}
      style={{ aspectRatio: ratio, maxWidth: ratio < 1 ? 480 : undefined }}
    >
      <iframe
        ref={ref}
        src={embed.embedURL}
        title={block.caption || `${title} — ${text.vimeoVideo}`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}

export default function ContentPage({
  page,
  rootTitle,
  siteTitle,
  legacyRootSlug,
  textSettings,
}: {
  page: Page
  rootTitle: string
  siteTitle: string
  legacyRootSlug?: string
  textSettings?: StoryTextAppearance
}) {
  const router = useRouter()
  const { updateBreadcrumb } = useBreadcrumb()
  const href = `/${encodeURIComponent(page.slug)}`
  useEffect(() => {
    updateBreadcrumb([
      { data: { title: rootTitle }, path: '/' },
      { data: { title: page.title }, path: href },
    ])
    document.title = `${page.title} — ${siteTitle}`
    trackPageView(href, page.title, 'page', page.slug)
    const onBreadcrumb = (event: Event) => {
      const path: unknown = (event as CustomEvent).detail
      if (path === '/') router.push('/')
      else if (path === href)
        document.getElementById('content-page')?.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.addEventListener('breadcrumb-click', onBreadcrumb)
    return () => window.removeEventListener('breadcrumb-click', onBreadcrumb)
  }, [href, page.title, page.slug, rootTitle, siteTitle, router, updateBreadcrumb])

  const firstImage = firstPageImage(page.content)
  const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
    ...defaultConverters,
    upload: ({ node }) => {
      if (node.relationTo !== 'media') return null
      const image = populatedPageImage(node.value)
      if (!image) return null
      const placement = node.fields?.placement
      const caption = typeof node.fields?.caption === 'string' ? node.fields.caption : ''
      const alt = typeof node.fields?.alt === 'string' ? node.fields.alt : ''
      return (
        <figure
          className={`${styles.media} ${styles.flowImage} ${placement === 'left' ? styles.wrapLeft : placement === 'right' ? styles.wrapRight : styles.flowFull}`}
        >
          <PageImage image={image} alt={alt} eager={image === firstImage} />
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      )
    },
    ...LinkJSXConverter({
      internalDocToHref: ({ linkNode }) => {
        const doc = linkNode.fields.doc
        if (
          !doc?.value ||
          typeof doc.value !== 'object' ||
          !('slug' in doc.value) ||
          ![
            'pages',
            'projects',
            'disciplines',
            'industries',
            'clients',
            'agencies',
            'tags',
          ].includes(doc.relationTo)
        )
          return '#'
        return getInternalLinkHref(doc as NonNullable<MenuItem['internalLink']>, legacyRootSlug)
      },
    }),
  })

  return (
    <main className={styles.page} id="content-page">
      <article className={styles.article} style={storyTextStyle(textSettings)}>
        {page.showTitle !== false && (
          <header className={styles.heading}>
            <h1>{page.title}</h1>
          </header>
        )}
        <div className={styles.blocks}>
          {arrangePageBlocks(page.content || []).map((row, rowIndex) => (
            <div
              className={`${styles.row} ${row[0].width === 'wide' ? styles.wideRow : ''}`}
              key={row[0].id || rowIndex}
            >
              {row.map((block, index) => {
                const placement =
                  block.width !== 'half'
                    ? styles.full
                    : block.alignment === 'right'
                      ? styles.halfRight
                      : block.alignment === 'center'
                        ? styles.halfCenter
                        : styles.halfLeft
                if (block.blockType === 'pageText')
                  return (
                    <section
                      className={`${styles.text} ${placement} ${block.width !== 'half' && block.columns !== 'one' ? styles.twoColumns : ''} ${block.keepParagraphsTogether !== false ? styles.keepParagraphsTogether : ''}`}
                      key={block.id || index}
                    >
                      <RichText data={block.text} converters={converters} />
                    </section>
                  )
                const image =
                  block.blockType === 'pageImage' ? populatedPageImage(block.image) : null
                if (block.blockType === 'pageImage' && !image) return null
                return (
                  <figure className={`${styles.media} ${placement}`} key={block.id || index}>
                    {block.blockType === 'pageImage' && image ? (
                      <PageImage image={image} alt={block.alt || ''} eager={image === firstImage} />
                    ) : block.blockType === 'pageVideo' ? (
                      <PageVideo block={block} title={page.title} />
                    ) : null}
                    {block.caption && <figcaption>{block.caption}</figcaption>}
                  </figure>
                )
              })}
            </div>
          ))}
        </div>
      </article>
    </main>
  )
}
