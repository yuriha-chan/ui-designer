# Codebase Summary: Topological UI Designer

## Files Report

### Directory Structure Overview
```
/app/ui-designer/
├── .claude/
│   └── settings.json         # Claude Code automation hooks
├── src/
│   ├── types.ts              # TypeScript type definitions
│   ├── App.tsx               # Main application component (681 lines)
│   ├── App.css               # Application styles (337 lines)
│   ├── index.css             # Global styles
│   ├── main.tsx              # Application entry point
│   ├── DragManager.tsx       # Drag manager component with context
│   ├── dnd.ts                # Drag-and-drop type definitions
│   ├── dragStore.ts          # Drag state management store
│   └── test/
│       └── setup.ts          # Vitest testing setup
├── .gitignore                # Git ignore patterns
├── .prettierrc               # Prettier formatting configuration
├── CLAUDE.md                 # Claude Code project guidelines
├── Code_Summary.md           # This codebase summary
├── package.json              # pnpm package configuration
├── pnpm-lock.yaml            # pnpm lock file
├── tsconfig.json             # TypeScript configuration
├── tsconfig.node.json        # Node-specific TypeScript config
├── vite.config.ts            # Vite build configuration
├── vitest.config.ts          # Vitest test configuration
├── index.html                # HTML entry point
└── README.md                 # Project documentation
```

### Key Files
1. **package.json** - Project dependencies and scripts
2. **README.md** - Comprehensive project documentation explaining philosophy and implementation
3. **CLAUDE.md** - Claude Code project guidelines and automation rules
4. **.claude/settings.json** - Format-on-edit hook for automatic Prettier formatting
5. **vitest.config.ts** - Vitest test configuration
6. **.prettierrc** - Prettier formatting configuration (2-space indent)
7. **src/types.ts** - Core type definitions (Entity, UIComponent, TopologicalClass, DesignMetrics)
8. **src/App.tsx** - Main application component with UI logic and drag-and-drop handlers
9. **src/dnd.ts** - Drag-and-drop type definitions and constants
10. **src/dragStore.ts** - Simple state management for drag operations
11. **src/DragManager.tsx** - Drag context provider with throttling

## Characteristics Report

### Languages & Frameworks
- **Primary Language**: TypeScript (strict mode enabled)
- **UI Framework**: React 18 with React Hooks
- **Build Tool**: Vite 4.4.5
- **CSS**: Plain CSS with dark theme design

### Package Manager & Dependencies
- **Package Manager**: pnpm (project uses `type: "module"`)
- **Key Dependencies**:
  - React 18.2.0, React DOM 18.2.0
  - react-dnd 16.0.1 (drag-and-drop library)
  - @uidotdev/usehooks 2.4.1 (custom hooks)
  - uuid 9.0.0 (unique ID generation)
- **Dev Dependencies**:
  - TypeScript 5.0.2 with strict linting rules
  - ESLint 8.45.0 with React plugins
  - Vite plugins for React
  - Prettier 3.8.1 for code formatting
  - Vitest 4.1.2 with React Testing Library for testing

### Project Structure
- **Type**: Single-page application (SPA)
- **Architecture**: Component-based React application with custom drag-and-drop system
- **State Management**: Mixed approach - useState for local state, custom store for drag state
- **No routing or multiple pages**

### Build System & Workflows
- **Development**: `pnpm run dev` (Vite dev server)
- **Build**: `pnpm run build` (TypeScript compilation + Vite build)
- **Linting**: `pnpm run lint` (ESLint with TypeScript and React rules)
- **Testing**: `pnpm run test` (Vitest test runner)
- **Preview**: `pnpm run preview` (Vite preview server)

### Code Style & Configuration
- **TypeScript**: Strict mode with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- **ESLint**: Configured for TypeScript and React (hooks, refresh)
- **Prettier**: Configured with 2-space indentation (`.prettierrc`)
- **Format-on-edit hook**: Automatic formatting via `.claude/settings.json`
- **Git ignore**: `.gitignore` with standard patterns

### Git & Version Control
- **VCS**: Git
- **Branch**: main (2 commits: "initial commit", "Add CLAUDE.md and development automation")
- **No multiple worktrees** (`git worktree list` shows only main)
- **Clean working tree** (no uncommitted changes)

### Development Environment
- **No .env or environment configuration files**
- **Testing**: Vitest configured with React Testing Library (`vitest.config.ts`, `src/test/setup.ts`)
- **No CI/CD configuration files**

### Missing Configurations
- ESLint uses default configuration (package.json scripts)
- No environment variable configuration

## Semantics Report

### Design Philosophy & Purpose
The project implements a "Topological UI Designer" - a pedagogical tool that enforces constraints to teach UI architecture fundamentals. Key philosophical principles:

1. **Distraction-free design**: No visual property adjustments (colors, fonts, sizes)
2. **Topological equivalence**: UI treated as mathematical tree where component identity is defined by position relative to parent/children
3. **S-expression determinism**: Spatial arrangement governed by deterministic sorting algorithm using S-expressions

