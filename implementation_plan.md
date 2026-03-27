# Test Implementation Plan for Topological UI Designer

## Context
The project is a Topological UI Designer educational tool with core algorithms for S-expression generation, component sorting, and drag-and-drop functionality. No tests currently exist despite Vitest and Testing Library being configured. The user wants to implement tests for existing functionalities, focusing on:
1. Unit tests for core algorithms
2. Component and UI interaction tests

## Key Discussion Points

### 1. **Testing Scope and Priorities**
- **Core algorithms** (pure functions): `generateSExpression`, `sortComponentsBySExpression`, `parseEntityPath`, `getColorForComponent`
- **Tree manipulation utilities**: `isDescendant`, `findAndRemove`, `insertAt`, `findComponent`, `deepCopy`
- **Component tree operations**: `moveComponent`, `copyComponent`, `removeComponent`, `addComponentToContainer`, `updateEntityPath`
- **UI components**: `App`, `ComponentNode`, `DragManager`, context menus
- **Drag-and-drop integration**: Store, context, throttling, drop detection

First focus on unit tests first, and then component tests.

### 2. **Mocking Strategy**
- `react-dnd`: Complex library needing mocks for `useDrag`, `useDrop`, `DndProvider`
- `uuid`: Need deterministic IDs for snapshot testing
- `@uidotdev/usehooks`: Mock `useThrottle` for predictable timing
- **Alternative**: Use `vitest`'s `vi.mock()` with factory functions

### 3. **Test Data Management**
- Sample component trees of varying complexity
- Entity data for entity path testing
- Need to maintain consistency between test data and actual types

### 4. **Test Organization Structure**
Proposed structure:
```
src/test/
  __fixtures__/     # Test data
  __mocks__/        # Mock implementations
  __helpers__/      # Test utilities
  unit/            # Pure function tests
  components/      # React component tests
  integration/     # User flow tests
```

### 5. **Component Testing Approach**
- `ComponentNode` is complex with drag-and-drop, context menus, and recursive rendering
- Need to mock `react-dnd` and test drag states visually
- Context menu interactions require user-event simulation

Component tests only focus on behavior, not visual details.

### 6. **Drag-and-Drop Testing Challenges**
- Testing throttling behavior (200ms delay)
- Testing cycle prevention logic (`isDescendant`)
- Simulating drag hover and drop events
- Verifying store updates and React re-renders

We create custom test utilities to simulate drag operations

### 7. **Test Coverage Goals**
- **Unit tests**: 90%+ coverage for pure functions
- **Component tests**: 80%+ coverage for component logic
- **Integration tests**: Critical user flows

I'll keep coverage as guidelines, not enforced criteria.

### 8. **CI/CD Integration**
- Add test scripts to `package.json`: `test:unit`, `test:components`, `test:integration`, `test:coverage`
- Coverage reporting with Vitest's built-in coverage
- It is allowed to commit before running test, but in this case the commit must be marked as "[wip]".

### 9. **Performance Considerations**
- Tests with deeply nested component trees may be slow
- Drag-and-drop tests with throttling does not use fake timers, because it's just 200ms.
- Need to balance thoroughness with test suite speed

### 10. **Accessibility Testing**
- No accessibility testing is scheduled for now.

## Implementation Plan

### Phase 1: Infrastructure Setup
1. Create test directory structure
2. Update `vitest.config.ts` with coverage configuration

### Phase 2: Unit Tests for Core Algorithms
1. `coreAlgorithms.test.ts`: `generateSExpression`, `sortComponentsBySExpression`, `parseEntityPath`, `getColorForComponent`
2. `componentUtils.test.ts`: Tree manipulation functions (`isDescendant`, `findAndRemove`, `insertAt`, etc.)

### Phase 3: Component Test setup
1. Set up mocks for `react-dnd`, `uuid`, `useThrottle`
2. Create test fixtures for component trees and entities
3. Add test utility functions and custom renderers

### Phase 4: Component Test
1. `ComponentNode.test.tsx`: Rendering, drag states, context menus, interactions
2. `App.test.tsx`: Main app rendering, context menu flows, state updates
3. `DragManager.test.tsx`: Context provider and throttling behavior

### Phase 5: Integration Tests
1. `dragAndDrop.test.tsx`: End-to-end drag operations with cycle prevention
2. `contextMenu.test.tsx`: Right-click flows and entity selection

### Phase 6: Polish and Coverage
1. Add missing test cases
2. Run coverage analysis
3. Optimize test performance
4. Add CI scripts and documentation

## Critical Files to Modify
- `/app/ui-designer/src/test/` (new directory)
- `/app/ui-designer/vitest.config.ts` (add coverage config)
- `/app/ui-designer/package.json` (add test scripts)
- `/app/ui-designer/src/App.tsx` (contains functions to test)
- `/app/ui-designer/src/types.ts` (type definitions for test data)

## Verification Strategy
1. Run `pnpm test` to ensure all tests pass
2. Check coverage reports for gaps
3. Manual verification of UI interactions
4. TypeScript compilation without errors

## Test Writing Rules
- Write a test for the inter-module level (not `private`) functions based on the agreed-upon Implementation Plan.
- The test MUST be a functional test. It should not test internal structures.
- You MUST edit existing test rather than creating new one if the objective is to change the current behavior.
- When you mock the dependencies, you should mock high-level APIs, that don't relies on implementational details.
- When you mock the dependencies, you should test for mock calls.
- Write multiple tests for one function to test differing inputs.
- You MUST consider edge cases and write tests for boundary conditions, not just the "happy path".
- You MUST write tests that expects exceptions where there will be an error for some input. (when it applies)

## Failure Resolution Rules
- Do not add speculative features.
- You MUST run the test and observe the test succeeds.
- If not, edit the source again and retry the test.
- If the error persists and you struggle, you MUST give up early and report to the user and ask for resolution ideas.

## Refactoring Rules (when you made edit consider this)
- Review the code edit and consider structural refactoring relating to the edit. Refactoring choices include (but are not limited to) changes in data types, modifying the class properties, introduction of new enum types, new variables to track intermediate states.
- Actively detect any parallel abstractions, duplicated responsibilities, or incompatible data models. Refactor regorously to avoid them.
- If there are multiple design choices to consider, you MUST stop editing and ask for the user's opinion.
- The inquiry to the user can be skipped ONLY IF the decision is obvious based on the past choices explicitly made by the user.
- If you decide not to refactor, you must devise rationale for non-editing e.g. the changes are naturally fitting within the existing framework or flow of procedure.
- You MUST run the test again to ensure the test is still passing.
