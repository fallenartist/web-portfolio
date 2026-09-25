'use client'

import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { ProjectStoryBlock, TreemapData } from '@/types'
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
  return {
    src: image.image!,
    width: image.width || 1600,
    height: image.height || 1200,
  }
}

function storyImageSource(block: Extract<ProjectStoryBlock, { blockType: 'image' }>) {
  return imageSource({
    image: block.image,
    width: block.imageWidth,
    height: block.imageHeight,
    sizes: block.sizes,
  })
}

function ProjectPreview({ project }: { project: TreemapData }) {
  const hero = project.children?.find((item) => item.kind === 'image' && item.hero)
  const heroPreview =
    hero?.sizes?.thumbnail?.url || hero?.sizes?.small?.url || hero?.image || undefined

  return (
    <span className={styles.preview}>
      {heroPreview ? (
        <Image
          src={heroPreview}
          width={320}
          height={200}
          sizes="(max-width: 720px) 45vw, 260px"
          alt=""
          unoptimized
        />
      ) : (
        <span className={styles.previewPlaceholder} />
      )}
      {project.thumb && (
        <Image
          className={styles.previewThumbnail}
          src={project.thumb}
          width={80}
          height={80}
          alt=""
          unoptimized
        />
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
  const images = (project.children || []).filter(
    (item): item is TreemapData & { image: string } => item.kind === 'image' && Boolean(item.image),
  )
  const hero = images.find((image) => image.hero) || images[0]
  const heroSource = hero ? imageSource(hero) : null
  const remainingImages = images.filter((image) => image !== hero)
  const presentation = project.heroPresentation
  const showHeroTitle = presentation?.showTitle === true
  const titlePosition = presentation?.titlePosition || 'center'
  const tintColor = /^#[0-9a-f]{6}$/i.test(presentation?.tintColor || '')
    ? presentation!.tintColor!
    : '#000000'
  const tintOpacity = Math.min(90, Math.max(0, presentation?.tintOpacity ?? 35)) / 100
  const story = project.story || []

  return (
    <article className={styles.story} aria-label={project.title}>
      {hero && heroSource && (
        <figure className={styles.hero}>
          <Image
            src={heroSource.src}
            width={heroSource.width}
            height={heroSource.height}
            sizes="100vw"
            alt={hero.alt || hero.title || project.title}
            priority
            unoptimized
          />
          {showHeroTitle && (
            <>
              <span
                className={styles.heroTint}
                style={{ backgroundColor: tintColor, opacity: tintOpacity }}
              />
              <h1 className={`${styles.heroTitle} ${styles[`title_${titlePosition}`]}`}>
                {project.title}
              </h1>
            </>
          )}
        </figure>
      )}

      {story.length ? (
        <div className={styles.storyLayout}>
          {story.map((block) => {
            if (block.blockType === 'text') {
              return (
                <section
                  className={`${styles.storyBlock} ${styles.textBlock}`}
                  data-position={block.position}
                  data-text-align={block.textAlign}
                  data-width={block.width}
                  key={block.id}
                >
                  <RichText data={block.content} />
                </section>
              )
            }
            const source = storyImageSource(block)
            return (
              <figure
                className={`${styles.storyBlock} ${styles.imageBlock}`}
                data-position={block.position}
                data-width={block.width}
                key={block.id}
              >
                <Image
                  src={source.src}
                  width={source.width}
                  height={source.height}
                  sizes={block.width === 'half' ? '(max-width: 720px) 100vw, 50vw' : '100vw'}
                  alt={block.alt}
                  unoptimized
                />
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            )
          })}
        </div>
      ) : (
        <>
          {project.desc && (
            <div className={styles.description}>
              <RichText data={project.desc} />
            </div>
          )}

          <div className={styles.gallery}>
            {remainingImages.map((image) => {
              const source = imageSource(image)
              return (
                <figure className={styles.media} key={image.id}>
                  <Image
                    src={source.src}
                    width={source.width}
                    height={source.height}
                    sizes="(max-width: 720px) 100vw, 50vw"
                    alt={image.alt || image.title || project.title}
                    unoptimized
                  />
                  {image.title && <figcaption>{image.title}</figcaption>}
                </figure>
              )
            })}
          </div>
        </>
      )}

      {(previousProject || nextProject) && (
        <nav className={styles.projectNavigation} aria-label="Adjacent projects">
          {previousProject ? (
            <button
              className={`${styles.projectLink} ${styles.previousProject}`}
              type="button"
              onClick={() => onNavigateProject(previousProject)}
            >
              <ProjectPreview project={previousProject} />
              <span className={styles.projectLinkLabel}>
                <small>Previous project</small>
                <strong>{previousProject.title}</strong>
              </span>
            </button>
          ) : (
            <span />
          )}
          {nextProject && (
            <button
              className={`${styles.projectLink} ${styles.nextProject}`}
              type="button"
              onClick={() => onNavigateProject(nextProject)}
            >
              <ProjectPreview project={nextProject} />
              <span className={styles.projectLinkLabel}>
                <small>Next project</small>
                <strong>{nextProject.title}</strong>
              </span>
            </button>
          )}
        </nav>
      )}
    </article>
  )
}
