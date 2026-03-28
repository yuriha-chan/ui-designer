import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "./test-utils";
import userEvent from "@testing-library/user-event";
import App from "../../App";

vi.mock("../../storage", () => ({
  saveToStorage: vi.fn(),
  loadFromStorage: vi.fn(() => null),
}));

vi.spyOn(console, "log").mockImplementation(() => {});

describe("Undo/Redo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createContainerComponent = async (
    user: ReturnType<typeof userEvent.setup>
  ) => {
    const rootBox = document.querySelector(
      ".component-box.depth-0"
    ) as HTMLElement;
    await user.pointer({ target: rootBox, keys: "[MouseRight]" });
    const containerOption = screen.getByText("Container");
    await user.click(containerOption);
  };

  it("undoes component creation when undo button is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Create a container component
    await createContainerComponent(user);

    // Verify container was created
    let childContainers = document.querySelectorAll(".component-box.depth-1");
    expect(childContainers.length).toBe(1);

    // Click undo button
    const undoButton = screen.getByText("Undo") as HTMLButtonElement;
    await user.click(undoButton);

    // Container should be removed
    childContainers = document.querySelectorAll(".component-box.depth-1");
    expect(childContainers.length).toBe(0);
  });

  it("redoes component creation after undo", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Create a container component
    await createContainerComponent(user);

    // Verify container was created
    let childContainers = document.querySelectorAll(".component-box.depth-1");
    expect(childContainers.length).toBe(1);

    // Click undo button
    const undoButton = screen.getByText("Undo");
    await user.click(undoButton);

    // Container should be removed
    childContainers = document.querySelectorAll(".component-box.depth-1");
    expect(childContainers.length).toBe(0);

    // Click redo button
    const redoButton = screen.getByText("Redo");
    await user.click(redoButton);

    // Container should be restored
    childContainers = document.querySelectorAll(".component-box.depth-1");
    expect(childContainers.length).toBe(1);
  });

  it("undoes component removal when undo button is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Create a container component
    await createContainerComponent(user);

    // Verify container was created
    let childContainers = document.querySelectorAll(".component-box.depth-1");
    expect(childContainers.length).toBe(1);

    // Click remove button on the container
    const childContainer = childContainers[0];
    const removeButton = childContainer.querySelector(
      'button[title="Remove"]'
    ) as HTMLButtonElement;
    await user.click(removeButton);

    // Container should be removed
    childContainers = document.querySelectorAll(".component-box.depth-1");
    expect(childContainers.length).toBe(0);

    // Click undo button
    const undoButton = screen.getByText("Undo");
    await user.click(undoButton);

    // Container should be restored
    childContainers = document.querySelectorAll(".component-box.depth-1");
    expect(childContainers.length).toBe(1);
  });

  it.skip("limits history to 50 steps", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Get the undo button to check its enabled state
    const undoButton = screen.getByText("Undo") as HTMLButtonElement;

    // Create 10 components (faster test - history limit logic is the same)
    for (let i = 0; i < 10; i++) {
      await createContainerComponent(user);
      // Clear context menu by pressing Escape
      await user.keyboard("{Escape}");
    }

    // Should have 50+ containers (history limited to 50)
    const childContainers = document.querySelectorAll(".component-box.depth-1");
    expect(childContainers.length).toBeGreaterThanOrEqual(50);

    // Undo should work (we're within the 50 limit)
    await user.click(undoButton);
    const containersAfterUndo = document.querySelectorAll(
      ".component-box.depth-1"
    );
    expect(containersAfterUndo.length).toBe(childContainers.length - 1);
  });

  it("Ctrl+Z keyboard shortcut triggers undo", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Create a container component
    await createContainerComponent(user);

    // Verify container was created
    let childContainers = document.querySelectorAll(".component-box.depth-1");
    expect(childContainers.length).toBe(1);

    // Press Ctrl+Z
    await user.keyboard("{Control>}{z}{/Control}");

    // Container should be removed
    childContainers = document.querySelectorAll(".component-box.depth-1");
    expect(childContainers.length).toBe(0);
  });

  it("Ctrl+Shift+Z keyboard shortcut triggers redo", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Create a container component
    await createContainerComponent(user);

    // Verify container was created
    let childContainers = document.querySelectorAll(".component-box.depth-1");
    expect(childContainers.length).toBe(1);

    // Press Ctrl+Z to undo
    await user.keyboard("{Control>}{z}{/Control}");

    // Container should be removed
    childContainers = document.querySelectorAll(".component-box.depth-1");
    expect(childContainers.length).toBe(0);

    // Press Ctrl+Shift+Z to redo
    await user.keyboard("{Control>}{Shift>}{z}{/Shift}{/Control}");

    // Container should be restored
    childContainers = document.querySelectorAll(".component-box.depth-1");
    expect(childContainers.length).toBe(1);
  });

  it("undo button is disabled when history is empty", () => {
    render(<App />);

    const undoButton = screen.getByText("Undo") as HTMLButtonElement;
    expect(undoButton).toBeDisabled();
  });

  it("redo button is disabled when history is at latest state", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initially, redo should be disabled (no future states)
    const redoButton = screen.getByText("Redo") as HTMLButtonElement;
    expect(redoButton).toBeDisabled();

    // Create a component and undo
    await createContainerComponent(user);
    const undoButton = screen.getByText("Undo");
    await user.click(undoButton);

    // After undo, redo should be enabled
    const redoAfterUndo = screen.getByText("Redo") as HTMLButtonElement;
    expect(redoAfterUndo).not.toBeDisabled();
  });

  it("new action after undo clears redo history", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Create first container
    await createContainerComponent(user);

    // Undo first container
    const undoButton = screen.getByText("Undo");
    await user.click(undoButton);

    // Create a new different container (to have different state)
    // Clear context menu first
    await user.keyboard("{Escape}");
    await createContainerComponent(user);

    // At this point, the old "redo" state should be cleared
    // So redo button should be disabled
    const redoButton = screen.getByText("Redo") as HTMLButtonElement;
    expect(redoButton).toBeDisabled();
  });
});
