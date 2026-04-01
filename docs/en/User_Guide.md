# UI Designer - User Guide

This tool helps you design application user interfaces through an intuitive drag-and-drop interface. You can define entities (data models), place components on screens, and export your design as text.

## Getting Started

When you first open UI Designer, you'll see:

- A sample **Main Screen** in the designer area
- Sample **entities** (Account, Product, Order, User) in the right panel

```
Main Interface

> **Screenshot Placeholder:** The main interface consists of a header with a toolbar (language selector, export/import buttons), a panel with Entities/Screens tabs, and the main designer area. The header displays the current screen name, which you can click to edit.
```

---

## Understanding the Interface

### Header Toolbar

The top bar provides the following controls:

- **Screen Name**: Click to change the current screen's name
- **Undo/Redo**: Undo or redo changes (Ctrl+Z / Ctrl+Shift+Z)
- **Preview**: Toggle preview mode
- **Language Selector**: Switch between English and Japanese
- **Export Mode**: Choose whether to export the entire storyboard or just the current screen
- **Export Format**: Select JSON or LLM Text format
- **Export Button**: Save and export your design
- **Import Button**: Load a previously exported design

### Side Panel

The right panel has two tabs:

1. **Entities Tab**: Define your data models
2. **Screens Tab**: Manage multiple screens

### Screen Design Area

In the screen design area, you can:

- Add components
- Edit components
- Move components

---

## Working with Entities

The Entities tab in the side panel lets you manage entity definitions.
Entities represent your application's data model. Each entity has a name and a list of properties.

### Adding an Entity

1. Click **"+ Add Entity"** at the bottom of the Entities panel
2. A new entity named "New Entity" is added
3. Click the name to edit it

Hint: You can also click the copy button next to an entity name to duplicate an existing entity.

### Screenshot Placeholder - Entities Panel

> **Screenshot Placeholder:** The Entities panel displays a list of entities on the left. Each entity appears as a card showing its name with properties listed below. A "+ Add Entity" button is shown at the bottom of the list.

### Editing Entities

- **Rename**: Click the entity name to edit it
- **Add Property**: Click "Add Property" below the entity
- **Delete Entity**: Click the trash can icon next to the entity name (a confirmation dialog will appear)

### Property Types

Each property has a type that determines how it is displayed:

| Type     | Description                                                       |
| -------- | ----------------------------------------------------------------- |
| `string` | **Text data**: Names, descriptions, labels, and other text values |
| `number` | **Numeric data**: Integers, decimals, and other numeric values    |
| `entity` | **Entity data**: References to other entities                     |
| `function` | **Function**: Operations like processes, conditions, or logic. Not displayed on screen. |

### Adding a Property

1. Click **"Add Property"** below the entity
2. A new property appears with the name "newProperty" and type "string"
3. Click the property name to rename it
4. Change the type using the dropdown menu

### Screenshot Placeholder - Property Editor

> **Screenshot Placeholder:** When adding a property, a row appears with an editable property name, a type dropdown (string/number/entity/function), and a delete button. For entity types, an additional dropdown appears to select the referenced entity.

---

## Building Screens

### Creating a New Screen

1. Click the **"Screens"** tab in the side panel
2. Enter a name in the input field
3. Click **"Add"**

### Managing Screens

- **Switch Screens**: Click a screen name in the list
- **Copy Screen**: Click the copy icon to duplicate a screen
- **Delete Screen**: Click the trash can icon (the last screen cannot be deleted)

### Screen Navigation

Buttons can navigate between screens. When you add a button component, you can select the destination screen.

```
Image - Screens Panel

> **Screenshot Placeholder:** The Screens panel displays a list of all screens. Each screen shows its name, a copy button (clipboard icon), and a delete button (trash can icon). An input field at the top allows adding new screens.
```

---

## Using Components

### Component Types

| Component | Description                      | Use Case                                    |
| --------- | -------------------------------- | ------------------------------------------- |
| **Container** | Holds other components inside    | Grouping cards, separating sections         |
| **Text**      | Displays string data             | Labels, descriptions                        |
| **Number**    | Displays numeric data            | Prices, counts, dates                       |
| **Button**    | Clickable navigation element     | Actions, screen transitions                 |
| **Input**     | User text input field            | Forms, search fields                        |

### Adding a Component

1. Right-click in the designer area or inside a container
2. A context menu appears
3. Select **"Add Component"**
4. Choose the component type

