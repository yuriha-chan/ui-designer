# Codebase Summary: Topological UI Designer

## Files Report

### Directory Structure Overview

```
/app/ui-designer/
├── .claude/
│   ├── settings.json          # Claude Code automation hooks
│   └── settings.local.json    # Local Claude settings
├── .codemap/                  # CodeMap index files
├── __fixtures__/              # Test fixtures
│   ├── componentTrees.ts      # Sample component trees for testing
│   ├── entities.ts           # Sample entity data for testing
│   └── index.ts              # Fixture exports
├── __mocks__/                 # Test mocks
│   ├── @uidotdev/
│   │   └── usehooks.ts       # Mock for useThrottle hook
│   ├── react-dnd.ts          # Mock for react-dnd
│   ├── react-dnd-html5-backend.ts # Mock for HTML5 backend
│   └── uuid.ts               # Mock for uuid with deterministic IDs
├── src/
│   ├── types.ts              # TypeScript type definitions (Entity, UIComponent, etc.)
│   ├── App.tsx               # Main application component
│   ├── App.css               # Application styles
│   ├── index.css             # Global styles
│   ├── main.tsx              # Application entry point
│   ├── ComponentNode.tsx     # Recursive component rendering with drag-and-drop
│   ├── componentTree.ts      # Core algorithms (S-expressions, tree operations)
│   ├── DragManager.tsx       # Drag context provider with throttling
│   ├── dnd.ts                # Drag-and-drop type definitions
│   ├── dragStore.ts          # Drag state management store
│   ├── components/           # UI panel components (EntitiesPanel, ScreensPanel, menus)
│   └── test/
│       ├── setup.ts          # Vitest testing setup
│       ├── unit/
│       │   └── componentTree.test.ts # Unit tests for core algorithms
│       └── components/
│           ├── App.test.tsx          # App component tests
│           ├── ComponentNode.test.tsx # ComponentNode tests
│           ├── DragManager.test.tsx  # DragManager tests
│           ├── dummy.test.tsx        # Placeholder test
│           └── test-utils.tsx        # Test utilities
├── .gitignore                # Git ignore patterns
├── .prettierrc               # Prettier formatting configuration
├── CLAUDE.md                 # Claude Code project guidelines
├── Code_Summary.md           # This codebase summary
├── implementation_plan.md    # Test implementation plan
├── package.json              # pnpm package configuration
├── pnpm-lock.yaml            # pnpm lock file
├── README.md                 # Project documentation
├── tsconfig.json             # TypeScript configuration
├── tsconfig.node.json        # Node-specific TypeScript config
├── vite.config.ts            # Vite build configuration
├── vitest.config.ts          # Vitest test configuration
└── index.html                # HTML entry point
```

### Key Files

1. **package.json** - Project dependencies and scripts (uses pnpm, TypeScript module)
2. **README.md** - Comprehensive project documentation explaining philosophy and implementation
3. **CLAUDE.md** - Claude Code project guidelines and automation rules
4. **implementation_plan.md** - Detailed test implementation strategy
5. **.claude/settings.json** - Format-on-edit hook for automatic Prettier formatting
6. **vitest.config.ts** - Vitest test configuration with jsdom environment
7. **.prettierrc** - Prettier formatting configuration (2-space indent)
8. **src/types.ts** - Core type definitions (Entity, UIComponent, TopologicalClass, DesignMetrics)
9. **src/App.tsx** - Main application orchestrator (imports panel components)
10. **src/ComponentNode.tsx** - Recursive component rendering with drag-and-drop logic
11. **src/componentTree.ts** - Core algorithms: S-expression generation, sorting, tree operations
12. **src/dnd.ts** - Drag-and-drop type definitions and constants
13. **src/dragStore.ts** - Simple state management for drag operations using useSyncExternalStore
14. **src/DragManager.tsx** - Drag context provider with throttled updates
15. **src/storage.ts** - localStorage auto-save/load utilities with validation
16. **src/components/** - UI panel components (EntitiesPanel, ScreensPanel, EntityPathMenu, ContainerContextMenu)
17. **src/test/unit/componentTree.test.ts** - Unit tests for core algorithms
18. **src/test/unit/storage.test.ts** - Unit tests for storage utilities
19. \***\*fixtures**/\*\* - Test data for components and entities
20. \***\*mocks**/\*\* - Mock implementations for testing (react-dnd, uuid, usehooks, storage)

