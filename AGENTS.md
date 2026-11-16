# Web Portfolio Development Guidelines

## Build & Development Commands

- `pnpm dev` - Start development server
- `pnpm devsafe` - Clean `.next` directory and start dev server
- `pnpm build` - Build for production
- `pnpm start` - Run production server
- `pnpm lint` - Run ESLint
- `pnpm generate:types` - Generate TypeScript types from Payload schema

## Code Style Guidelines

- **TypeScript**: Use strict typing with properly defined interfaces
- **Imports**: Use absolute imports with path aliases (`@/components/*`)
- **Components**: Use React functional components with client directive when needed
- **CSS**: Module-scoped SCSS files with component-specific classes
- **Naming**: PascalCase for components/interfaces, camelCase for variables/functions
- **Error Handling**: Use try/catch blocks for async operations
- **State Management**: React hooks (useState, useEffect, useRef) for local state

## Project Structure

- Next.js app router with Payload CMS integration
- Components in `src/components` with module CSS/SCSS
- Collection schemas in `src/collections`
- API routes using Next.js route handlers

## Operational rules

- Production admin is the content source of truth. Deploy code without replacing live data, secrets or uploads.
- Build MyDevil releases locally with Node 26; install runtime dependencies on FreeBSD. Follow `docs/mydevil.md`.
- Back up before migrations; use reviewed migrations rather than schema pushing. Generate types/import map after schema/editor changes.
- Keep Payload package versions aligned and retain scoped dependency overrides until upstream supports their removal.
- Track unfinished work in `TODO.md`; do not duplicate the backlog here.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