### Core Design Choices

#### 1. Type System Design
- **UIComponent interface**: Hierarchical structure with `id`, `type`, optional `entityPath`, and `children[]`
- **ComponentType**: Restricted to 'container' | 'text' | 'number' | 'button'
- **Entity system**: Entities have `name` and `properties[]` for data binding
- **TopologicalClass**: Represents equivalence classes with signature, canonical form, complexity metrics

#### 2. Drag-and-Drop Architecture
- **Custom implementation**: Uses react-dnd but with custom logic for nested structures
- **Deepest-target detection**: Logic to manage nested container hierarchies
- **Throttled state updates**: 200ms throttle on drop target identification via `useThrottle` hook
- **Simple store pattern**: Custom `dragStore` with `useSyncExternalStore` for React 18 compatibility

#### 3. Visual Representation System
- **Color coding**: Grayscale shades based on tree depth, fixed colors for leaf types
- **S-expression sorting**: Deterministic component ordering using `generateSExpression()` function
- **Entity path parsing**: `parseEntityPath()` splits "Entity>Property" strings

#### 4. State Management Approach
- **Local state**: `useState` for component tree and context menu
- **Custom store**: `dragStore` for cross-component drag state
- **Context API**: `DragContext` for drag target management
- **No external state library** (Redux, Zustand, etc.)

### Component Responsibilities

#### App Component (681 lines)
- Main application container with full UI logic
- Manages component tree state and entities
- Implements drag-and-drop handlers
- Contains context menu logic
- Renders component hierarchy recursively

#### DragManager Component
- Provides `DragContext` with throttled drop target updates
- Wraps application to enable drag state management

#### Type Definitions (types.ts)
- Defines core data structures
- Establishes type constraints for the system

### Key Algorithms & Logic

#### 1. S-expression Generation
```typescript
function generateSExpression(component: UIComponent): string
```
Generates canonical string representation for deterministic sorting based on component type, entity path, and children's S-expressions.

#### 2. Component Sorting
```typescript
function sortComponentsBySExpression(components: UIComponent[]): UIComponent[]
```
Sorts components lexicographically using S-expression values to enforce deterministic layout.

#### 3. Descendant Detection
Recursive function in App.tsx checks if a component is descendant of another for drag validation.

#### 4. Entity Path Parsing
Splits "Entity>Property" strings into entity and property components for display.

### Styling & UI Design
- **Dark theme**: #1a1a1a background with #f0f0f0 text
- **Component visualization**: Boxes with colored borders based on type/depth
- **Interactive feedback**: Hover effects, context menus, drag previews
- **Responsive design**: Flexbox layout with viewport-relative sizing

### Potential Inconsistencies & Quirks

#### 1. Mixed State Management
- Uses both React Context and custom store pattern
- `dragStore` uses singleton pattern rather than React context for some drag state

#### 2. Missing Error Boundaries
- No React error boundary implementation
- Potential unhandled errors in drag operations

#### 3. Limited Type Safety in Drag System
- `DragItem.type` is string rather than union type
- Some type assertions (`!` operator) in main.tsx

#### 4. Formatter Configuration
- Prettier configured with 2-space indentation
- Format-on-edit hook ensures consistent formatting automatically

#### 5. Japanese Comments
- Some comments in Japanese (e.g., "コンポーネントタイプと深さに基づく色を生成")
- Mixed language documentation

### Development Workflow Notes

#### Build & Test Commands
- Standard Vite/React commands: `pnpm run dev`, `pnpm run build`, `pnpm run preview`
- ESLint configured but no auto-fix script
- Test commands: `pnpm run test` (Vitest), `pnpm run test:ui` (Vitest UI)
- Format-on-edit hook automatically runs Prettier after each file edit

#### Non-Standard Requirements
- No environment variables required
- No build-time configuration needed
- Simple development setup

#### Potential Gotchas
1. **Drag state persistence**: `dragStore` maintains state outside React tree
2. **Throttle timing**: 200ms throttle on drag target updates may affect UX
3. **No undo/redo**: Component tree modifications are not reversible
4. **No persistence**: Designs not saved between sessions

### Future Development Path (from README)
- Input node component for data entry fields
- Entity editor interface
- Common labels vocabulary
- Export/import functionality (JSON/HTML)
- Storyboard system for UI state transitions
- Demo mode for testing

## Summary
The Topological UI Designer is a specialized educational tool built with modern React/TypeScript. It enforces a constrained design environment to teach UI architecture fundamentals through topological relationships rather than visual styling. The codebase is relatively small (19 files, ~1,200 lines plus configuration) with a focused architecture centered around hierarchical component trees, deterministic sorting via S-expressions, and a custom drag-and-drop system for manipulating UI structure. The project includes automated formatting (Prettier), testing (Vitest), and Claude Code automation hooks.