# Web portfolio

Next.js 16 / React 19 portfolio with an SVG D3 treemap and Payload 3 admin at `/admin`. Content and authentication use PostgreSQL. Uploaded media lives in `public/media` and must be persisted when deploying.

## Local development

Use Node 22.16+ (22.x) or Node 24.x, and pnpm 9.15.9.

1. `pnpm install --frozen-lockfile`
2. Copy `.env.example` to `.env`, set `DATABASE_URI` and a strong `PAYLOAD_SECRET`.
3. `pnpm payload migrate`
4. `pnpm dev`

Alternatively, `docker compose up` starts PostgreSQL and the app. Run `docker compose run --rm payload pnpm payload migrate` to initialize the schema before using the app. Compose uses an isolated development database with local-only app port exposure; its example database credentials are not for production.

## Validation

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm audit`
- `pnpm generate:types` and `pnpm generate:importmap` after schema/editor changes

`node --env-file=.env scripts/verify-migrations.mjs` tests the upgrade on temporary PostgreSQL databases. This development check reads the configured local schema and uses the current OS user's local PostgreSQL administrator role through `/tmp` to create/remove only its own test databases.

## Dependency maintenance — September 2026

Payload packages are pinned together at 3.90.1, Next.js / eslint-config-next at 16.3.6, and React / React DOM at 19.3.0. GraphQL stays on the compatible 16.x major. TypeScript stays on 5.9.3. ESLint stays on 9.39.5: ESLint 10 was tested but Next's React/import/accessibility plugins do not support its API yet. Although ESLint 9 is deprecated upstream, it is the compatible version for this toolchain. Do not suppress peer conflicts to force an upgrade.

A scoped pnpm override upgrades the deprecated Drizzle loader's transitive esbuild to 0.25.x to resolve its security advisory. Migration generation, migration SQL, type generation and the production build were checked with this dependency set. The final audit returned zero known vulnerabilities.

Compatibility references: [Payload installation](https://payloadcms.com/docs/getting-started/installation), [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16).

## Database upgrades and deployment

Automatic development schema pushing is disabled. Use reviewed migrations in `src/migrations` and back up the database before applying them.

`20260924_082754_dependency_upgrade` adds Payload session/KV tables and previously unrecorded content fields. It tolerates fields/tables already created by earlier development pushes and preserves legacy columns. Its down operation deliberately refuses to delete tables that may predate the migration; rollback requires the pre-upgrade database backup. Payload may warn about prior development pushes when the migration history contains `dev` / batch `-1`; inspect the pending SQL and backup before proceeding.

The local database was backed up to `/private/tmp/portfolio-pre-upgrade-20260924/database.dump` before this upgrade. All original collection/global record counts were checked after migration. Keep a durable copy of this backup before relying on it for rollback; `/private/tmp` is temporary storage.

Frontend content is rendered dynamically, so CMS edits appear on the next request and builds do not connect to PostgreSQL. Database failures remain server errors rather than being disguised as missing projects. Full category/project paths are validated. The old `/my-route` sample now returns 404 and never reads users.

`pnpm build` emits standalone output for the Dockerfile. `pnpm start` runs that output locally, links the existing static/media assets, and reads `.env`; set `PORT` to choose a port. The image needs `DATABASE_URI` and `PAYLOAD_SECRET` at runtime and a persistent `/app/public/media` volume. Run migrations separately before serving traffic. The repo has no production email adapter; configure one before relying on password-reset email delivery.

## Renderer experiment

SVG remains the application renderer. The isolated HTML/SVG comparison is in `public/treemap-prototype`; it is excluded from the Docker build and is not used by the app. See its README for standalone serving instructions. It was not demonstrated to outperform SVG in Safari.
