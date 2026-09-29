'use client'

import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { useState, type CSSProperties } from 'react'
import type { ProjectHero, ProjectStoryBlock, TreemapData } from '@/types'
import styles from './ProjectStory.module.scss'

type ResponsiveImage = {
  image: string
  width?: number | null
  height?: number | null
  sizes?: TreemapData['sizes']
}

function imageSource(image: ResponsiveImage) {
  for (const name of ['large', 'medium', 'small'] as const) {
    const size = image.sizes?.[name]
    if (size?.url) {
      return {
        src: size.url,
        width: size.width || image.width || 1600,
        height: size.height || image.height || 1200,
      }
    }
  }
  return { src: image.image, width: image.width || 1600, height: image.height || 1200 }
}

function HeroVideo({ hero, title }: { hero: Extract<ProjectHero, { type: 'video' }>; title: string }) {
  const [started, setStarted] = useState(hero.autoplay)
  const [loaded, setLoaded] = useState(false)
  const [fit, setFit] = useState(hero.fit)
  const cover = imageSource({
    image: hero.cover,
    width: hero.coverWidth,
    height: hero.coverHeight,
    sizes: hero.coverSizes,
  })
  const heroStyle = { '--hero-ratio': cover.width / cover.height } as CSSProperties

  return (
    <figure className={styles.hero} data-video-fit={fit} style={heroStyle}>
      <Image
        className={styles.heroCover}
        src={cover.src}
        width={cover.width}
        height={cover.height}
        sizes="100vw"
        alt={hero.coverAlt}
        priority
        unoptimized
      />
      {started && (
        <iframe
          className={loaded ? styles.videoLoaded : undefined}
          src={hero.url}
          title={`${title} ${hero.provider === 'vimeo' ? 'Vimeo' : 'YouTube'} video`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          onLoad={() => setLoaded(true)}
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
      {!started && (
        <button
          className={styles.heroPlay}
          type="button"
          onClick={() => setStarted(true)}
          aria-label={`Play ${title} video`}
        >
          <span className={styles.playButton} aria-hidden="true" />
        </button>
      )}
      <button
        className={styles.fitButton}
        type="button"
        onClick={() => setFit((value) => (value === 'cover' ? 'contain' : 'cover'))}
        aria-label={fit === 'cover' ? 'Show the whole video' : 'Fill the hero with the video'}
        title={fit === 'cover' ? 'Show whole video' : 'Fill hero'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {fit === 'cover' ? (
            <path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5" />
          ) : (
            <path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5" />
          )}
        </svg>
      </button>
    </figure>
  )
}

function StoryVideo({ block }: { block: Extract<ProjectStoryBlock, { blockType: 'video' }> }) {
  const [started, setStarted] = useState(block.autoplay || !block.poster)
  const poster = block.poster
    ? imageSource({
        image: block.poster,
        width: block.posterWidth,
        height: block.posterHeight,
        sizes: block.posterSizes,
      })
    : null
  const portrait = Boolean(poster && poster.height > poster.width)
  const frameStyle = {
    '--media-ratio': poster ? `${poster.width} / ${poster.height}` : '16 / 9',
  } as CSSProperties

  return (
    <figure className={`${styles.contentBlock} ${styles.videoBlock}`} data-portrait={portrait}>
      <div className={styles.videoFrame} style={frameStyle}>
        {started ? (
          <iframe
            src={block.url}
            title={block.caption || `${block.provider === 'vimeo' ? 'Vimeo' : 'YouTube'} video`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            className={styles.videoPoster}
            type="button"
            onClick={() => setStarted(true)}
            aria-label={`Play ${block.caption || 'video'}`}
          >
            {poster && (
              <Image
                src={poster.src}
                width={poster.width}
                height={poster.height}
                sizes={portrait ? '(max-width: 720px) 100vw, 50vw' : '100vw'}
                alt={block.posterAlt || ''}
                unoptimized
              />
            )}
            <span className={styles.playButton} aria-hidden="true" />
          </button>
        )}
      </div>
      {block.caption && <figcaption>{block.caption}</figcaption>}
    </figure>
  )
}

function ProjectPreview({ project }: { project: TreemapData }) {
  const hero = project.children?.find((item) => item.kind === 'image' && item.hero)
  const heroPreview = hero?.sizes?.thumbnail?.url || hero?.sizes?.small?.url || hero?.image

  return (
    <span className={styles.preview}>
      {heroPreview ? (
        <Image src={heroPreview} width={320} height={200} sizes="(max-width: 720px) 45vw, 260px" alt="" unoptimized />
      ) : (
        <span className={styles.previewPlaceholder} />
      )}
      {project.thumb && (
        <Image className={styles.previewThumbnail} src={project.thumb} width={80} height={80} alt="" unoptimized />
      )}
    </span>
  )
}

export default function ProjectStory({
  project,
  previousProject,
  nextProject,
  onNavigateProject,
}: {
  project: TreemapData
  previousProject?: TreemapData | null
  nextProject?: TreemapData | null
  onNavigateProject: (project: TreemapData) => void
}) {
  const hero = project.projectHero
  const story = project.story || []

  return (
    <article className={styles.story} aria-label={project.title}>
      {hero?.type === 'image' && (() => {
        const source = imageSource(hero)
        return (
          <figure className={styles.hero}>
            <Image src={source.src} width={source.width} height={source.height} sizes="100vw" alt={hero.alt} priority unoptimized />
          </figure>
        )
      })()}
      {hero?.type === 'video' && <HeroVideo hero={hero} title={project.title} />}

      <header className={styles.introduction}>
        <h1>{project.title}</h1>
        {project.desc && (
          <div className={styles.description}>
            <RichText data={project.desc} />
          </div>
        )}
      </header>

      <div className={styles.content}>
        {story.map((block) => {
          if (block.blockType === 'text') {
            return (
              <section
                className={`${styles.contentBlock} ${styles.textBlock} ${block.quote ? styles.quoteBlock : ''}`}
                key={block.id}
              >
                <RichText data={block.content} />
              </section>
            )
          }
          if (block.blockType === 'video') return <StoryVideo block={block} key={block.id} />
          const source = imageSource({
            image: block.image,
            width: block.imageWidth,
            height: block.imageHeight,
            sizes: block.sizes,
          })
          const portrait = source.height > source.width
          return (
            <figure className={`${styles.contentBlock} ${styles.imageBlock}`} data-portrait={portrait} key={block.id}>
              <Image
                src={source.src}
                width={source.width}
                height={source.height}
                sizes={portrait ? '(max-width: 720px) 100vw, 50vw' : '100vw'}
                alt={block.alt}
                unoptimized
              />
              {block.caption && <figcaption>{block.caption}</figcaption>}
            </figure>
          )
        })}
      </div>

      {(previousProject || nextProject) && (
        <nav className={styles.projectNavigation} aria-label="Adjacent projects">
          {previousProject ? (
            <button className={`${styles.projectLink} ${styles.previousProject}`} type="button" onClick={() => onNavigateProject(previousProject)}>
              <ProjectPreview project={previousProject} />
              <span className={styles.projectLinkLabel}><small>Previous project</small><strong>{previousProject.title}</strong></span>
            </button>
          ) : <span />}
          {nextProject && (
            <button className={`${styles.projectLink} ${styles.nextProject}`} type="button" onClick={() => onNavigateProject(nextProject)}>
              <ProjectPreview project={nextProject} />
              <span className={styles.projectLinkLabel}><small>Next project</small><strong>{nextProject.title}</strong></span>
            </button>
          )}
        </nav>
      )}
    </article>
  )
}
