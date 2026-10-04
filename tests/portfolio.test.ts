import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getAdminThumbnail } from '../src/collections/Media'
import { proportionalMediaSize } from '../src/lib/media-image'
import type { Discipline, Industry, Project, Media, Setting } from '../src/payload-types'
import { getInternalLinkHref } from '../src/lib/menu-links'
import { findTreemapNode, transformDataForTreemap } from '../src/lib/treemap-data'
import { fetchTreemapData } from '../src/lib/transformers'
import { selectMainMenu } from '../src/lib/site-data'
import { getVideoEmbed, validateVideoURL } from '../src/lib/video-embed'
import { GET } from '../src/app/my-route/route'
import type { Payload } from 'payload'

const discipline = (id: number, extra: Partial<Discipline> = {}): Discipline => ({
  id,
  title: `Discipline ${id}`,
  slug: `discipline-${id}`,
  createdAt: '',
  updatedAt: '',
  ...extra,
})
const image: Media = { id: 9, url: '/api/media/file/example.jpg', createdAt: '', updatedAt: '' }
const project = (extra: Partial<Project> = {}): Project => ({
  id: 2,
  slug: 'project',
  title: 'Project',
  discipline: 1,
  createdAt: '',
  updatedAt: '',
  hero: { type: 'image', image },
  ...extra,
})

test('numeric and populated discipline relationships produce the same project tree', () => {
  const disciplines = [discipline(1, { color: '#123456' })]
  const numeric = transformDataForTreemap(disciplines, [project()])
  const populated = transformDataForTreemap(disciplines, [project({ discipline: disciplines[0] })])
  assert.deepEqual(numeric, populated)
  const projectNode = findTreemapNode(numeric, ['discipline-1', 'project'])
  assert.equal(projectNode?.children?.[0].image, image.url)
  assert.equal(projectNode?.color, '#123456')
})

test('full paths are validated; projects cannot be addressed beneath an unrelated discipline', () => {
  const tree = transformDataForTreemap([discipline(1), discipline(3)], [project()])
  assert.equal(findTreemapNode(tree, ['discipline-3', 'project']), undefined)
  assert.equal(findTreemapNode(tree, ['garbage', 'project']), undefined)
  assert.equal(findTreemapNode(tree, ['discipline-1', 'project', 'image-0']), undefined)
})

test('nested disciplines work and cyclic parents cannot create a circular tree', () => {
  const tree = transformDataForTreemap(
    [discipline(1), discipline(3, { parent: 1 })],
    [project({ discipline: 3 })],
  )
  assert.equal(findTreemapNode(tree, ['discipline-1', 'discipline-3', 'project'])?.title, 'Project')
  const cycle = transformDataForTreemap(
    [discipline(1, { parent: 3 }), discipline(3, { parent: 1 })],
    [],
  )
  assert.doesNotThrow(() => JSON.stringify(cycle))
  assert.equal(cycle.children?.length, 2)
})

test('global project title presentation is included in the front-end settings', () => {
  const settings: Setting = {
    id: 1,
    siteTitle: 'Portfolio',
    projectTitle: {
      placement: 'overlay',
      fontSize: 128,
      mobileFontSize: 52,
      dimColor: '#123456',
      dimIntensity: 45,
    },
    storyText: {
      width: 60,
      fontSize: 32,
      quoteFontSize: 64,
      textColor: '#345678',
    },
    projectDescription: {
      fontFamily: 'October Compressed',
      fontSize: 28,
      textColor: '#654321',
    },
  }
  const tree = transformDataForTreemap([discipline(1)], [project()], settings)
  assert.deepEqual(tree.settings?.projectTitle, settings.projectTitle)
  assert.deepEqual(tree.settings?.storyText, settings.storyText)
  assert.deepEqual(tree.settings?.projectDescription, settings.projectDescription)
})

test('missing and populated hero uploads are handled safely', () => {
  const tree = transformDataForTreemap(
    [discipline(1)],
    [
      project({ hero: { type: 'image', image: 9 } }),
      project({ id: 3, hero: { type: 'image', image } }),
    ],
  )
  assert.equal(tree.children![0].children![0].children?.length, 0)
  assert.equal(tree.children![0].children![1].children?.[0].hero, true)
})

