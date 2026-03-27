import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "./test-utils";
import React, { useContext } from "react";

// Create hoisted mock functions
const mockUseThrottle = vi.hoisted(() => vi.fn());
const mockSetCurrentDropTargetId = vi.hoisted(() => vi.fn());

// Mock modules before imports (hoisted)
vi.mock("@uidotdev/usehooks", () => ({
  useThrottle: mockUseThrottle,
}));

vi.mock("../../dragStore", () => ({
  dragStore: {
    setCurrentDropTargetId: mockSetCurrentDropTargetId,
    getState: vi.fn(() => ({ currentDropTargetId: null })),
    subscribe: vi.fn(() => () => {}),
  },
  useDragSelector: vi.fn(),
}));

// Now import DragManager after mocks are set up
import { DragManager, DragContext } from "../../DragManager";

// Mock console.log to keep test output clean
vi.spyOn(console, "log").mockImplementation(() => {});

describe("DragManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    mockUseThrottle.mockImplementation((value) => value);
    mockSetCurrentDropTargetId.mockClear();
  });

  it("renders children", () => {
    render(
      <DragManager>
        <div data-testid="child">Child Component</div>
      </DragManager>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("provides setRawDropTargetId via context", () => {
    let contextValue: any = null;
    const TestConsumer = () => {
      contextValue = useContext(DragContext);
      return null;
    };

    render(
      <DragManager>
        <TestConsumer />
      </DragManager>
    );

    expect(contextValue).not.toBeNull();
    expect(contextValue.setRawDropTargetId).toBeInstanceOf(Function);
  });

  it("updates drag store when throttledId changes", () => {
    // Mock useThrottle to return a specific value
    mockUseThrottle.mockReturnValue("some-id");
    const { rerender } = render(
      <DragManager>
        <div>Child</div>
      </DragManager>
    );

    // Expect dragStore.setCurrentDropTargetId to have been called with "some-id"
    expect(mockSetCurrentDropTargetId).toHaveBeenCalledWith("some-id");

    // Change throttledId to another value by re-mocking and rerendering
    mockUseThrottle.mockReturnValue("another-id");
    rerender(
      <DragManager>
        <div>Child</div>
      </DragManager>
    );

    expect(mockSetCurrentDropTargetId).toHaveBeenCalledWith("another-id");
  });
});
