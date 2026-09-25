import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { TreemapData } from '@/types'
import styles from './ProjectStory.module.scss'

function imageSource(image: TreemapData) {
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

export default function ProjectStory({ project }: { project: TreemapData }) {
  const images = (project.children || []).filter(
    (item): item is TreemapData & { image: string } => item.kind === 'image' && Boolean(item.image),
  )
  const hero = images.find((image) => image.hero) || images[0]
  const heroSource = hero ? imageSource(hero) : null
  const remainingImages = images.filter((image) => image !== hero)

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
        </figure>
      )}

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
    </article>
  )
}