test('project thumbnail and hero image remain independent', () => {
  const thumbnail: Media = {
    ...image,
    id: 11,
    url: '/api/media/file/project-thumb.png',
  }
  const secondImage: Media = {
    ...image,
    id: 10,
    url: '/api/media/file/hero.jpg',
    sizes: { thumbnail: { url: '/api/media/file/hero-400.jpg', width: 400, height: 400 } },
  }
  const tree = transformDataForTreemap(
    [discipline(1)],
    [
      project({
        thumbnail,
        hero: { type: 'image', image: secondImage },
      }),
    ],
  )
  const projectNode = tree.children![0].children![0]
  assert.equal(projectNode.thumb, thumbnail.url)
  assert.equal(projectNode.children?.[0].hero, true)
  assert.equal(projectNode.children?.[0].image, secondImage.url)
})

test('Vimeo heroes use their cover for the treemap transition and preserve playback options', () => {
  const tree = transformDataForTreemap(
    [discipline(1)],
    [
      project({
        hero: {
          type: 'video',
          videoURL: 'https://vimeo.com/76979871',
          videoCover: image,
          videoFit: 'contain',
          autoplay: true,
          loop: true,
          muted: false,
          controls: false,
        },
      }),
    ],
  )
  const projectNode = tree.children![0].children![0]
  assert.equal(projectNode.children?.[0].image, image.url)
  assert.equal(projectNode.children?.[0].hero, true)
  assert.equal(projectNode.projectHero?.type, 'video')
  if (projectNode.projectHero?.type === 'video') {
    assert.equal(projectNode.projectHero.fit, 'contain')
    assert.equal(projectNode.projectHero.muted, true)
    assert.match(projectNode.projectHero.url, /^https:\/\/player\.vimeo\.com\/video\/76979871\?/)
    assert.match(projectNode.projectHero.url, /autoplay=1/)
  }
})

test('project content keeps its order and derives presentation from media', () => {
  const content: NonNullable<Project['description']> = {
    root: {
      type: 'root',
      version: 1,
      direction: null,
      format: '',
      indent: 0,
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [{ type: 'text', version: 1, text: 'Story copy' }],
        },
      ],
    },
  }
  const tree = transformDataForTreemap(
    [discipline(1)],
    [
      project({
        story: [
          {
            blockType: 'image',
            image,
          },
          {
            blockType: 'text',
            content,
            quote: true,
          },
          {
            blockType: 'video',
            url: 'https://vimeo.com/76979871/abc123',
            poster: image,
            caption: 'Project film',
            autoplay: true,
            controls: false,
            loop: true,
            muted: false,
          },
        ],
      }),
    ],
  )
  const projectNode = tree.children![0].children![0]
  assert.deepEqual(
    projectNode.story?.map((block) => block.blockType),
    ['image', 'text', 'video'],
  )
  assert.equal(projectNode.story?.[1].blockType === 'text' && projectNode.story[1].quote, true)
  const video = projectNode.story?.[2]
  assert.equal(video?.blockType, 'video')
  if (video?.blockType === 'video') {
    assert.match(video.url, /^https:\/\/player\.vimeo\.com\/video\/76979871\?/)
    assert.match(video.url, /h=abc123/)
    assert.match(video.url, /autoplay=1/)
    assert.equal(video.muted, true)
    assert.equal(video.poster, image.url)
  }
})

test('only Vimeo links are accepted and normalized for safe responsive embeds', () => {
  const vimeo = getVideoEmbed('https://vimeo.com/76979871', 'background')
  assert.equal(vimeo?.provider, 'vimeo')
  assert.match(vimeo?.embedURL || '', /^https:\/\/player\.vimeo\.com\/video\/76979871\?/)
  assert.match(vimeo?.embedURL || '', /autoplay=1/)
  assert.match(vimeo?.embedURL || '', /muted=1/)
  assert.equal(validateVideoURL('https://youtu.be/M7lc1UVf-VE'), 'Enter a valid Vimeo video URL.')
  assert.equal(validateVideoURL('https://example.com/video'), 'Enter a valid Vimeo video URL.')
})

