import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'

// Resolve the exact Lexical/DOM dependencies used by Payload, including its scoped override.
const require = createRequire(import.meta.url)
const richtextRequire = createRequire(require.resolve('@payloadcms/richtext-lexical'))
const { createHeadlessEditor } = richtextRequire('@lexical/headless')
const { withDOM } = richtextRequire('@lexical/headless/dom')
const { $generateNodesFromDOM } = richtextRequire('@lexical/html')
const { $getRoot } = richtextRequire('lexical')

test('Payload rich text imports formatted HTML with the patched DOM and safely exports it', () => {
  const previousWindow = globalThis.window
  const editor = createHeadlessEditor({
    namespace: 'security-compatibility',
    onError(error: Error) {
      throw error
    },
  })
  withDOM((window: Window) => {
    const container = window.document.createElement('div')
    container.innerHTML =
      '<p>Hello <strong>world</strong> &amp; &lt;script&gt; · Zażółć gęślą jaźń</p>'
    editor.update(
      () => {
        const nodes = $generateNodesFromDOM(editor, container)
        $getRoot().append(...nodes)
      },
      { discrete: true },
    )
  })
  assert.equal(globalThis.window, previousWindow)
  editor.getEditorState().read(() => {
    assert.equal($getRoot().getTextContent(), 'Hello world & <script> · Zażółć gęślą jaźń')
  })
  const html = convertLexicalToHTML({ data: editor.getEditorState().toJSON() })
  assert.match(html, /<strong>world<\/strong>/)
  assert.match(html, /&lt;script&gt;/)
  assert.match(html, /Zażółć gęślą jaźń/)
  assert.doesNotMatch(html, /<script>/)
})

test('the patched DOM bridge restores globals after a failed rich-text conversion', () => {
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  assert.throws(
    () =>
      withDOM(() => {
        throw new Error('conversion failed')
      }),
    /conversion failed/,
  )
  assert.equal(globalThis.window, previousWindow)
  assert.equal(globalThis.document, previousDocument)
})
