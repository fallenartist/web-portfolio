import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { polishText, websiteTypography } from '../src/lib/polish-typography'
import { projectTextConverters } from '../src/lib/project-rich-text'

test('Polish short words stay with the next word without changing longer words or line breaks', () => {
  assert.equal(
    polishText('A ja i ty w domu oraz obok, lub dalej. Czy teraz?'),
    'A\u00a0ja i\u00a0ty w\u00a0domu oraz\u00a0obok, lub\u00a0dalej. Czy\u00a0teraz?',
  )
  assert.equal(
    polishText('Warszawa oraz\nKraków i\u00a0Gdańsk. z'),
    'Warszawa oraz\nKraków i\u00a0Gdańsk. z',
  )
  assert.equal(
    polishText('Projekt „w domu” — O projekcie'),
    'Projekt „w\u00a0domu” — O\u00a0projekcie',
  )
})

test('public typography spans formatted text nodes and preserves links, storage and block boundaries', () => {
  const data = {
    title: 'W domu',
    slug: 'w domu',
    url: '/w domu',
    text: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', text: '😀 i', format: 0 },
              {
                type: 'link',
                fields: { url: '/i projekty' },
                children: [
                  {
                    type: 'text',
                    text: ' projekty',
                    format: 1,
                    $: { fontFeatures: 'allSmallCaps' },
                  },
                ],
              },
            ],
          },
          { type: 'paragraph', children: [{ type: 'text', text: 'z', format: 0 }] },
          { type: 'paragraph', children: [{ type: 'text', text: 'innego miejsca', format: 0 }] },
          { type: 'paragraph', children: [{ type: 'text', text: 'i kod', format: 16 }] },
        ],
      },
    },
  }
  const before = structuredClone(data)
  const output = websiteTypography(data, 'pl')
  assert.equal(output.title, 'W\u00a0domu')
  assert.equal(output.slug, data.slug)
  assert.equal(output.url, data.url)
  const linked = output.text.root.children[0].children[1]
  assert.equal(linked.children?.[0].text, '\u00a0projekty')
  assert.equal(linked.children?.[0].format, 1)
  assert.deepEqual(linked.children?.[0].$, { fontFeatures: 'allSmallCaps' })
  assert.equal(linked.fields?.url, '/i projekty')
  assert.equal(output.text.root.children[1].children[0].text, 'z')
  assert.equal(output.text.root.children[3].children[0].text, 'i kod')
  assert.deepEqual(data, before)
  assert.equal(websiteTypography(data, 'en'), data)
  assert.deepEqual(websiteTypography(null, 'pl'), null)
})

test('shared rich-text converter retains normal formatting with both caps styles', () => {
  for (const fontFeatures of ['smallCaps', 'allSmallCaps']) {
    const data = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [
              { type: 'text', version: 1, text: 'Example', format: 1, $: { fontFeatures } },
            ],
          },
        ],
      },
    } as unknown as Parameters<typeof RichText>[0]['data']
    const markup = renderToStaticMarkup(
      createElement(RichText, { data, converters: projectTextConverters }),
    )
    assert.match(markup, /<strong>Example<\/strong>/)
    assert.match(
      markup,
      fontFeatures === 'smallCaps'
        ? /font-variant-caps:small-caps/
        : /font-variant-caps:all-small-caps/,
    )
  }
})