test('media admin thumbnail falls back to the original SVG', () => {
  assert.equal(
    getAdminThumbnail({
      doc: {
        sizes: { thumbnail: { url: null } },
        filename: 'logo mark.svg',
      },
    }),
    '/api/media/file/logo%20mark.svg',
  )
  assert.equal(
    getAdminThumbnail({
      doc: {
        sizes: { thumbnail: { url: '/api/media/file/photo-400x400.jpg' } },
        url: '/api/media/file/photo.jpg',
      },
    }),
    '/api/media/file/photo-400x400.jpg',
  )
})

test('project images reject cropped responsive sizes with a different aspect ratio', () => {
  const sizes: Media['sizes'] = {
    thumbnail: {
      url: '/api/media/file/AL-elewacja-400x400.jpg',
      width: 400,
      height: 400,
    },
    small: {
      url: '/api/media/file/AL-elewacja-800x800.jpg',
      width: 800,
      height: 800,
    },
    medium: {
      url: '/api/media/file/AL-elewacja-1600x1600.jpg',
      width: 1600,
      height: 1600,
    },
  }

  assert.equal(proportionalMediaSize(sizes, 1402, 1860), undefined)
  assert.equal(
    proportionalMediaSize(
      { medium: { url: '/api/media/file/AL-elewacja-1206x1600.jpg', width: 1206, height: 1600 } },
      1402,
      1860,
    )?.url,
    '/api/media/file/AL-elewacja-1206x1600.jpg',
  )
})

test('Lexical content stays structured rather than being assigned to innerHTML', () => {
  const description: Project['description'] = {
    root: {
      type: 'root',
      version: 1,
      direction: null,
      format: '',
      indent: 0,
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [{ type: 'text', version: 1, text: '<script>alert(1)</script>' }],
        },
      ],
    },
  }
  const tree = transformDataForTreemap([discipline(1)], [project({ description })])
  assert.deepEqual(tree.children![0].children![0].desc, description)
})

test('CMS queries disable default pagination and enforce public read access', async () => {
  const calls: Record<string, unknown>[] = []
  const payload = {
    find: async (options: Record<string, unknown>) => {
      calls.push(options)
      return { docs: [] }
    },
    findGlobal: async () => null,
  } as unknown as Payload
  await fetchTreemapData(payload)
  assert.deepEqual(
    calls.map((c) => [c.collection, c.pagination, c.overrideAccess]),
    [
      ['disciplines', false, false],
      ['projects', false, false],
      ['industries', false, false],
    ],
  )
})

test('the front end selects the menu created as Main in admin', () => {
  const main = {
    id: 1,
    title: 'Main',
    slug: 'main',
    items: [],
    createdAt: '',
    updatedAt: '',
  }
  assert.equal(selectMainMenu([main]), main)
})

test('industry menu links open the industry-filtered portfolio', () => {
  const industry: Industry = {
    id: 3,
    title: 'Financial services',
    slug: 'financial-services',
    createdAt: '',
    updatedAt: '',
  }
  assert.equal(
    getInternalLinkHref({ relationTo: 'industries', value: industry }),
    '/?industry=financial-services',
  )
})

test('sample endpoint no longer exposes users', async () => {
  const response = GET()
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: 'Not found' })
})

test('imported WORK root opens directly on disciplines and preserves nested projects', () => {
  const tree = transformDataForTreemap(
    [discipline(10, { slug: 'root', title: 'WORK' }), discipline(1, { parent: 10 })],
    [project()],
  )
  assert.equal(tree.legacyRootSlug, 'root')
  assert.equal(tree.children?.[0].slug, 'discipline-1')
  assert.equal(findTreemapNode(tree, ['discipline-1', 'project'])?.title, 'Project')
  assert.equal(findTreemapNode(tree, ['root']), undefined)
})
