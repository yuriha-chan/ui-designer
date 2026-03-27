import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "./test-utils";
import userEvent from "@testing-library/user-event";
import { ComponentNode } from "../../ComponentNode";
import { simpleTree } from "../../../__fixtures__/componentTrees";
import { allEntities } from "../../../__fixtures__/entities";

// Mock console.log to keep test output clean
vi.spyOn(console, "log").mockImplementation(() => {});

describe("ComponentNode", () => {
  const defaultProps = {
    component: simpleTree[0], // root container
    depth: 0,
    entities: allEntities,
    onCopy: vi.fn(),
    onRemove: vi.fn(),
    onEntityPathChange: vi.fn(),
    onMoveComponent: vi.fn(),
    isDescendant: vi.fn().mockReturnValue(false),
    setContextMenu: vi.fn(),
  };

  it("renders container component", () => {
    const { container } = render(<ComponentNode {...defaultProps} />);
    const rootBox = container.querySelector(".component-box.depth-0");
    expect(rootBox).not.toBeNull();
    // Container should not have entity-path-display direct child
    const allEntityDisplays = rootBox.querySelectorAll(".entity-path-display");
    const directEntityDisplays = Array.from(allEntityDisplays).filter(
      (el) => el.parentElement?.parentElement === rootBox
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
    const allActions = rootBox.querySelectorAll(".component-actions");
    const directActions = Array.from(allActions).filter(
      (el) => el.parentElement === rootBox
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
    const { container } = render(
      <ComponentNode
        {...defaultProps}
        component={leafComponent}
        parentId={simpleTree[0].id}
        setContextMenu={mockSetContextMenu}
      />
    );

    const componentBox = container.querySelector(
      ".component-box"
    ) as HTMLElement;
    await user.pointer({ target: componentBox, keys: "[MouseRight]" });

    expect(mockSetContextMenu).toHaveBeenCalledWith({
      type: "entity-path", // leaf component
      componentId: leafComponent.id,
      x: expect.any(Number),
      y: expect.any(Number),
    });
  });

  it("opens container-create context menu for container", async () => {
    const mockSetContextMenu = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <ComponentNode {...defaultProps} setContextMenu={mockSetContextMenu} />
    );

    const componentBox = container.querySelector(
      ".component-box"
    ) as HTMLElement;
    await user.pointer({ target: componentBox, keys: "[MouseRight]" });

    expect(mockSetContextMenu).toHaveBeenCalledWith({
      type: "container-create", // container component
      componentId: simpleTree[0].id,
      x: expect.any(Number),
      y: expect.any(Number),
    });
  });
});
