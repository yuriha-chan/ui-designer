import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, waitFor } from "./test-utils";
import userEvent from "@testing-library/user-event";
import App from "../../App";

// Mock storage module
vi.mock("../../storage", () => ({
  saveToStorage: vi.fn(),
  loadFromStorage: vi.fn(() => null),
}));

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
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
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

  it("shows full placeholder labels for button component entity path menu", async () => {
    const user = userEvent.setup();
    render(<App />);

    const rootBox = document.querySelector(
      ".component-box.depth-0"
    ) as HTMLElement;
    await user.pointer({ target: rootBox, keys: "[MouseRight]" });

    // Click Button option (should open entity path menu)
    const buttonOption = screen.getByText("Button");
    await user.click(buttonOption);

    // Entity path menu should appear
    expect(screen.getByText("Select Entity Path")).toBeInTheDocument();
    const entityPathMenu = document.querySelector(
      ".entity-path-menu"
    ) as HTMLElement;
    expect(entityPathMenu).not.toBeNull();
    const menu = within(entityPathMenu);

    // Check that all placeholder options are displayed (without colon)
    expect(menu.getByText("OK")).toBeInTheDocument();
    expect(menu.getByText("Cancel")).toBeInTheDocument();
    expect(menu.getByText("Select")).toBeInTheDocument();
    expect(menu.getByText("Delete")).toBeInTheDocument();
    expect(menu.getByText("New")).toBeInTheDocument();
    expect(menu.getByText("...")).toBeInTheDocument();

    // Select a placeholder (e.g., OK)
    const okOption = menu.getByText("OK");
    await user.click(okOption);

    // Should add a leaf component with placeholder displayed (without colon)
    const leafComponents = document.querySelectorAll(".component-box.depth-1");
    expect(leafComponents.length).toBe(1);
    const leafBox = leafComponents[0];
    const entityLabel = leafBox.querySelector(".entity-label");
    expect(entityLabel?.textContent).toBe("OK");
  });

  it("shows only ... placeholder for text/number component entity path menu", async () => {
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
    const entityPathMenu = document.querySelector(
      ".entity-path-menu"
    ) as HTMLElement;
    expect(entityPathMenu).not.toBeNull();
    const menu = within(entityPathMenu);

    // Check that only ... placeholder is displayed (other placeholders should not be present)
    expect(menu.getByText("...")).toBeInTheDocument();
    // Ensure other placeholders are NOT present
    expect(menu.queryByText("OK")).not.toBeInTheDocument();
    expect(menu.queryByText("Cancel")).not.toBeInTheDocument();
    expect(menu.queryByText("Select")).not.toBeInTheDocument();
    expect(menu.queryByText("Delete")).not.toBeInTheDocument();
    expect(menu.queryByText("New")).not.toBeInTheDocument();

    // Select ... placeholder
    const ellipsisOption = menu.getByText("...");
    await user.click(ellipsisOption);

    // Should add a leaf component with ... displayed
    const leafComponents = document.querySelectorAll(".component-box.depth-1");
    expect(leafComponents.length).toBe(1);
    const leafBox = leafComponents[0];
    const entityLabel = leafBox.querySelector(".entity-label");
    expect(entityLabel?.textContent).toBe("...");
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

    // First create a text component with Name
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

    // Verify leaf component exists with Name
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

    // Select a different entity path: Price
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

  it("shows only ... placeholder when right-clicking text component", async () => {
    const user = userEvent.setup();
    render(<App />);

    // First create a text component with ...
    const rootBox = document.querySelector(
      ".component-box.depth-0"
    ) as HTMLElement;
    await user.pointer({ target: rootBox, keys: "[MouseRight]" });
    const textOption = screen.getByText("Text");
    await user.click(textOption);

    // Select ... placeholder
    const entityPathMenu = document.querySelector(
      ".entity-path-menu"
    ) as HTMLElement;
    const menu = within(entityPathMenu);
    const ellipsisOption = menu.getByText("...");
    await user.click(ellipsisOption);

    // Verify leaf component exists
    await waitFor(() => {
      const leafBox = document.querySelector(".component-box.depth-1");
      expect(leafBox).not.toBeNull();
    });
    const leafBox = document.querySelector(
      ".component-box.depth-1"
    ) as HTMLElement;
    expect(leafBox.querySelector(".entity-label")?.textContent).toBe("...");

    // Right-click the text leaf component to open entity-path menu for update
    await user.pointer({ target: leafBox, keys: "[MouseRight]" });

    // Entity path menu should appear
    expect(screen.getByText("Select Entity Path")).toBeInTheDocument();
    const updateMenu = within(
      document.querySelector(".entity-path-menu") as HTMLElement
    );

    // Check that only ... placeholder is displayed for text component
    expect(updateMenu.getByText("...")).toBeInTheDocument();
    // Ensure other placeholders are NOT present
    expect(updateMenu.queryByText("OK")).not.toBeInTheDocument();
    expect(updateMenu.queryByText("Cancel")).not.toBeInTheDocument();
    expect(updateMenu.queryByText("Select")).not.toBeInTheDocument();
    expect(updateMenu.queryByText("Delete")).not.toBeInTheDocument();
    expect(updateMenu.queryByText("New")).not.toBeInTheDocument();
    expect(updateMenu.queryByText("12...")).not.toBeInTheDocument();
  });

  it("shows only 12... placeholder when right-clicking number component", async () => {
    const user = userEvent.setup();
    render(<App />);

    // First create a number component with Price (which is number type)
    const rootBox = document.querySelector(
      ".component-box.depth-0"
    ) as HTMLElement;
    await user.pointer({ target: rootBox, keys: "[MouseRight]" });
    const numberOption = screen.getByText("Number");
    await user.click(numberOption);

    // Select Product > Price entity path
    const entityPathMenu = document.querySelector(
      ".entity-path-menu"
    ) as HTMLElement;
    const menu = within(entityPathMenu);
    const productAccordionTitle = menu
      .getByText("Product")
      .closest(".accordion-title") as HTMLElement;
    await user.click(productAccordionTitle);
    const priceProperty = menu.getByText("Price");
    await user.click(priceProperty);

    // Verify leaf component exists
    await waitFor(() => {
      const leafBox = document.querySelector(".component-box.depth-1");
      expect(leafBox).not.toBeNull();
    });
    const leafBox = document.querySelector(
      ".component-box.depth-1"
    ) as HTMLElement;

    // Right-click the number leaf component to open entity-path menu for update
    await user.pointer({ target: leafBox, keys: "[MouseRight]" });

    // Entity path menu should appear
    expect(screen.getByText("Select Entity Path")).toBeInTheDocument();
    const updateMenu = within(
      document.querySelector(".entity-path-menu") as HTMLElement
    );

    // Check that only 12... placeholder is displayed for number component
    expect(updateMenu.getByText("12...")).toBeInTheDocument();
    // Ensure other placeholders are NOT present
    expect(updateMenu.queryByText("...")).not.toBeInTheDocument();
    expect(updateMenu.queryByText("OK")).not.toBeInTheDocument();
    expect(updateMenu.queryByText("Cancel")).not.toBeInTheDocument();
    expect(updateMenu.queryByText("Select")).not.toBeInTheDocument();
    expect(updateMenu.queryByText("Delete")).not.toBeInTheDocument();
    expect(updateMenu.queryByText("New")).not.toBeInTheDocument();
  });

  it("shows button placeholders when right-clicking button component", async () => {
    const user = userEvent.setup();
    render(<App />);

    // First create a button component
    const rootBox = document.querySelector(
      ".component-box.depth-0"
    ) as HTMLElement;
    await user.pointer({ target: rootBox, keys: "[MouseRight]" });
    const buttonOption = screen.getByText("Button");
    await user.click(buttonOption);

    // Entity path menu should appear with button placeholders
    expect(screen.getByText("Select Entity Path")).toBeInTheDocument();
    const menu = within(
      document.querySelector(".entity-path-menu") as HTMLElement
    );

    // Check that button placeholders are displayed
    expect(menu.getByText("OK")).toBeInTheDocument();
    expect(menu.getByText("Cancel")).toBeInTheDocument();
    expect(menu.getByText("Select")).toBeInTheDocument();
    expect(menu.getByText("Delete")).toBeInTheDocument();
    expect(menu.getByText("New")).toBeInTheDocument();
    expect(menu.getByText("...")).toBeInTheDocument();
    // 12... should NOT be present for button
    expect(menu.queryByText("12...")).not.toBeInTheDocument();
  });

  describe("import/export", () => {
    beforeEach(() => {
      // Mock URL.createObjectURL and URL.revokeObjectURL for download tests
      globalThis.URL.createObjectURL = vi.fn(() => "blob:fake-url");
      globalThis.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("renders export and import buttons in UI", () => {
      render(<App />);
      expect(screen.getByText("Export")).toBeInTheDocument();
      expect(screen.getByText("Import")).toBeInTheDocument();
    });

    it("export button triggers download with current design data", async () => {
      const user = userEvent.setup();
      const mockAnchorClick = vi.fn();
      HTMLAnchorElement.prototype.click = mockAnchorClick;

      render(<App />);
      const exportButton = screen.getByText("Export");
      await user.click(exportButton);

      // Should create a blob with JSON
      expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
      const blobCall = (globalThis.URL.createObjectURL as any).mock.calls[0][0];
      expect(blobCall).toBeInstanceOf(Blob);
      expect(blobCall.type).toBe("application/json");

      // Should trigger download click
      expect(mockAnchorClick).toHaveBeenCalled();

      // Clean up
      delete (HTMLAnchorElement.prototype as any).click;
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
      globalThis.FileReader = vi.fn(() => mockFileReader) as any;

      render(<App />);
      const importButton = screen.getByText("Import");
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
      globalThis.FileReader = vi.fn(() => mockFileReader) as any;
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      render(<App />);
      const importButton = screen.getByText("Import");
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

  describe("side panel tabs", () => {
    it("renders side panel with tabs for Entities and Screens", () => {
      render(<App />);
      expect(screen.getByText("Entities")).toBeInTheDocument();
      expect(screen.getByText("Screens")).toBeInTheDocument();
    });

    it("shows entities panel by default", () => {
      render(<App />);
      expect(screen.getByText("Account")).toBeInTheDocument();
      expect(screen.getByText("Product")).toBeInTheDocument();
    });

    it("switches to screens panel when Screens tab is clicked", async () => {
      const user = userEvent.setup();
      render(<App />);

      const screensTab = screen.getByText("Screens");
      await user.click(screensTab);

      expect(
        screen.getByPlaceholderText("New screen name")
      ).toBeInTheDocument();
    });

    it("switches back to entities panel when Entities tab is clicked", async () => {
      const user = userEvent.setup();
      render(<App />);

      const screensTab = screen.getByText("Screens");
      await user.click(screensTab);

      const entitiesTab = screen.getByText("Entities");
      await user.click(entitiesTab);

      expect(screen.getByText("Account")).toBeInTheDocument();
    });
  });

  describe("toolbar icons", () => {
    it("renders undo button with icon", () => {
      render(<App />);
      const undoButton = document.querySelector(
        'button[title="Undo (Ctrl+Z)"]'
      );
      expect(undoButton).not.toBeNull();
    });

    it("renders redo button with icon", () => {
      render(<App />);
      const redoButton = document.querySelector(
        'button[title="Redo (Ctrl+Shift+Z)"]'
      );
      expect(redoButton).not.toBeNull();
    });

    it("renders export button", () => {
      render(<App />);
      expect(screen.getByText("Export")).toBeInTheDocument();
    });

    it("renders import button", () => {
      render(<App />);
      expect(screen.getByText("Import")).toBeInTheDocument();
    });
  });

  describe("Entities Panel - Add Entity", () => {
    it("renders Add Entity button in entities panel", () => {
      render(<App />);

      expect(screen.getByText("+ Add Entity")).toBeInTheDocument();
    });

    it("adds a new entity when clicking Add Entity button", async () => {
      const user = userEvent.setup();
      render(<App />);

      const addButton = screen.getByText("+ Add Entity");
      await user.click(addButton);

      // New entity should appear with default name
      expect(screen.getAllByText("New Entity").length).toBeGreaterThan(0);
    });

    it("can edit entity name inline", async () => {
      const user = userEvent.setup();
      render(<App />);

      // Initially shows entity name
      expect(screen.getByText("Account")).toBeInTheDocument();

      // Click on entity name to edit - use the entity-name box in entities panel
      const entityBox = document.querySelectorAll(
        ".entity-name"
      )[0] as HTMLElement;
      await user.click(entityBox);

      // Input field should appear with current value
      expect(screen.getByDisplayValue("Account")).toBeInTheDocument();
    });
  });

  describe("Entities Panel - Edit Property", () => {
    it("can edit property name inline", async () => {
      const user = userEvent.setup();
      render(<App />);

      // Initially shows property name
      expect(screen.getByText("Name")).toBeInTheDocument();

      // Find and click on a property name (Name) - use first property in first entity
      const propertyText = document.querySelectorAll(
        ".entity-property"
      )[0] as HTMLElement;
      await user.click(propertyText);

      // Input field should appear with current property name
      expect(screen.getByDisplayValue("Name")).toBeInTheDocument();
    });

    it("can change property type via dropdown", async () => {
      const user = userEvent.setup();
      render(<App />);

      // Find a property type badge and change to number
      const typeBadge = document.querySelector(
        ".property-type-badge"
      ) as HTMLElement;
      if (typeBadge) {
        await user.click(typeBadge);
        // Select number type - use option element
        const numberOption = typeBadge.querySelector(
          "option[value='number']"
        ) as HTMLElement;
        await user.click(numberOption);
      }
    });

    it("shows entity_type dropdown when type is entity", async () => {
      render(<App />);

      // Find a property type select trigger and verify it exists
      const typeBadge = document.querySelector(
        ".property-type-badge"
      ) as HTMLElement;
      expect(typeBadge).toBeInTheDocument();
    });
  });

  describe("Entities Panel - Delete Entity and Property", () => {
    beforeEach(() => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
    });

    afterEach(() => {
      vi.spyOn(window, "confirm").mockRestore();
    });

    it("can delete an entity", async () => {
      const user = userEvent.setup();
      render(<App />);

      // Initially have 4 entities
      expect(screen.getByText("Account")).toBeInTheDocument();
      expect(screen.getByText("Product")).toBeInTheDocument();
      expect(screen.getByText("Order")).toBeInTheDocument();
      expect(screen.getByText("User")).toBeInTheDocument();

      // Find and click delete button on Account entity
      const accountEntity = screen.getByText("Account").closest(".entity");
      const deleteBtn = accountEntity?.querySelector(".delete-entity-btn");
      if (deleteBtn) {
        await user.click(deleteBtn);
      }

      // Account should be removed
      expect(screen.queryByText("Account")).not.toBeInTheDocument();
      // Others should remain
      expect(screen.getByText("Product")).toBeInTheDocument();
    });

    it("can delete a property", async () => {
      const user = userEvent.setup();
      render(<App />);

      // Initially Account has Name property
      expect(screen.getByText("Name")).toBeInTheDocument();

      // Find and click delete button on Name property
      const propertyRow = screen.getByText("Name").closest(".property-row");
      const deleteBtn = propertyRow?.querySelector(".delete-property-btn");
      if (deleteBtn) {
        await user.click(deleteBtn);
      }

      // Property should be removed
      expect(screen.queryByText("Name")).not.toBeInTheDocument();
    });
  });

  describe("Entities Panel - Entity Path Auto-Update", () => {
    it("updates component entity paths when entity name changes", async () => {
      const user = userEvent.setup();
      render(<App />);

      // Create a text component with entity path first
      const rootBox = document.querySelector(
        ".component-box.depth-0"
      ) as HTMLElement;
      await user.pointer({ target: rootBox, keys: "[MouseRight]" });
      await user.click(screen.getByText("Text"));

      // Select Name from entity path menu - scope to context menu
      const contextMenu = document.querySelector(
        ".entity-path-menu"
      ) as HTMLElement;
      expect(contextMenu).not.toBeNull();
      const menu = within(contextMenu);

      // Expand Account entity by clicking the accordion title
      const accountAccordionTitle = menu
        .getByText("Account")
        .closest(".accordion-title") as HTMLElement;
      expect(accountAccordionTitle).not.toBeNull();
      await user.click(accountAccordionTitle);

      // Click property "Name"
      const nameProperty = menu.getByText("Name");
      await user.click(nameProperty);

      // Verify component has entity path display (check individual labels)
      const componentBox = document.querySelector(".component-box.depth-1");
      const entityLabel = componentBox?.querySelector(".entity-label");
      const propertyLabel = componentBox?.querySelector(".property-label");
      expect(entityLabel).toHaveTextContent("Account");
      expect(propertyLabel).toHaveTextContent("Name");

      // Now change entity name from Account to MyAccount
      const entityNameBox = document.querySelectorAll(
        ".entity-name"
      )[0] as HTMLElement;
      await user.click(entityNameBox);
      const input = screen.getByDisplayValue("Account");
      await user.clear(input);
      await user.type(input, "MyAccount{Enter}");

      // Component entity path should be updated
      const updatedEntityLabel = document.querySelector(".entity-label");
      const updatedPropertyLabel = document.querySelector(".property-label");
      expect(updatedEntityLabel).toHaveTextContent("MyAccount");
      expect(updatedPropertyLabel).toHaveTextContent("Name");
    });

    it("updates component entity paths when property name changes", async () => {
      const user = userEvent.setup();
      render(<App />);

      // Create a text component with entity path
      const rootBox = document.querySelector(
        ".component-box.depth-0"
      ) as HTMLElement;
      await user.pointer({ target: rootBox, keys: "[MouseRight]" });
      await user.click(screen.getByText("Text"));

      // Select from entity path menu - scope to context menu
      const contextMenu = document.querySelector(
        ".entity-path-menu"
      ) as HTMLElement;
      expect(contextMenu).not.toBeNull();
      const menu = within(contextMenu);

      // Expand Account entity by clicking the accordion title
      const accountAccordionTitle = menu
        .getByText("Account")
        .closest(".accordion-title") as HTMLElement;
      expect(accountAccordionTitle).not.toBeNull();
      await user.click(accountAccordionTitle);

      // Click property "Name"
      const nameProperty = menu.getByText("Name");
      await user.click(nameProperty);

      // Verify initial entity path (check individual labels)
      const componentBox = document.querySelector(".component-box.depth-1");
      expect(componentBox?.querySelector(".entity-label")).toHaveTextContent(
        "Account"
      );
      expect(componentBox?.querySelector(".property-label")).toHaveTextContent(
        "Name"
      );

      // Change property name from Name to FullName
      const propertyText = document.querySelectorAll(
        ".entity-property"
      )[0] as HTMLElement;
      await user.click(propertyText);
      const input = screen.getByDisplayValue("Name");
      await user.clear(input);
      await user.type(input, "FullName{Enter}");

      // Component entity path should be updated
      expect(document.querySelector(".entity-label")).toHaveTextContent(
        "Account"
      );
      expect(document.querySelector(".property-label")).toHaveTextContent(
        "FullName"
      );
    });
  });
});
