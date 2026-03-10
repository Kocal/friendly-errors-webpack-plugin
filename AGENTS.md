# AGENTS.md - AI Coding Agent Guidelines

This document provides guidelines for AI coding agents working on the `@kocal/friendly-errors-webpack-plugin` codebase.

## Project Overview

A Webpack 5 plugin that recognizes certain classes of webpack errors and cleans, aggregates, and prioritizes them to provide a better Developer Experience. This is a maintained fork of `@nuxt/friendly-errors-webpack-plugin`.

**Stack:** JavaScript (CommonJS), Node.js ^22.13.0 || >=24.0.0, pnpm 10.32.0, Vitest 4

## Project Structure

```
friendly-errors-webpack-plugin/
├── index.js                    # Main entry point (exports the plugin)
├── src/
│   ├── friendly-errors-plugin.js   # Main plugin class
│   ├── core/                   # Core processing logic
│   │   ├── extractWebpackError.js  # Extract info from webpack errors
│   │   ├── formatErrors.js         # Apply formatters to errors
│   │   └── transformErrors.js      # Apply transformers to errors
│   ├── formatters/             # Convert errors to human-readable output
│   ├── reporters/              # Output reporters (console, consola)
│   ├── transformers/           # Annotate errors with type/severity
│   └── utils/                  # Utility functions
├── test/
│   ├── integration.spec.js     # Integration tests
│   ├── fixtures/               # Test fixtures (webpack configs)
│   └── unit/                   # Unit tests (mirroring src/ structure)
```

## Build/Lint/Test Commands

**Prerequisites:** Use `nvm use 22` before running node/pnpm commands.

| Command | Description |
|---------|-------------|
| `pnpm lint` | Run ESLint on all files |
| `pnpm lint:fix` | Run ESLint with auto-fix |
| `pnpm test` | Run ESLint + Vitest tests |

### Running a Single Test

```bash
# Run a single test file
pnpm exec vitest run test/unit/transformers/babelSyntax.spec.js

# Run tests matching a file path pattern
pnpm exec vitest run --testPathPattern="moduleNotFound"

# Run a specific test by name/description
pnpm exec vitest run -t "Sets severity to 1000"

# Run with verbose output
pnpm exec vitest run test/unit/formatters/defaultError.spec.js

# Run in watch mode
pnpm exec vitest
```

## Code Style Guidelines

### Formatting (.editorconfig)

- **Indentation:** 2 spaces (no tabs)
- **Line endings:** LF (Unix-style)
- **Charset:** UTF-8
- **Trailing whitespace:** trim (except .md files)
- **Final newline:** always include

### Module System

- Use **CommonJS** (`require`/`module.exports`)
- Add `'use strict'` at the top of source files
- Import dependencies at file top, local modules with relative paths

```javascript
'use strict'

const pc = require('picocolors')
const { colors, formatTitle } = require('../utils/log')
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | camelCase | `moduleNotFound.js`, `friendlyErrors.spec.js` |
| Classes | PascalCase | `FriendlyErrorsWebpackPlugin`, `BaseReporter` |
| Functions/Variables | camelCase | `extractError`, `isModuleNotFoundError` |
| Error types | kebab-case strings | `'module-not-found'`, `'lint-error'` |

### Error Processing Architecture

Errors flow through a pipeline:
1. **Extract** (`extractWebpackError.js`) - Extract relevant info from webpack errors
2. **Transform** (`transformers/`) - Annotate with type, severity, priority
3. **Format** (`formatters/`) - Convert to human-readable output

### Writing Transformers

Transformers identify and annotate specific error types:

```javascript
'use strict'

function transform(error) {
  if (isTargetError(error)) {
    return Object.assign({}, error, {
      message: cleanedMessage,
      severity: 1000,
      type: 'error-type',
      name: 'Error Name'
    })
  }
  return error  // Pass through unchanged if not matching
}

module.exports = transform
```

### Writing Formatters

Formatters convert annotated errors to displayable messages:

```javascript
'use strict'

const { colors, formatTitle } = require('../utils/log')

function format(errors) {
  if (errors.length === 0) return []
  
  return errors.flatMap(error => [
    formatTitle('error', error.name),
    '',
    error.message,
    ''
  ])
}

function isTargetType(type) {
  return type === 'target-error-type'
}

module.exports = format
module.exports.isTargetType = isTargetType
```

### Testing Patterns

- Test files use `.spec.js` suffix
- Tests use Vitest globals (`it`, `describe`, `expect`, `vi`, `beforeEach`)
- Integration tests use in-memory filesystem (`memfs`)

```javascript
describe('FeatureName', () => {
  it('should do something specific', () => {
    const result = functionUnderTest(input)
    expect(result).toEqual(expectedOutput)
  })
})
```

### Error Handling

- Always pass through unmatched errors unchanged in transformers
- Use `Object.assign({}, error, {...})` to create new error objects (immutable pattern)
- Set appropriate severity levels (higher = more severe, typically 1000 for errors)

## ESLint Configuration

Uses ESLint v9 flat config:
- ECMAScript 2022, CommonJS sourceType
- Node.js and Vitest globals enabled
- Ignores: `test/fixtures/**`, `_sandbox/**`

Run `pnpm lint:fix` before committing to auto-fix issues.

## Key Dependencies

**Runtime:** `consola`, `error-stack-parser`, `picocolors`, `string-width`
**Peer:** `webpack ^5.0.0`
**Dev:** `vitest`, `eslint`, `memfs`

## CI/CD

GitHub Actions runs on push/PR to `main`:
- Matrix: Ubuntu/Windows, Node.js 22/24
- Steps: `pnpm install` → `pnpm test`

## Common Tasks

### Adding a New Error Type

1. Create transformer in `src/transformers/` to identify and annotate the error
2. Create formatter in `src/formatters/` to format the error message
3. Register transformer/formatter in the plugin options or defaults
4. Add unit tests in `test/unit/transformers/` and `test/unit/formatters/`
5. Add integration test fixture in `test/fixtures/` if needed

### Debugging

- Use `consola` for logging (already a dependency)
- Check `test/fixtures/` for example webpack configurations
- Integration tests in `integration.spec.js` show full plugin behavior
