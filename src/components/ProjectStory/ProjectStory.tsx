'use client'

import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { ProjectHero, ProjectStoryBlock, TreemapData } from '@/types'
import styles from './ProjectStory.module.scss'

type ResponsiveImage = {
  image: string
  width?: number | null
  height?: number | null
  sizes?: TreemapData['sizes']
}

type ProjectTitleSettings = NonNullable<TreemapData['settings']>['projectTitle']
type StoryTextSettings = NonNullable<TreemapData['settings']>['storyText']
type ProjectDescriptionSettings = NonNullable<TreemapData['settings']>['projectDescription']
type StoryImageBlock = Extract<ProjectStoryBlock, { blockType: 'image' }>

type StoryLayoutItem =
  | { kind: 'block'; block: ProjectStoryBlock }
  | { kind: 'portraitPair'; blocks: [StoryImageBlock, StoryImageBlock] }

function HeroTitle({ title, settings }: { title: string; settings: ProjectTitleSettings }) {
  const color = /^#[0-9a-f]{6}$/i.test(settings.dimColor) ? settings.dimColor : '#000000'
  const intensity = Math.min(90, Math.max(0, settings.dimIntensity)) / 100
  const titleStyle = {
    fontSize: `clamp(32px, 8vw, ${Math.min(240, Math.max(32, settings.fontSize))}px)`,
  }

  return (
    <>
      <span
        className={styles.heroDim}
        style={{ backgroundColor: color, opacity: intensity }}
        aria-hidden="true"
      />
      <h1 className={styles.heroTitle} style={titleStyle}>
        {title}
      </h1>
    </>
  )
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

function isPortraitImage(block: ProjectStoryBlock): block is StoryImageBlock {
  if (block.blockType !== 'image') return false
  const source = imageSource({
    image: block.image,
    width: block.imageWidth,
    height: block.imageHeight,
    sizes: block.sizes,
  })
  const width = block.imageWidth || source.width
  const height = block.imageHeight || source.height
  return height > width
}

function arrangeStory(story: ProjectStoryBlock[]): StoryLayoutItem[] {
  const items: StoryLayoutItem[] = []
  for (let index = 0; index < story.length; index += 1) {
    const block = story[index]
    const next = story[index + 1]
    if (isPortraitImage(block) && next && isPortraitImage(next)) {
      items.push({ kind: 'portraitPair', blocks: [block, next] })
      index += 1
    } else {
      items.push({ kind: 'block', block })
    }
  }
  return items
}

function StoryImage({ block, paired = false }: { block: StoryImageBlock; paired?: boolean }) {
  const source = imageSource({
    image: block.image,
    width: block.imageWidth,
    height: block.imageHeight,
    sizes: block.sizes,
  })
  const portrait = isPortraitImage(block)

  return (
    <figure
      className={paired ? styles.imageBlock : `${styles.contentBlock} ${styles.imageBlock}`}
      data-portrait={portrait}
    >
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
}

function HeroVideo({
  hero,
  title,
  titleSettings,
  onFitChange,
}: {
  hero: Extract<ProjectHero, { type: 'video' }>
  title: string
  titleSettings?: ProjectTitleSettings
  onFitChange: (fit: 'cover' | 'contain') => void
}) {
  const [started, setStarted] = useState(hero.autoplay)
  const [loaded, setLoaded] = useState(false)
  const [fit, setFit] = useState(hero.fit)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const cover = imageSource({
    image: hero.cover,
    width: hero.coverWidth,
    height: hero.coverHeight,
    sizes: hero.coverSizes,
  })
  const coverRatio =
    hero.coverWidth && hero.coverHeight
      ? hero.coverWidth / hero.coverHeight
      : cover.width / cover.height
  const [videoRatio, setVideoRatio] = useState(coverRatio)
  const heroStyle = { '--hero-ratio': videoRatio } as CSSProperties

  useEffect(() => {
    if (!started || !iframeRef.current) return

    let active = true
    const iframe = iframeRef.current

    void import('@vimeo/player').then(async ({ default: Player }) => {
      const player = new Player(iframe)
      try {
        await player.ready()
        const [width, height] = await Promise.all([
          player.getVideoWidth(),
          player.getVideoHeight(),
        ])
        if (active && width > 0 && height > 0) setVideoRatio(width / height)
      } catch {
        // Retain the original cover ratio when Vimeo metadata is unavailable.
      } finally {
        if (active) setLoaded(true)
      }
    }).catch(() => {
      if (active) setLoaded(true)
    })

    return () => {
      active = false
    }
  }, [started])

  return (
    <figure className={styles.hero} data-video-fit={fit} style={heroStyle}>
      {!loaded && (
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
      )}
      {started && (
        <iframe
          ref={iframeRef}
          className={loaded ? styles.videoLoaded : undefined}
          src={hero.url}
          title={`${title} Vimeo video`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
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
      {titleSettings && fit === 'cover' && <HeroTitle title={title} settings={titleSettings} />}
      <button
        className={styles.fitButton}
        type="button"
        onClick={() => {
          const next = fit === 'cover' ? 'contain' : 'cover'
          setFit(next)
          onFitChange(next)
        }}
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
            title={block.caption || 'Vimeo video'}
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
  const previewStyle = {
    '--preview-category-color': project.color || 'transparent',
  } as CSSProperties

  return (
    <span className={styles.preview} style={previewStyle}>
      {heroPreview ? (
        <Image className={styles.previewHero} src={heroPreview} width={320} height={200} sizes="(max-width: 720px) 45vw, 260px" alt="" unoptimized />
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
  titleSettings,
  storyTextSettings,
  descriptionSettings,
  previousProject,
  nextProject,
  onNavigateProject,
}: {
  project: TreemapData
  titleSettings?: ProjectTitleSettings
  storyTextSettings?: StoryTextSettings
  descriptionSettings?: ProjectDescriptionSettings
  previousProject?: TreemapData | null
  nextProject?: TreemapData | null
  onNavigateProject: (project: TreemapData) => void
}) {
  const hero = project.projectHero
  const story = project.story || []
  const storyLayout = arrangeStory(story)
  const settings = titleSettings || {
    placement: 'below',
    fontSize: 112,
    dimColor: '#000000',
    dimIntensity: 35,
  }
  const textSettings = storyTextSettings || {
    width: 50,
    fontSize: 30,
    quoteFontSize: 60,
    textColor: '#222222',
  }
  const description = descriptionSettings || {
    fontFamily: 'October Condensed',
    fontSize: 30,
    textColor: '#222222',
  }
  const textColor = /^#[0-9a-f]{6}$/i.test(textSettings.textColor)
    ? textSettings.textColor
    : '#222222'
  const textSize = Math.min(72, Math.max(16, textSettings.fontSize))
  const quoteSize = Math.min(140, Math.max(24, textSettings.quoteFontSize))
  const descriptionSize = Math.min(72, Math.max(16, description.fontSize))
  const descriptionColor = /^#[0-9a-f]{6}$/i.test(description.textColor)
    ? description.textColor
    : '#222222'
  const storyStyle = {
    '--story-text-width': `${Math.min(100, Math.max(30, textSettings.width))}%`,
    '--story-text-min-size': `${(textSize * 19) / 30}px`,
    '--story-text-fluid-size': `${(textSize * 1.75) / 30}vw`,
    '--story-text-size': `${textSize}px`,
    '--story-quote-min-size': `${quoteSize / 2}px`,
    '--story-quote-fluid-size': `${(quoteSize * 3.25) / 60}vw`,
    '--story-quote-size': `${quoteSize}px`,
    '--story-text-color': textColor,
    '--project-description-font': description.fontFamily.trim() || 'October Condensed',
    '--project-description-min-size': `${(descriptionSize * 19) / 30}px`,
    '--project-description-fluid-size': `${(descriptionSize * 1.75) / 30}vw`,
    '--project-description-size': `${descriptionSize}px`,
    '--project-description-color': descriptionColor,
  } as CSSProperties
  const [videoContained, setVideoContained] = useState(
    hero?.type === 'video' && hero.fit === 'contain',
  )

  const titleOverHero =
    settings.placement === 'overlay' &&
    Boolean(hero) &&
    !(hero?.type === 'video' && videoContained)

  return (
    <article className={styles.story} style={storyStyle} aria-label={project.title}>
      {hero?.type === 'image' && (() => {
        const source = imageSource(hero)
        return (
          <figure className={styles.hero}>
            <Image src={source.src} width={source.width} height={source.height} sizes="100vw" alt={hero.alt} priority unoptimized />
            {titleOverHero && <HeroTitle title={project.title} settings={settings} />}
          </figure>
        )
      })()}
      {hero?.type === 'video' && (
        <HeroVideo
          hero={hero}
          key={hero.url}
          title={project.title}
          titleSettings={settings.placement === 'overlay' ? settings : undefined}
          onFitChange={(fit) => setVideoContained(fit === 'contain')}
        />
      )}

      {(!titleOverHero || project.desc) && (
        <header className={styles.introduction} data-title-overlay={titleOverHero}>
          {!titleOverHero && <h1>{project.title}</h1>}
          {project.desc && (
            <div className={styles.description}>
              <RichText data={project.desc} />
            </div>
          )}
        </header>
      )}

      <div className={styles.content}>
        {storyLayout.map((item) => {
          if (item.kind === 'portraitPair') {
            return (
              <div
                className={`${styles.contentBlock} ${styles.portraitPair}`}
                key={`${item.blocks[0].id}-${item.blocks[1].id}`}
              >
                {item.blocks.map((block) => (
                  <StoryImage block={block} paired key={block.id} />
                ))}
              </div>
            )
          }
          const block = item.block
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
          return <StoryImage block={block} key={block.id} />
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