```
#Add Component Context Menu

> **Screenshot Placeholder:** Right-clicking opens a context menu with options: Container, Text, Number, Button, Input. The menu appears at the cursor position.
```

### Connecting to Entities

To set the entity displayed on a new component:

1. After selecting the component type, the **"Entity Path"** menu appears
2. Select the entity you want to display; a list of its properties appears
3. Click the property you want to display
4. If the selected property is an entity type, a list of that entity's properties appears; continue selecting until you reach the desired property

To change the displayed entity for an existing component, right-click the component to open the "Entity Path" menu. The process is the same.

### Copying and Deleting Components

You can copy or delete a component using the buttons in its top-right corner or by right-clicking it.

- **Copy**: Duplicate the component
- **Delete**: Remove the component

### Setting Button Navigation

For button components, you can set the destination screen:

1. Click the dropdown box inside the button
2. Select the screen the button should navigate to

```
Image - Component Node

> **Screenshot Placeholder:** Each component appears as a box in the designer. Containers show their children nested inside. Text/Number components display their connected entity path. Buttons show the target screen name. Hovering displays a toolbar with copy and delete options.
```

### Moving Components

You can drag and drop components to move them inside other containers. Dragging a container moves all its child components together.

Hint:
When you move a container, the automatic reordering might temporarily make it hard to locate. Take a moment to scan the entire layout afterward.

When dragging, a dotted border appears at the top of the container that will receive the drop. The component will be reordered within that container.

If you drop a component in the wrong place, use the Undo button to revert.

---

## Preview Mode

Preview mode lets you see how your screen will look and behave when actually used.

1. Click **"Preview"** in the header
2. The side panel and header disappear, showing a clean view with only components
3. Buttons become clickable and will navigate between screens
4. Click the **"Exit Preview"** button at the top of the screen to return to design mode

```
Preview Mode

> **Screenshot Placeholder:** Preview mode shows a clean view of the screen components without the designer interface. Containers appear as colored boxes, text shows actual values, and buttons are styled and clickable. A "×" button in the corner allows exiting preview.
```
---

## Undo and Redo

The application remembers your change history.

- **Undo** (Ctrl+Z): Revert the last change
- **Redo** (Ctrl+Shift+Z): Reapply a reverted change
- Up to 50 changes are stored
- Reloading the browser page clears the history

```
Undo/Redo

> **Screenshot Placeholder:** The toolbar displays Undo and Redo buttons with curved arrow icons. The buttons are enabled or disabled based on whether there are changes to undo or redo.
```
---

## Import and Export

### Exporting a Design

1. Select the **Export Mode**:
   - **Storyboard**: Export all screens
   - **Current Screen**: Export only the currently displayed screen

2. Select the **Export Format**:
   - **JSON**: Format for use with this program
   - **LLM Text**: Human-readable format for AI assistants

3. Click **Export** to save the file

### Importing a Design

1. Click **Import**
2. Select a previously exported JSON file
3. The design loads into the editor

When importing a file exported with "Current Screen" mode, only the currently selected screen is replaced. When importing a file exported with "Storyboard" mode, the entire screen list is replaced.

```
Export/Import

> **Screenshot Placeholder:** The toolbar displays dropdown selectors for Export Mode (Current Screen/Storyboard) and Export Format (JSON/LLM Text). The Export button has a download icon, and the Import button has an upload icon.
```
---

## Language Settings

This design tool supports both English and Japanese display.

1. Click the **language dropdown** in the header
2. Select **English** or **日本語**
3. All UI text updates immediately
4. Your preference is saved in the browser

```
### Screenshot Placeholder - Language Selector

> **Screenshot Placeholder:** The dropdown in the toolbar shows the current language (e.g., "English" or "日本語"). Clicking it displays options for English and Japanese.
```
---

## Tips and Techniques

### Keyboard Shortcuts

- **Ctrl+Z**: Undo
- **Ctrl+Shift+Z**: Redo
- **Enter**: Confirm screen name edit
- **Escape**: Cancel screen name edit

### Auto-Save

Your work is automatically saved to the browser's local storage. Your design is restored even if you refresh the page.

### Organizing Components

- Use **Containers** to group related components together
- Containers can be nested inside other containers

---

## Troubleshooting

### My previous work disappeared

- Automatically saved data may be deleted by your browser's automatic cleanup features.
- Unfortunately, this data cannot be restored. We recommend exporting your designs as JSON files regularly.

### Import fails

- Only JSON files exported from this application can be imported.

### Cannot delete the last screen

- At least one screen is required at all times.
- Create a new screen before deleting the last one.
