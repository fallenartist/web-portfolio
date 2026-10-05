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
- Add an `Agencies` collection to admin to record the studio through which a project was commissioned.
- Add a `Tags` collection to admin, listing all tags used in projects.
- Show `Client:`, `Agency:`, and tags next to the description in the project UI.
- Develop ways to present projects by industry, client, agency, and tag so these can become clickable throughout the front end.