## Characteristics Report

### Languages & Frameworks

- **Primary Language**: TypeScript (strict mode enabled)
- **UI Framework**: React 18 with React Hooks
- **Build Tool**: Vite 4.4.5
- **CSS**: Plain CSS with dark theme design
- **Testing**: Vitest 3.0.0 with React Testing Library and jsdom

### Package Manager & Dependencies

- **Package Manager**: pnpm (project uses `type: "module"`)
- **Key Dependencies**:
  - React 18.2.0, React DOM 18.2.0
  - react-dnd 16.0.1 (drag-and-drop library)
  - react-dnd-html5-backend 16.0.1 (HTML5 backend for react-dnd)
  - @uidotdev/usehooks 2.4.1 (custom hooks, specifically useThrottle)
  - uuid 9.0.0 (unique ID generation)
- **Dev Dependencies**:
  - TypeScript 5.0.2 with strict linting rules
  - ESLint 8.45.0 with React plugins
  - Vite plugins for React
  - Prettier 3.8.1 for code formatting
  - Vitest 3.0.0 with React Testing Library for testing
  - @vitest/ui 3.0.0 (Vitest UI interface)
  - jsdom 29.0.1 (DOM environment for testing)

### Project Structure

- **Type**: Single-page application (SPA)
- **Architecture**: Component-based React application with custom drag-and-drop system
- **State Management**: Mixed approach - useState for local state, custom store for drag state, Context API for drag target management
- **No routing or multiple pages**
- **Test Structure**: Organized with unit tests, component tests, fixtures, and mocks

### Build System & Workflows

- **Development**: `pnpm run dev` (Vite dev server)
- **Build**: `pnpm run build` (TypeScript compilation + Vite build)
- **Linting**: `pnpm run lint` (ESLint with TypeScript and React rules)
- **Testing**: `pnpm run test` (Vitest test runner)
- **Test UI**: `pnpm run test:ui` (Vitest UI interface)
- **Test Coverage**: `pnpm run test:coverage` (Generate coverage report)
- **Test Watch**: `pnpm run test:watch` (Watch mode)
- **Specific Test Suites**: `pnpm run test:unit`, `pnpm run test:components`, `pnpm run test:integration`
- **Preview**: `pnpm run preview` (Vite preview server)

### Code Style & Configuration

- **TypeScript**: Strict mode with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- **ESLint**: Configured for TypeScript and React (hooks, refresh)
- **Prettier**: Configured with 2-space indentation (`.prettierrc`)
- **Format-on-edit hook**: Automatic formatting via `.claude/settings.json`
- **Git ignore**: `.gitignore` with standard patterns including node_modules, dist, .env files

### Git & Version Control

- **VCS**: Git
- **Branch**: main (recent commits show test implementation work)
- **No multiple worktrees** (`git worktree list` shows only main)
- **Clean working tree** (no uncommitted changes)
- **Recent commits**: Focus on test implementation (component tests, sorting tests)

### Development Environment

- **No .env or environment configuration files** required
- **Testing**: Comprehensive Vitest setup with React Testing Library (`vitest.config.ts`, `src/test/setup.ts`)
- **Mocking**: Well-organized mocks for external dependencies (react-dnd, uuid, usehooks)
- **Fixtures**: Reusable test data for components and entities
- **No CI/CD configuration files**

### Missing Configurations

- ESLint uses default configuration (package.json scripts)
- No environment variable configuration
- No production deployment configuration

## Semantics Report

### Design Philosophy & Purpose

