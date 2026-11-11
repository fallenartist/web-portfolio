// Run with: node --env-file=.env scripts/verify-localization.mjs [pre-migration.dump]
// Exercises migration and Payload on a disposable copy of the LOCAL database.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { userInfo } from 'node:os'

const source = new URL(process.env.DATABASE_URI)
if (!['localhost', '127.0.0.1'].includes(source.hostname))
  throw new Error('Requires a local database')
const database = `portfolio_locale_verify_${Date.now()}`
const sourceEnv = {
  ...process.env,
  PGHOST: source.hostname,
  PGPORT: source.port || '5432',
  PGUSER: decodeURIComponent(source.username),
  PGPASSWORD: decodeURIComponent(source.password),
  PGDATABASE: source.pathname.slice(1),
  PGCONNECT_TIMEOUT: '5',
}
const testEnv = {
  ...sourceEnv,
  PGHOST: '/tmp',
  PGUSER: userInfo().username,
  PGPASSWORD: '',
  PGDATABASE: database,
}
function run(command, args, env, input) {
  const result = spawnSync(command, args, {
    env,
    input,
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
  })
  if (result.status !== 0) throw new Error(`${command}: ${result.stderr || result.stdout}`)
  return result.stdout
}
const query = (sql) => run('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-At'], testEnv, sql)
const migration = readFileSync(
  new URL('../src/migrations/20261109_160000_language_selection.ts', import.meta.url),
  'utf8',
)
const [up, down] = [...migration.matchAll(/await db.execute\(sql`([\s\S]*?)`\)/g)].map(
  (match) => match[1],
)
const availabilityMigration = readFileSync(
  new URL('../src/migrations/20261109_170000_language_availability.ts', import.meta.url),
  'utf8',
)
const [availabilityUp, availabilityDown] = [
  ...availabilityMigration.matchAll(/await db.execute\(sql`([\s\S]*?)`\)/g),
].map((match) => match[1])
const snapshot = JSON.parse(
  readFileSync(
    new URL('../src/migrations/20261109_160000_language_selection.json', import.meta.url),
    'utf8',
  ),
)
const localized = Object.values(snapshot.tables).filter((table) => table.name.endsWith('_locales'))
const content = (table, after) => {
  const parent = table.name.replace(/_locales$/, '')
  const fields = Object.keys(table.columns).filter(
    (field) => !['id', '_locale', '_parent_id'].includes(field),
  )
  const columns = fields.map((field) => `"${field}"`).join(', ')
  return query(
    `SELECT coalesce(json_agg(row_to_json(t) ORDER BY t.id), '[]') FROM (SELECT ${after ? '"_parent_id"' : 'id'} AS id, ${columns} FROM "${after ? table.name : parent}" ${after ? "WHERE _locale = 'en'" : ''}) t;`,
  ).trim()
}

const dump = process.argv[2]
  ? run('pg_restore', ['--no-owner', '--no-privileges', '--file=-', process.argv[2]], sourceEnv)
  : run('pg_dump', ['--no-owner', '--no-privileges'], sourceEnv)
run('createdb', [database], { ...testEnv, PGDATABASE: 'postgres' })
try {
  query(dump)
  const before = localized.map((table) => content(table, false))
  query(`BEGIN; ${up} ${availabilityUp} COMMIT;`)
  localized.forEach((table, index) => assert.equal(content(table, true), before[index], table.name))
  console.log(
    'Migration preserved every existing localized field as English, including nested blocks and menu items.',
  )

  const testURL = new URL(source)
  testURL.username = userInfo().username
  testURL.password = ''
  testURL.pathname = `/${database}`
  run(
    'node',
    [
      '--import',
      'tsx',
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    import { getPayload } from 'payload';
    const { default: config } = await import('./src/payload.config.ts');
    const payload = await getPayload({ config });
    const normalize = value => JSON.parse(JSON.stringify(value, (_key, item) => item ?? null));
    try {
      const initialSettings = await payload.findGlobal({ slug: 'settings', locale: 'en' });
      assert.equal(initialSettings.languages.polishEnabled, false, 'Polish starts unpublished');
      await payload.updateGlobal({ slug: 'settings', locale: 'pl', data: { languages: { polishEnabled: true } } });
      assert.equal((await payload.findGlobal({ slug: 'settings', locale: 'en' })).languages.polishEnabled, true, 'Availability is shared across content locales');
      await payload.updateGlobal({ slug: 'settings', locale: 'en', data: { languages: { polishEnabled: false } } });
      const en = await payload.find({ collection: 'projects', locale: 'en', depth: 2, limit: 1 });
      assert.ok(en.docs.length, 'Need an existing project for the integration check');
      const project = en.docs[0];
      const polish = await payload.findByID({ collection: 'projects', id: project.id, locale: 'pl', fallbackLocale: 'en', depth: 2 });
      assert.deepEqual(normalize(polish), normalize(project), 'Missing Polish content falls back to English including relationships and blocks');
      await payload.update({ collection: 'projects', id: project.id, locale: 'pl', data: { title: 'Test tłumaczenia' } });
      const translated = await payload.findByID({ collection: 'projects', id: project.id, locale: 'pl', fallbackLocale: 'en', depth: 2 });
      assert.equal(translated.title, 'Test tłumaczenia');
      assert.equal(translated.slug, project.slug);
      assert.deepEqual(normalize(translated.story), normalize(project.story));
      assert.deepEqual(normalize(translated.discipline), normalize(project.discipline));
      const imageBlock = project.story?.find(block => block.blockType === 'image');
      if (imageBlock) {
        const story = project.story.map(block => {
          const data = { ...block };
          if (data.image && typeof data.image === 'object') data.image = data.image.id;
          if (data.poster && typeof data.poster === 'object') data.poster = data.poster.id;
          if (block.id === imageBlock.id) data.caption = 'Polski podpis testowy';
          return data;
        });
        await payload.update({ collection: 'projects', id: project.id, locale: 'pl', data: { story } });
        const withCaption = await payload.findByID({ collection: 'projects', id: project.id, locale: 'pl', fallbackLocale: 'en', depth: 2 });
        assert.equal(withCaption.story.find(block => block.id === imageBlock.id).caption, 'Polski podpis testowy');
        assert.deepEqual(withCaption.story.map(block => block.id), project.story.map(block => block.id));
      }
      const original = await payload.findByID({ collection: 'projects', id: project.id, locale: 'en', depth: 2 });
      assert.equal(original.title, project.title);
      assert.deepEqual(normalize(original.story), normalize(project.story), 'Polish caption edits preserve English and shared media');
      console.log('Payload: translated project titles, English fallback, shared slugs, relationships and story structure all passed.');
    } finally { await payload.destroy(); }
    process.exit(0);
  `,
    ],
    { ...process.env, DATABASE_URI: testURL.href },
  )
  console.log('Payload locale integration checks passed.')
  query(`BEGIN; ${availabilityDown} ${down} COMMIT;`)
  localized.forEach((table, index) =>
    assert.equal(content(table, false), before[index], table.name),
  )
  console.log('Rollback restored all original English text.')
} finally {
  run('dropdb', [database], { ...testEnv, PGDATABASE: 'postgres' })
}
