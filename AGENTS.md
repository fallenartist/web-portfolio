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

## TODO

- [x] Add an `Agencies` collection to admin to record the studio through which a project was commissioned.
- [x] Add a `Tags` collection to admin, listing all tags used in projects.
- [ ] Show `Client:`, `Agency:`, and tags next to the description in the project UI.
- [x] Present projects by industry, client, agency, and tag with clickable front-end filters.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