The project implements a "Topological UI Designer" - a pedagogical tool that enforces constraints to teach UI architecture fundamentals. Key philosophical principles:

1. **Distraction-free design**: No visual property adjustments (colors, fonts, sizes)
2. **Topological equivalence**: UI treated as mathematical tree where component identity is defined by position relative to parent/children
3. **S-expression determinism**: Spatial arrangement governed by deterministic sorting algorithm using S-expressions
4. **Educational focus**: Tool designed to teach UI architecture through enforced constraints

### Core Design Choices

#### 1. Type System Design

- **UIComponent interface**: Hierarchical structure with `id`, `type`, optional `entityPath`, and `children[]`
- **ComponentType**: Restricted to 'container' | 'text' | 'number' | 'button'
- **Entity system**: Entities have `name` and `properties[]` for data binding
- **TopologicalClass**: Represents equivalence classes with signature, canonical form, complexity metrics
- **DesignMetrics**: Metrics for analyzing design complexity (total components, max depth, etc.)

#### 2. Component Tree Algorithms (componentTree.ts)

- **S-expression generation**: `generateSExpression()` creates canonical string representations for deterministic sorting
- **Component sorting**: `sortComponentsBySExpression()` sorts components lexicographically using S-expressions
- **Tree operations**: `isDescendant()`, `findAndRemove()`, `findComponent()`, `deepCopy()`, `insert()`, `move()`, `createComponent()`, `copy()`, `remove()`, `update()`
- **Color coding**: `getColorForComponent()` assigns colors based on type and depth
- **Entity path parsing**: `parseEntityPath()` splits "Entity>Property" strings

#### 3. Drag-and-Drop Architecture

- **Custom implementation**: Uses react-dnd but with custom logic for nested structures
- **Deepest-target detection**: Logic to manage nested container hierarchies
- **Throttled state updates**: 200ms throttle on drop target identification via `useThrottle` hook
- **Simple store pattern**: Custom `dragStore` with `useSyncExternalStore` for React 18 compatibility
- **Type definitions**: `DragItem`, `ItemTypes`, `DropResult`, `DragPreviewInfo` in `dnd.ts`

#### 4. Component Architecture

- **App component**: Main orchestrator delegating to panel components
- **ComponentNode**: Recursive component rendering with drag-and-drop integration
- **Panel components** (src/components/): EntitiesPanel, ScreensPanel, EntityPathMenu, ContainerContextMenu
- **DragManager**: Context provider for drag target management with throttling
- **Separation of concerns**: Business logic in componentTree.ts, UI panels in src/components/, state management in stores

#### 5. Visual Representation System

- **Color coding**: Grayscale shades based on tree depth, fixed colors for leaf types
- **S-expression sorting**: Deterministic component ordering
- **Entity path display**: Parsed entity>property strings shown in components
- **Dark theme**: #1a1a1a background with #f0f0f0 text

### Component Responsibilities

#### App Component

- Main application orchestrator
- Manages component tree state, entities, screens, and history
- Delegates UI panels to extracted components
- Handles global operations (undo/redo, auto-save, keyboard shortcuts)

#### ComponentNode Component

- Recursive rendering of UIComponent trees
- Drag source and drop target implementation using react-dnd
- Context menu handling for entity path selection and container creation
- Visual representation with color coding based on type and depth
- Entity path display and editing

#### DragManager Component

- Provides `DragContext` with throttled drop target updates
- Wraps application to enable drag state management
- Uses `useThrottle` hook for 200ms throttling of drag target updates

#### Type Definitions (types.ts)

- Defines core data structures (Entity, UIComponent, TopologicalClass, DesignMetrics)
- Establishes type constraints for the system
- Provides foundation for type-safe operations

### Testing Strategy

#### Test Organization

- **Unit tests**: Pure function tests in `src/test/unit/`
- **Component tests**: React component tests in `src/test/components/`
- **Fixtures**: Reusable test data in `__fixtures__/`
- **Mocks**: External dependency mocks in `__mocks__/`

