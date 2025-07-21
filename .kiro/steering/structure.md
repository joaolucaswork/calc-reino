# Project Structure

## Root Directory

```
├── .changeset/          # Changesets configuration for versioning
├── .github/             # GitHub workflows (CI/CD)
├── .kiro/               # Kiro AI assistant configuration
├── .vscode/             # VSCode settings and extensions
├── bin/                 # Build scripts and utilities
├── dist/                # Production build output
├── docs/                # Project documentation
├── node_modules/        # Dependencies (managed by pnpm)
├── slider-experiencia/  # Portfolio slider prototype/demo
├── src/                 # Source code (main development)
├── test-results/        # Playwright test results
├── tests/               # Test specifications
└── package.json         # Project configuration
```

## Source Code Organization (`src/`)

```
src/
├── ativos/              # Asset drag-and-drop module
├── currency/            # Currency formatting module
├── utils/               # Shared utilities
└── index.ts             # Main entry point
```

## Module Architecture

### Entry Point (`src/index.ts`)

- Imports and initializes all modules
- Exports public APIs for external usage
- Auto-initialization for Webflow integration

### Feature Modules

- **`src/ativos/`**: Drag-and-drop functionality for asset management
- **`src/currency/`**: Brazilian Real currency formatting with `data-currency="true"` attribute
- **`src/utils/`**: Shared utilities and helper functions

## File Naming Conventions

- Use kebab-case for file names: `currency-formatter.ts`
- Use PascalCase for class names: `CurrencyFormatter`
- Use camelCase for functions and variables: `formatCurrency`
- Test files: `*.spec.ts` in `/tests` directory

## Import/Export Patterns

- Each module exports its public API through an index file
- Use named exports over default exports
- Import order: external dependencies → internal modules → utilities

## Configuration Files

- **`tsconfig.json`**: TypeScript configuration with path aliases
- **`eslint.config.js`**: ESLint rules using Finsweet's config
- **`playwright.config.ts`**: Test configuration
- **`.prettierrc`**: Code formatting rules

## Development Workflow

1. Feature modules are self-contained in their directories
2. Shared code goes in `src/utils/`
3. Tests mirror the source structure in `/tests`
4. Documentation updates go in `/docs`
5. Build output is generated in `/dist` for distribution
