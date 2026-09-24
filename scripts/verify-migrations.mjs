// Verifies additive upgrade SQL against an empty database and a schema-only copy
// of the configured LOCAL database. Never migrates the source database.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { userInfo } from 'node:os'

const source = new URL(process.env.DATABASE_URI)
if (!['localhost', '127.0.0.1'].includes(source.hostname))
  throw new Error('Requires a local source database')
const env = {
  ...process.env,
  PGHOST: source.hostname,
  PGPORT: source.port || '5432',
  PGUSER: decodeURIComponent(source.username),
  PGPASSWORD: decodeURIComponent(source.password),
  PGDATABASE: source.pathname.slice(1),
  PGCONNECT_TIMEOUT: '5',
}
function run(command, args, database = env.PGDATABASE, input) {
  const connection =
    command === 'pg_dump'
      ? env
      : { ...env, PGHOST: '/tmp', PGUSER: userInfo().username, PGPASSWORD: '' }
  const result = spawnSync(command, args, {
    env: { ...connection, PGDATABASE: database },
    encoding: 'utf8',
    input,
  })
  if (result.status !== 0) throw new Error(`${command}: ${result.stderr}`)
  return result.stdout
}
const query = (database, sql) => run('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-At'], database, sql)
const sqlFor = (name) =>
  readFileSync(new URL(`../src/migrations/${name}.ts`, import.meta.url), 'utf8')
    .split('await db.execute(sql`')[1]
    .split('`)')[0]
const upgrade = sqlFor('20260924_082754_dependency_upgrade')
const schema = run('pg_dump', ['--schema-only', '--no-owner', '--no-privileges'])
for (const mode of ['fresh', 'existing']) {
  const database = `portfolio_verify_${mode}_${Date.now()}`
  run('createdb', [database])
  try {
    query(database, mode === 'fresh' ? sqlFor('20250315_174700') : schema)
    // A sentinel tests preservation across repeated upgrade application.
    query(
      database,
      "INSERT INTO categories (title,slug) VALUES ('Migration sentinel','migration-sentinel');",
    )
    query(database, upgrade)
    query(database, upgrade)
    assert.equal(
      query(database, "SELECT count(*) FROM categories WHERE slug='migration-sentinel';").trim(),
      '1',
    )
    assert.equal(
      query(
        database,
        "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('users_sessions','payload_kv','menus','settings');",
      ).trim(),
      '4',
    )
    assert.equal(
      query(
        database,
        "SELECT count(*) FROM information_schema.columns WHERE table_name='users' AND column_name='reset_password_requested_at';",
      ).trim(),
      '1',
    )
    console.log(
      `${mode}: upgrade applies twice, preserves existing data, and creates required tables/columns`,
    )
  } finally {
    // Only databases created by this invocation are removed.
    run('dropdb', [database])
  }
}
