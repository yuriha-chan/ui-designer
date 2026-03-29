import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "./test-utils";
import userEvent from "@testing-library/user-event";
import { ComponentNode } from "../../ComponentNode";
import { sortComponentsBySExpression } from "../../componentTree";
import { simpleTree } from "../../../__fixtures__/componentTrees";
import { allEntities } from "../../../__fixtures__/entities";
import * as ContextMenuContextModule from "../../ContextMenuContext";

vi.spyOn(console, "log").mockImplementation(() => {});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ComponentNode", () => {
  const defaultProps = {
    component: simpleTree[0], // root container
    depth: 0,
    entities: allEntities,
    screens: [] as any[], // mock screens array
    onCopy: vi.fn(),
    onRemove: vi.fn(),
    onEntityPathChange: vi.fn(),
    onTargetScreenChange: vi.fn(),
    onButtonClick: vi.fn(),
    onMoveComponent: vi.fn(),
    isDescendant: vi.fn().mockReturnValue(false),
    previewMode: false,
  };

  it("renders container component", () => {
    const { container } = render(<ComponentNode {...defaultProps} />);
    const rootBox = container.querySelector(".component-box.depth-0");
    expect(rootBox).not.toBeNull();
    // Container should not have entity-path-display direct child
    const allEntityDisplays = rootBox!.querySelectorAll(".entity-path-display");
    const directEntityDisplays = Array.from(allEntityDisplays).filter(
      (el) => el.parentElement?.parentElement === rootBox!
    );
    expect(directEntityDisplays.length).toBe(0);
  });

  it("renders leaf component with entity path", () => {
    const leafComponent = simpleTree[0].children[0]; // text1
    render(
      <ComponentNode
        {...defaultProps}
        component={leafComponent}
        parentId={simpleTree[0].id}
      />
    );

    // Should show entity and property
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("shows copy and remove buttons when parentId is provided", () => {
    const leafComponent = simpleTree[0].children[0];
    render(
      <ComponentNode
        {...defaultProps}
        component={leafComponent}
        parentId={simpleTree[0].id}
      />
    );

    // Should have copy and remove buttons
    expect(screen.getByTitle("Copy")).toBeInTheDocument();
    expect(screen.getByTitle("Remove")).toBeInTheDocument();
  });

  it("does not show copy and remove buttons for root component", () => {
    const { container } = render(<ComponentNode {...defaultProps} />);
    const rootBox = container.querySelector(".component-box.depth-0");
    expect(rootBox).not.toBeNull();
    // Root component should not have .component-actions direct child
    const allActions = rootBox!.querySelectorAll(".component-actions");
    const directActions = Array.from(allActions).filter(
      (el) => el.parentElement === rootBox!
    );
    expect(directActions.length).toBe(0);
  });

  it("calls onCopy when copy button is clicked", async () => {
    const leafComponent = simpleTree[0].children[0];
    const mockOnCopy = vi.fn();
    const user = userEvent.setup();
    render(
      <ComponentNode
        {...defaultProps}
        component={leafComponent}
        parentId={simpleTree[0].id}
        onCopy={mockOnCopy}
      />
    );

    const copyButton = screen.getByTitle("Copy");
    await user.click(copyButton);

    expect(mockOnCopy).toHaveBeenCalledWith(leafComponent.id, simpleTree[0].id);
  });

  it("calls onRemove when remove button is clicked", async () => {
    const leafComponent = simpleTree[0].children[0];
    const mockOnRemove = vi.fn();
    const user = userEvent.setup();
    render(
      <ComponentNode
        {...defaultProps}
        component={leafComponent}
        parentId={simpleTree[0].id}
        onRemove={mockOnRemove}
      />
    );

    const removeButton = screen.getByTitle("Remove");
    await user.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalledWith(leafComponent.id);
  });

  it("opens context menu on right click", async () => {
    const leafComponent = simpleTree[0].children[0];
    const mockSetContextMenu = vi.fn();
    const user = userEvent.setup();

    vi.spyOn(
      ContextMenuContextModule,
      "useContextMenuDispatch"
    ).mockReturnValue(mockSetContextMenu);

    const { container } = render(
      <ComponentNode
        {...defaultProps}
        component={leafComponent}
        parentId={simpleTree[0].id}
      />
    );

    const componentBox = container.querySelector(
      ".component-box"
    ) as HTMLElement;
    await user.pointer({ target: componentBox, keys: "[MouseRight]" });

    expect(mockSetContextMenu).toHaveBeenCalledWith({
      type: "entity-path",
      componentId: leafComponent.id,
      x: expect.any(Number),
      y: expect.any(Number),
      pendingComponentType: leafComponent.type,
      isUpdate: true,
    });
  });

  it("opens container-create context menu for container", async () => {
    const mockSetContextMenu = vi.fn();
    const user = userEvent.setup();

    vi.spyOn(
      ContextMenuContextModule,
      "useContextMenuDispatch"
    ).mockReturnValue(mockSetContextMenu);

    const { container } = render(<ComponentNode {...defaultProps} />);

    const componentBox = container.querySelector(
      ".component-box"
    ) as HTMLElement;
    await user.pointer({ target: componentBox, keys: "[MouseRight]" });

    expect(mockSetContextMenu).toHaveBeenCalledWith({
      type: "container-create",
      componentId: simpleTree[0].id,
      x: expect.any(Number),
      y: expect.any(Number),
    });
  });

  it("renders children in sorted order", () => {
    const { container } = render(<ComponentNode {...defaultProps} />);
    const rootBox = container.querySelector(".component-box.depth-0");
    expect(rootBox).not.toBeNull();

    // Find children container
    const childrenContainer = rootBox!.querySelector(".children-container");
    expect(childrenContainer).not.toBeNull();

    // Get all child component boxes
    const childBoxes = childrenContainer!.querySelectorAll(".component-box");
    expect(childBoxes.length).toBe(simpleTree[0].children.length);

    // Get sorted children IDs
    const sortedChildren = sortComponentsBySExpression(simpleTree[0].children);
    const sortedIds = sortedChildren.map((child) => child.id);

    // For each child box, we need to identify which component it represents
    // We can match by entity and property labels
    const childBoxArray = Array.from(childBoxes);
    const renderedIds: string[] = [];

    for (let i = 0; i < childBoxArray.length; i++) {
      const box = childBoxArray[i];
      const entityLabel = box.querySelector(".entity-label");
      const propertyLabel = box.querySelector(".property-label");

      // Find which component matches these labels
      const matchingComponent = simpleTree[0].children.find((child) => {
        const entityPath = child.entityPath || "";
        const [entity, property] = entityPath.split(">");
        return (
          entityLabel?.textContent === entity.trim() &&
          propertyLabel?.textContent === (property || "").trim()
        );
      });

      if (matchingComponent) {
        renderedIds.push(matchingComponent.id);
      }
    }

    // Check that rendered IDs match sorted order
    expect(renderedIds).toEqual(sortedIds);
  });
});
