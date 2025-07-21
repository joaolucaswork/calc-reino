# Technology Stack

## Build System & Tools

- **Package Manager**: pnpm (required, version >=10)
- **Bundler**: esbuild for fast compilation and bundling
- **TypeScript**: v5.7+ with Finsweet's TSConfig
- **Testing**: Playwright for end-to-end testing
- **Linting**: ESLint with Finsweet's custom configuration
- **Formatting**: Prettier for consistent code style
- **Versioning**: Changesets for version management and changelogs

## Core Dependencies

- **@finsweet/ts-utils**: Webflow development utilities
- **currency.js**: Monetary calculations and formatting
- **sortablejs**: Drag-and-drop functionality
- **notyf**: Toast notifications
- **@types/sortablejs**: TypeScript definitions

## Common Commands

### Development

```bash
pnpm dev          # Build + watch mode + local server (localhost:3000)
pnpm build        # Production build to dist/
```

### Code Quality

```bash
pnpm lint         # Run ESLint + Prettier checks
pnpm lint:fix     # Auto-fix ESLint issues
pnpm check        # TypeScript type checking
pnpm format       # Format code with Prettier
```

### Testing

```bash
pnpm test         # Run Playwright tests
pnpm test:ui      # Run tests with UI mode
pnpm playwright install  # Install browser dependencies (first time)
```

### Release Management

```bash
pnpm changeset    # Create changelog entry
pnpm release      # Publish to npm (automated via CI/CD)
pnpm update       # Interactive dependency updates
```

## Development Server

- Local server runs on `http://localhost:3000` in dev mode
- Live reloading enabled by default
- Files can be imported in Webflow: `<script defer src="http://localhost:3000/{FILE_PATH}.js"></script>`

## Path Aliases

- `$utils/*` maps to `src/utils/*` (configured in tsconfig.json)
- Add new aliases in both tsconfig.json paths and build config if needed
