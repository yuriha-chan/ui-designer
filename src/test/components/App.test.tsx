import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "./test-utils";
import userEvent from "@testing-library/user-event";
import App from "../../App";
import { simpleTree } from "../../../__fixtures__/componentTrees";
import { allEntities } from "../../../__fixtures__/entities";

// Mock console.log to keep test output clean
vi.spyOn(console, "log").mockImplementation(() => {});

describe("App", () => {
  beforeEach(() => {
    // Reset any mocks if needed
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<App />);
    // Check for some expected elements
    expect(screen.getByText("Entities")).toBeInTheDocument();
  });

  it("renders entities panel with sample entities", () => {
    render(<App />);

    // Check entity names are present
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByText("Order")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();

    // Check some properties
    expect(screen.getByText("Account > Name")).toBeInTheDocument();
    expect(screen.getByText("Product > Price")).toBeInTheDocument();
    expect(screen.getByText("Order > Total")).toBeInTheDocument();
    expect(screen.getByText("User > Role")).toBeInTheDocument();
  });

  it("renders initial component tree with root container", () => {
    render(<App />);

    // Root container should be present (depth-0 class)
    const rootBox = document.querySelector(".component-box.depth-0");
    expect(rootBox).not.toBeNull();
    // Root container should have no direct entity path display
    const entityDisplay = rootBox?.querySelector(".entity-path-display");
    expect(entityDisplay).toBeNull();
  });

  it("opens container-create context menu on right-clicking container", async () => {
    const user = userEvent.setup();
    render(<App />);

    const rootBox = document.querySelector(
      ".component-box.depth-0"
    ) as HTMLElement;
    await user.pointer({ target: rootBox, keys: "[MouseRight]" });

    // Context menu should appear with title "Add Component"
    expect(screen.getByText("Add Component")).toBeInTheDocument();
    expect(screen.getByText("Container")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
    expect(screen.getByText("Number")).toBeInTheDocument();
    expect(screen.getByText("Button")).toBeInTheDocument();
  });

  it("creates a container component when selecting Container from context menu", async () => {
    const user = userEvent.setup();
    render(<App />);

    const rootBox = document.querySelector(
      ".component-box.depth-0"
    ) as HTMLElement;
    await user.pointer({ target: rootBox, keys: "[MouseRight]" });

    // Click Container option
    const containerOption = screen.getByText("Container");
    await user.click(containerOption);

    // Should add a child container (depth-1)
    const childContainers = document.querySelectorAll(".component-box.depth-1");
    expect(childContainers.length).toBe(1);
    // Child container should have no entity path display
    const childBox = childContainers[0];
    const entityDisplay = childBox.querySelector(".entity-path-display");
    expect(entityDisplay).toBeNull();
  });

  it("creates a text component with entity path via context menu", async () => {
    const user = userEvent.setup();
    render(<App />);

    const rootBox = document.querySelector(
      ".component-box.depth-0"
    ) as HTMLElement;
    await user.pointer({ target: rootBox, keys: "[MouseRight]" });

    // Click Text option (should open entity path menu)
    const textOption = screen.getByText("Text");
    await user.click(textOption);

    // Entity path menu should appear
    expect(screen.getByText("Select Entity Path")).toBeInTheDocument();
    // Find the entity path menu
    const entityPathMenu = document.querySelector(
      ".entity-path-menu"
    ) as HTMLElement;
    expect(entityPathMenu).not.toBeNull();
    const menu = within(entityPathMenu);

    // Expand Account entity by clicking the accordion title
    const accountAccordionTitle = menu
      .getByText("Account")
      .closest(".accordion-title") as HTMLElement;
    expect(accountAccordionTitle).not.toBeNull();
    await user.click(accountAccordionTitle);

    // Wait for property list to appear (accordion content expanded)
    // Click property "Name"
    const nameProperty = menu.getByText("Name");
    await user.click(nameProperty);

    // Should add a leaf component with entity path displayed
    const leafComponents = document.querySelectorAll(".component-box.depth-1");
    expect(leafComponents.length).toBe(1);
    const leafBox = leafComponents[0];
    const entityLabel = leafBox.querySelector(".entity-label");
    const propertyLabel = leafBox.querySelector(".property-label");
    expect(entityLabel?.textContent).toBe("Account");
    expect(propertyLabel?.textContent).toBe("Name");
  });

  it("copies a component when copy button is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    // First create a container component to have something to copy
    const rootBox = document.querySelector(
      ".component-box.depth-0"
    ) as HTMLElement;
    await user.pointer({ target: rootBox, keys: "[MouseRight]" });
    const containerOption = screen.getByText("Container");
    await user.click(containerOption);

    // Now we have a child container, should have copy button
    const childContainer = document.querySelector(".component-box.depth-1");
    expect(childContainer).not.toBeNull();
    const copyButton = childContainer?.querySelector(
      'button[title="Copy"]'
    ) as HTMLButtonElement;
    expect(copyButton).not.toBeNull();
    await user.click(copyButton);

    // Should have two child containers now (original + copy)
    const childContainers = document.querySelectorAll(".component-box.depth-1");
    expect(childContainers.length).toBe(2);
  });

  it("removes a component when remove button is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Create a container component
    const rootBox = document.querySelector(
      ".component-box.depth-0"
    ) as HTMLElement;
    await user.pointer({ target: rootBox, keys: "[MouseRight]" });
    const containerOption = screen.getByText("Container");
    await user.click(containerOption);

    // Should have one child container
    let childContainers = document.querySelectorAll(".component-box.depth-1");
    expect(childContainers.length).toBe(1);

    // Click remove button
    const childContainer = childContainers[0];
    const removeButton = childContainer.querySelector(
      'button[title="Remove"]'
    ) as HTMLButtonElement;
    expect(removeButton).not.toBeNull();
    await user.click(removeButton);

    // Should have no child containers
    childContainers = document.querySelectorAll(".component-box.depth-1");
    expect(childContainers.length).toBe(0);
  });

  it("closes context menu when Escape key is pressed", async () => {
    const user = userEvent.setup();
    render(<App />);

    const rootBox = document.querySelector(
      ".component-box.depth-0"
    ) as HTMLElement;
    await user.pointer({ target: rootBox, keys: "[MouseRight]" });

    // Context menu should be open
    expect(screen.getByText("Add Component")).toBeInTheDocument();

    // Press Escape
    await user.keyboard("{Escape}");

    // Context menu should be closed
    expect(screen.queryByText("Add Component")).not.toBeInTheDocument();
  });

  it("closes context menu when clicking outside", async () => {
    const user = userEvent.setup();
    render(<App />);

    const rootBox = document.querySelector(
      ".component-box.depth-0"
    ) as HTMLElement;
    await user.pointer({ target: rootBox, keys: "[MouseRight]" });

    // Context menu should be open
    expect(screen.getByText("Add Component")).toBeInTheDocument();

    // Click outside (e.g., on the entities panel)
    const entitiesPanel = screen.getByText("Entities");
    await user.click(entitiesPanel);

    // Context menu should be closed
    expect(screen.queryByText("Add Component")).not.toBeInTheDocument();
  });

  it("updates entity path of existing leaf component", async () => {
    const user = userEvent.setup();
    render(<App />);

    // First create a text component with Account > Name
    const rootBox = document.querySelector(
      ".component-box.depth-0"
    ) as HTMLElement;
    await user.pointer({ target: rootBox, keys: "[MouseRight]" });
    const textOption = screen.getByText("Text");
    await user.click(textOption);

    const entityPathMenu = document.querySelector(
      ".entity-path-menu"
    ) as HTMLElement;
    const menu = within(entityPathMenu);
    const accountAccordionTitle = menu
      .getByText("Account")
      .closest(".accordion-title") as HTMLElement;
    await user.click(accountAccordionTitle);
    const nameProperty = menu.getByText("Name");
    await user.click(nameProperty);

    // Verify leaf component exists with Account > Name
    let leafBox = document.querySelector(
      ".component-box.depth-1"
    ) as HTMLElement;
    expect(leafBox).not.toBeNull();
    expect(leafBox.querySelector(".entity-label")?.textContent).toBe("Account");
    expect(leafBox.querySelector(".property-label")?.textContent).toBe("Name");

    // Right-click the leaf component to open entity-path menu for update
    await user.pointer({ target: leafBox, keys: "[MouseRight]" });

    // Entity path menu should appear
    expect(screen.getByText("Select Entity Path")).toBeInTheDocument();
    const updatedMenu = within(
      document.querySelector(".entity-path-menu") as HTMLElement
    );

    // Select a different entity path: Product > Price
    const productAccordionTitle = updatedMenu
      .getByText("Product")
      .closest(".accordion-title") as HTMLElement;
    await user.click(productAccordionTitle);
    const priceProperty = updatedMenu.getByText("Price");
    await user.click(priceProperty);

    // Verify leaf component updated
    leafBox = document.querySelector(".component-box.depth-1") as HTMLElement;
    expect(leafBox.querySelector(".entity-label")?.textContent).toBe("Product");
    expect(leafBox.querySelector(".property-label")?.textContent).toBe("Price");
  });

  describe("import/export", () => {
    beforeEach(() => {
      // Mock URL.createObjectURL and URL.revokeObjectURL for download tests
      global.URL.createObjectURL = vi.fn(() => "blob:fake-url");
      global.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("renders export and import buttons in UI", () => {
      render(<App />);
      expect(screen.getByText("Export Design")).toBeInTheDocument();
      expect(screen.getByText("Import Design")).toBeInTheDocument();
    });

    it("export button triggers download with current design data", async () => {
      const user = userEvent.setup();
      const mockAnchorClick = vi.fn();
      HTMLAnchorElement.prototype.click = mockAnchorClick;

      render(<App />);
      const exportButton = screen.getByText("Export Design");
      await user.click(exportButton);

      // Should create a blob with JSON
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      const blobCall = (global.URL.createObjectURL as any).mock.calls[0][0];
      expect(blobCall).toBeInstanceOf(Blob);
      expect(blobCall.type).toBe("application/json");

      // Should trigger download click
      expect(mockAnchorClick).toHaveBeenCalled();

      // Clean up
      delete HTMLAnchorElement.prototype.click;
    });

    it("import button opens file input and loads design", async () => {
      const user = userEvent.setup();
      const mockFileReader = {
        readAsText: vi.fn(),
        result: JSON.stringify({
          version: "1.0",
          components: [
            {
              id: "new",
              type: "text",
              entityPath: "Account>Name",
              children: [],
            },
          ],
          entities: [{ name: "Account", properties: ["Name"] }],
        }),
        onload: null as any,
      };
      global.FileReader = vi.fn(() => mockFileReader) as any;

      render(<App />);
      const importButton = screen.getByText("Import Design");
      await user.click(importButton);

      // Should create file input
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).not.toBeNull();

      // Simulate file selection
      const file = new File([""], "design.json", { type: "application/json" });
      const changeEvent = new Event("change");
      Object.defineProperty(fileInput, "files", { value: [file] });
      fileInput?.dispatchEvent(changeEvent);

      // FileReader should be called
      expect(mockFileReader.readAsText).toHaveBeenCalledWith(file);

      // Simulate load complete
      mockFileReader.onload?.({ target: mockFileReader } as any);

      // Should update components state (check UI for new component)
      // This depends on implementation
    });

    it("shows error when importing invalid JSON", async () => {
      const user = userEvent.setup();
      const mockFileReader = {
        readAsText: vi.fn(),
        result: "invalid json",
        onload: null as any,
      };
      global.FileReader = vi.fn(() => mockFileReader) as any;
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      render(<App />);
      const importButton = screen.getByText("Import Design");
      await user.click(importButton);

      const fileInput = document.querySelector('input[type="file"]');
      const file = new File([""], "design.json", { type: "application/json" });
      const changeEvent = new Event("change");
      Object.defineProperty(fileInput, "files", { value: [file] });
      fileInput?.dispatchEvent(changeEvent);

      mockFileReader.onload?.({ target: mockFileReader } as any);

      expect(alertSpy).toHaveBeenCalledWith("Invalid JSON");
      alertSpy.mockRestore();
    });
  });
});