#### Mocking Approach

- **react-dnd**: Mocked to enable testing without actual drag-and-drop
- **uuid**: Mocked with deterministic IDs for snapshot testing
- **@uidotdev/usehooks**: Mocked `useThrottle` for predictable timing
- **Test utilities**: `test-utils.tsx` for common test setup

#### Test Coverage Focus

- Core algorithms (S-expressions, sorting, tree operations)
- Component rendering and interactions
- Drag-and-drop state management
- Context menu behavior

### State Management Approach

- **Local state**: `useState` for component tree and context menu in App
- **Custom store**: `dragStore` for cross-component drag state using `useSyncExternalStore`
- **Context API**: `DragContext` for drag target management
- **No external state library** (Redux, Zustand, etc.)
- **Mixed patterns**: Combines React patterns with custom store for specific needs

### Potential Inconsistencies & Quirks

#### 1. Mixed State Management Patterns

- Uses both React Context and custom store pattern
- `dragStore` uses singleton pattern rather than React context for some drag state
- Combination of patterns may increase complexity

#### 2. Language Mix in Code

- **Japanese comments**: Some comments in Japanese (e.g., "コンポーネントタイプと深さに基づく色を生成")
- **Mixed language documentation**: Code comments in Japanese, documentation in English
- **No consistency policy** for comment language

#### 3. Drag-and-Drop Implementation Complexity

- **Custom logic on top of react-dnd**: Adds complexity but provides specific behavior
- **Throttling**: 200ms throttle may affect user experience
- **State synchronization**: Drag state managed outside React tree in store

#### 4. Type Safety Gaps

- `DragItem.type` is string rather than union type
- Some type assertions (`!` operator) in code
- Could benefit from more specific type constraints

#### 5. Error Handling

- **No React error boundaries** implemented
- **Limited error recovery** in drag operations
- **Persistence**: Designs auto-saved to localStorage on change (debounced 1s) with auto-recovery on load

### Development Workflow Notes

#### Build & Test Commands

- **Development**: `pnpm run dev` (standard Vite/React setup)
- **Testing**: Comprehensive test commands with Vitest
- **Linting**: ESLint configured but no auto-fix script in package.json
- **Formatting**: Automatic Prettier formatting via Claude Code hook
- **Preview**: `pnpm run preview` for production build preview

#### Non-Standard Requirements

- **No environment variables** required for development
- **No build-time configuration** needed
- **Simple development setup** with pnpm install

#### Potential Gotchas

1. **Drag state persistence**: `dragStore` maintains state outside React tree
2. **Throttle timing**: 200ms throttle on drag target updates may affect UX
3. **Undo/redo**: Global history with 50-step limit, accessible via Ctrl+Z / Ctrl+Shift+Z or toolbar buttons
4. **Auto-save**: Designs saved to localStorage with "autosave" key, debounced 1 second
5. **Mock dependencies**: Tests rely on mocked versions of react-dnd, uuid, usehooks, storage
6. **Deterministic testing**: UUID mocking required for deterministic test results

### Future Development Path (from README)

- **Input node**: Implementation of a specialized component for user data entry fields
- **Entity editor**: A dedicated interface for pasting and managing entity descriptions and properties
- **Common labels**: Support for a restricted vocabulary of labels (e.g. OK, Cancel, Select)
- **Export/import**: Functionality to save and load designs as JSON and HTML
- **Storyboard**: A system to link multiple UI states to describe user transitions
- **Demo mode**: A testing environment for storyboards using a minimalistic, functional UI

## Summary

The Topological UI Designer is a specialized educational tool built with modern React/TypeScript. It enforces a constrained design environment to teach UI architecture fundamentals through topological relationships rather than visual styling. The architecture centers around hierarchical component trees, deterministic sorting via S-expressions, and a custom drag-and-drop system. Panel UI logic is extracted into modular components in src/components/ for maintainability. The project includes automated formatting (Prettier), testing (Vitest), and Claude Code automation hooks.
