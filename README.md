# Portfolio

Personal portfolio site using animated Treemap chart as a centrepiece for navigation.

## Technical

Next.js 16, React 19, Payload 3 and PostgreSQL. Use Node 26 and pnpm 9.15.9.

- Local configuration: `.env` from [.env.example](.env.example); never commit secrets.
- Develop: `pnpm install --frozen-lockfile`, then `pnpm dev`.
- Check: `pnpm lint`, `pnpm test`, `pnpm build`.
- Schema changes: generate types/import map, review migrations, back up the database, then run `pnpm payload migrate`. Automatic schema pushing is disabled.
- PostHog: Settings → Cookies switches between consent-based cookies/clicks/masked recordings and cookieless analytics. Enable cookieless tracking in the PostHog project before using that mode. `POSTHOG_ENABLED` remains the master switch; server-only personal API key with Query Read. Admin-cookie browsers and addresses in `POSTHOG_EXCLUDED_IPS` are excluded. Keep development/localhost tracking disabled.

## Deployment

Build locally on the Mac with Node 26: `MYDEVIL_BUILD=1 pnpm build`. Upload portable Next.js output and matching source; install dependencies on MyDevil/FreeBSD. Never upload macOS `node_modules`. MD1 does not have enough RAM for production builds.

Live content is maintained at [lenart.pl/admin](https://lenart.pl/admin). Code deployments preserve the production database, `shared/.env` and `shared/media`; never overwrite them with local copies. Review changes on a branch, validate, merge to `main` and deploy the verified release with rollback available.

`test.lenart.pl` normally redirects to live to conserve RAM. Restore private staging with a separate database/media snapshot when needed; staging content is not copied back over production.

- [MyDevil deployment and recovery](docs/mydevil.md)
- [Development rules](AGENTS.md)
- [Next revision](TODO.md)
