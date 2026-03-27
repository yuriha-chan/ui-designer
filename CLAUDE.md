# CLAUDE.md

## Development
- Use `pnpm` as package manager (not npm)
- Run tests with `pnpm run test`
- Format code with Prettier (2-space indentation)

## Code Style
- Use 2-space indentation for TypeScript/React
- Follow TypeScript strict mode defaults

## Architecture
- UI components are sorted by S-expression deterministically
- Drag-and-drop uses deepest-target detection logic
- Component identity defined by topological equivalence, not visual properties