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

  return (
    <article className={styles.story} aria-labelledby={`project-title-${project.id}`}>
      <header className={styles.intro}>
        <h1 id={`project-title-${project.id}`}>{project.title}</h1>
        {project.excerpt && <p className={styles.excerpt}>{project.excerpt}</p>}
        {project.desc && (
          <div className={styles.description}>
            <RichText data={project.desc} />
          </div>
        )}
      </header>

      <div className={styles.gallery}>
        {images.map((image, index) => {
          const source = imageSource(image)
          return (
            <figure className={styles.media} key={image.id}>
              <Image
                src={source.src}
                width={source.width}
                height={source.height}
                sizes={index === 0 ? '100vw' : '(max-width: 720px) 100vw, 50vw'}
                alt={image.alt || image.title || project.title}
                priority={index === 0}
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
