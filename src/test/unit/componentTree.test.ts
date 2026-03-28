import { describe, it, expect } from "vitest";
import {
  getColorForComponent,
  generateSExpression,
  sortComponentsBySExpression,
  parseEntityPath,
  isDescendant,
  findAndRemove,
  findComponent,
  deepCopy,
  insert,
  move,
  createComponent,
  copy,
  remove,
  update,
} from "../../componentTree";
import type { UIComponent } from "../../types";

describe("getColorForComponent", () => {
  it("returns gray scale for container based on depth", () => {
    expect(getColorForComponent("container", 0)).toBe("hsl(0, 0%, 80%)");
    expect(getColorForComponent("container", 1)).toBe("hsl(0, 0%, 65%)");
    expect(getColorForComponent("container", 2)).toBe("hsl(0, 0%, 50%)");
    expect(getColorForComponent("container", 5)).toBe("hsl(0, 0%, 20%)"); // min lightness 20
  });

  it("returns blue for text", () => {
    expect(getColorForComponent("text", 0)).toBe("#3b82f6");
    expect(getColorForComponent("text", 5)).toBe("#3b82f6"); // depth ignored
  });

  it("returns green for number", () => {
    expect(getColorForComponent("number", 0)).toBe("#10b981");
  });

  it("returns red for button", () => {
    expect(getColorForComponent("button", 0)).toBe("#ef4444");
  });

  it("returns gray for unknown type", () => {
    expect(getColorForComponent("unknown", 0)).toBe("#6b7280");
  });
});

describe("parseEntityPath", () => {
  it("parses entity>property format", () => {
    expect(parseEntityPath("Account>Name")).toEqual({
      entity: "Account",
      property: "Name",
      pathParts: ["Account", "Name"],
    });
    expect(parseEntityPath("Product>Price")).toEqual({
      entity: "Product",
      property: "Price",
      pathParts: ["Product", "Price"],
    });
  });

  it("handles undefined or ... as empty", () => {
    expect(parseEntityPath(undefined)).toEqual({
      entity: "...",
      property: "",
      pathParts: [],
    });
    expect(parseEntityPath("...")).toEqual({
      entity: "...",
      property: "",
      pathParts: [],
    });
  });

  it("handles prefixed placeholders (:OK, :Cancel, :Select, :Delete, :New, :...)", () => {
    expect(parseEntityPath(":OK")).toEqual({
      entity: "OK",
      property: "",
      pathParts: [],
    });
    expect(parseEntityPath(":Cancel")).toEqual({
      entity: "Cancel",
      property: "",
      pathParts: [],
    });
    expect(parseEntityPath(":Select")).toEqual({
      entity: "Select",
      property: "",
      pathParts: [],
    });
    expect(parseEntityPath(":Delete")).toEqual({
      entity: "Delete",
      property: "",
      pathParts: [],
    });
    expect(parseEntityPath(":New")).toEqual({
      entity: "New",
      property: "",
      pathParts: [],
    });
    expect(parseEntityPath(":...")).toEqual({
      entity: "...",
      property: "",
      pathParts: [],
    });
  });

  it("returns original string as entity for malformed paths", () => {
    expect(parseEntityPath("Account")).toEqual({
      entity: "Account",
      property: "",
      pathParts: ["Account"],
    });
    // Double > contains empty parts, treated as malformed
    expect(parseEntityPath("Account>>Name")).toEqual({
      entity: "Account>>Name",
      property: "",
      pathParts: ["Account>>Name"],
    });
  });

  it("parses nested entity>entity>property format", () => {
    expect(parseEntityPath("Product>Creator>Username")).toEqual({
      entity: "Product > Creator",
      property: "Username",
      pathParts: ["Product", "Creator", "Username"],
    });
  });
});

describe("generateSExpression", () => {
  it("generates S-expression for leaf component", () => {
    const leaf: UIComponent = {
      id: "1",
      type: "text",
      entityPath: "Account>Name",
      children: [],
    };
    expect(generateSExpression(leaf)).toBe("(text Account>Name)");
  });

  it("generates S-expression for leaf with undefined entityPath", () => {
    const leaf: UIComponent = {
      id: "1",
      type: "text",
      children: [],
    };
    expect(generateSExpression(leaf)).toBe("(text ...)");
  });

  it("generates S-expression for container with sorted children", () => {
    const child1: UIComponent = {
      id: "2",
      type: "text",
      entityPath: "Account>Email",
      children: [],
    };
    const child2: UIComponent = {
      id: "3",
      type: "button",
      entityPath: "Account>Submit",
      children: [],
    };
    const container: UIComponent = {
      id: "1",
      type: "container",
      children: [child2, child1], // unsorted
    };
    // Children should be sorted lexicographically: button < text
    expect(generateSExpression(container)).toBe(
      "(container ... (button Account>Submit) (text Account>Email))"
    );
  });

  it("sorts nested containers recursively", () => {
    const innerChild: UIComponent = {
      id: "3",
      type: "number",
      entityPath: "Product>Price",
      children: [],
    };
    const innerContainer: UIComponent = {
      id: "2",
      type: "container",
      children: [innerChild],
    };
    const root: UIComponent = {
      id: "1",
      type: "container",
      children: [innerContainer],
    };
    expect(generateSExpression(root)).toBe(
      "(container ... (container ... (number Product>Price)))"
    );
  });
});

describe("sortComponentsBySExpression", () => {
  it("sorts components by S-expression", () => {
    const comp1: UIComponent = {
      id: "1",
      type: "button",
      entityPath: "Account>Submit",
      children: [],
    };
    const comp2: UIComponent = {
      id: "2",
      type: "text",
      entityPath: "Account>Name",
      children: [],
    };
    const comp3: UIComponent = {
      id: "3",
      type: "text",
      entityPath: "Account>Email",
      children: [],
    };
    const unsorted = [comp3, comp1, comp2];
    const sorted = sortComponentsBySExpression(unsorted);
    // Order: button (Submit), text (Email), text (Name)
    expect(sorted.map((c) => c.id)).toEqual(["1", "3", "2"]);
  });

  it("sorts empty array", () => {
    expect(sortComponentsBySExpression([])).toEqual([]);
  });
});

describe("isDescendant", () => {
  const tree: UIComponent[] = [
    {
      id: "root",
      type: "container",
      children: [
        {
          id: "child1",
          type: "container",
          children: [{ id: "grandchild", type: "text", children: [] }],
        },
        { id: "child2", type: "text", children: [] },
      ],
    },
  ];

  it("returns true for direct child", () => {
    expect(isDescendant(tree, "root", "child1")).toBe(true);
    expect(isDescendant(tree, "root", "child2")).toBe(true);
  });

  it("returns true for grandchild", () => {
    expect(isDescendant(tree, "root", "grandchild")).toBe(true);
    expect(isDescendant(tree, "child1", "grandchild")).toBe(true);
  });

  it("returns false for non-descendant", () => {
    expect(isDescendant(tree, "child1", "child2")).toBe(false);
    expect(isDescendant(tree, "child2", "grandchild")).toBe(false);
  });

  it("returns false for same node", () => {
    expect(isDescendant(tree, "root", "root")).toBe(false);
  });

  it("returns false for non-existent nodes", () => {
    expect(isDescendant(tree, "nonexistent", "child1")).toBe(false);
    expect(isDescendant(tree, "root", "nonexistent")).toBe(false);
  });
});

describe("findAndRemove", () => {
  const tree: UIComponent[] = [
    {
      id: "a",
      type: "container",
      children: [
        { id: "b", type: "text", children: [] },
        {
          id: "c",
          type: "container",
          children: [{ id: "d", type: "text", children: [] }],
        },
      ],
    },
  ];

  it("removes leaf node", () => {
    const result = findAndRemove(tree, "b");
    expect(result.node?.id).toBe("b");
    expect(result.newComps).toEqual([
      {
        id: "a",
        type: "container",
        children: [
          {
            id: "c",
            type: "container",
            children: [{ id: "d", type: "text", children: [] }],
          },
        ],
      },
    ]);
  });

  it("removes container node", () => {
    const result = findAndRemove(tree, "c");
    expect(result.node?.id).toBe("c");
    expect(result.newComps).toEqual([
      {
        id: "a",
        type: "container",
        children: [{ id: "b", type: "text", children: [] }],
      },
    ]);
  });

  it("returns null node if not found", () => {
    const result = findAndRemove(tree, "nonexistent");
    expect(result.node).toBeNull();
    expect(result.newComps).toEqual(tree);
  });

  it("handles empty tree", () => {
    const result = findAndRemove([], "x");
    expect(result.node).toBeNull();
    expect(result.newComps).toEqual([]);
  });
});

describe("findComponent", () => {
  const tree: UIComponent[] = [
    {
      id: "a",
      type: "container",
      children: [
        { id: "b", type: "text", children: [] },
        {
          id: "c",
          type: "container",
          children: [{ id: "d", type: "text", children: [] }],
        },
      ],
    },
  ];

  it("finds root node", () => {
    expect(findComponent(tree, "a")?.id).toBe("a");
  });

  it("finds leaf node", () => {
    expect(findComponent(tree, "b")?.id).toBe("b");
    expect(findComponent(tree, "d")?.id).toBe("d");
  });

  it("returns null for non-existent node", () => {
    expect(findComponent(tree, "nonexistent")).toBeNull();
  });

  it("handles empty tree", () => {
    expect(findComponent([], "x")).toBeNull();
  });
});

describe("deepCopy", () => {
  it("creates deep copy with new IDs", () => {
    const original: UIComponent = {
      id: "orig",
      type: "container",
      children: [
        { id: "child", type: "text", entityPath: "Account>Name", children: [] },
      ],
    };

    const copied = deepCopy(original);
    expect(copied.id).not.toBe("orig");
    expect(copied.type).toBe("container");
    expect(copied.children).toHaveLength(1);
    expect(copied.children[0].id).not.toBe("child");
    expect(copied.children[0].type).toBe("text");
    expect(copied.children[0].entityPath).toBe("Account>Name");
  });

  it("generates unique IDs for each copy", () => {
    const original: UIComponent = {
      id: "x",
      type: "container",
      children: [{ id: "y", type: "text", children: [] }],
    };

    const copy1 = deepCopy(original);
    const copy2 = deepCopy(original);
    expect(copy1.id).not.toBe(copy2.id);
    expect(copy1.children[0].id).not.toBe(copy2.children[0].id);
  });
});

describe("insert", () => {
  it("inserts node into root container", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [],
      },
    ];
    const newNode: UIComponent = {
      id: "new",
      type: "text",
      entityPath: "Account>Name",
      children: [],
    };
    const result = insert(tree, "root", newNode);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("root");
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].id).toBe("new");
  });

  it("inserts node into nested container", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [
          {
            id: "child",
            type: "container",
            children: [],
          },
        ],
      },
    ];
    const newNode: UIComponent = {
      id: "new",
      type: "text",
      children: [],
    };
    const result = insert(tree, "child", newNode);
    const root = result[0];
    expect(root.children[0].id).toBe("child");
    expect(root.children[0].children).toHaveLength(1);
    expect(root.children[0].children[0].id).toBe("new");
  });

  it("returns unchanged tree if target not found", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [],
      },
    ];
    const newNode: UIComponent = {
      id: "new",
      type: "text",
      children: [],
    };
    const result = insert(tree, "nonexistent", newNode);
    expect(result).toEqual(tree);
  });

  it("inserts multiple nodes into same target", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [],
      },
    ];
    const node1: UIComponent = { id: "node1", type: "text", children: [] };
    const node2: UIComponent = { id: "node2", type: "button", children: [] };

    let result = insert(tree, "root", node1);
    result = insert(result, "root", node2);

    expect(result[0].children).toHaveLength(2);
    // Order doesn't matter - both should be present
    expect(result[0].children.map((c) => c.id)).toContain("node1");
    expect(result[0].children.map((c) => c.id)).toContain("node2");
  });

  it("preserves existing children when inserting", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [{ id: "existing", type: "text", children: [] }],
      },
    ];
    const newNode: UIComponent = {
      id: "new",
      type: "button",
      children: [],
    };
    const result = insert(tree, "root", newNode);
    expect(result[0].children).toHaveLength(2);
    // Order doesn't matter - both should be present
    expect(result[0].children.map((c) => c.id)).toContain("existing");
    expect(result[0].children.map((c) => c.id)).toContain("new");
  });
});

describe("move", () => {
  it("moves leaf component to different container", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [
          {
            id: "container1",
            type: "container",
            children: [{ id: "leaf", type: "text", children: [] }],
          },
          {
            id: "container2",
            type: "container",
            children: [],
          },
        ],
      },
    ];
    const result = move(tree, "leaf", "container2");
    const root = result[0];
    expect(root.children[0].id).toBe("container1");
    expect(root.children[0].children).toHaveLength(0);
    expect(root.children[1].id).toBe("container2");
    expect(root.children[1].children).toHaveLength(1);
    expect(root.children[1].children[0].id).toBe("leaf");
  });

  it("moves container with children", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [
          {
            id: "container1",
            type: "container",
            children: [{ id: "child", type: "text", children: [] }],
          },
          {
            id: "container2",
            type: "container",
            children: [],
          },
        ],
      },
    ];
    const result = move(tree, "container1", "container2");
    const root = result[0];
    expect(root.children).toHaveLength(1);
    expect(root.children[0].id).toBe("container2");
    expect(root.children[0].children).toHaveLength(1);
    expect(root.children[0].children[0].id).toBe("container1");
    expect(root.children[0].children[0].children[0].id).toBe("child");
  });

  it("returns unchanged tree if node not found", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [],
      },
    ];
    const result = move(tree, "nonexistent", "root");
    expect(result).toEqual(tree);
  });

  it("returns tree with node removed if target not found", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [{ id: "leaf", type: "text", children: [] }],
      },
    ];
    const result = move(tree, "leaf", "nonexistent");
    expect(result[0].children).toHaveLength(0);
  });

  it("can move node within same container (order doesn't matter)", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [
          { id: "leaf1", type: "text", children: [] },
          { id: "leaf2", type: "button", children: [] },
        ],
      },
    ];
    // Moving leaf1 to root (already in root) - removes and reinserts
    const result = move(tree, "leaf1", "root");
    expect(result[0].children).toHaveLength(2);
    // Order doesn't matter - both should be present
    expect(result[0].children.map((c) => c.id)).toContain("leaf1");
    expect(result[0].children.map((c) => c.id)).toContain("leaf2");
  });
});

describe("createComponent", () => {
  it("creates component with type and entityPath", () => {
    const component = createComponent("text", "Account>Name");
    expect(component.type).toBe("text");
    expect(component.entityPath).toBe("Account>Name");
    expect(component.children).toEqual([]);
    expect(component.id).toBeDefined();
    expect(typeof component.id).toBe("string");
  });

  it("creates component without entityPath", () => {
    const component = createComponent("button");
    expect(component.type).toBe("button");
    expect(component.entityPath).toBeUndefined();
    expect(component.children).toEqual([]);
    expect(component.id).toBeDefined();
  });

  it("generates unique IDs for each component", () => {
    const comp1 = createComponent("text", "Account>Name");
    const comp2 = createComponent("text", "Account>Name");
    expect(comp1.id).not.toBe(comp2.id);
    expect(comp1.type).toBe(comp2.type);
    expect(comp1.entityPath).toBe(comp2.entityPath);
  });

  it("creates container component", () => {
    const component = createComponent("container");
    expect(component.type).toBe("container");
    expect(component.children).toEqual([]);
  });
});

describe("copy", () => {
  it("copies leaf component to target container", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [
          {
            id: "leaf",
            type: "text",
            entityPath: "Account>Name",
            children: [],
          },
          { id: "target", type: "container", children: [] },
        ],
      },
    ];
    const result = copy(tree, "leaf", "target");
    const root = result[0];
    expect(root.children).toHaveLength(2);
    const target = root.children.find((c) => c.id === "target");
    expect(target).toBeDefined();
    expect(target!.children).toHaveLength(1);
    const copied = target!.children[0];
    expect(copied.type).toBe("text");
    expect(copied.entityPath).toBe("Account>Name");
    expect(copied.id).not.toBe("leaf");
  });

  it("copies container with children", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [
          {
            id: "source",
            type: "container",
            children: [
              {
                id: "child",
                type: "button",
                entityPath: "Account>Submit",
                children: [],
              },
            ],
          },
          { id: "target", type: "container", children: [] },
        ],
      },
    ];
    const result = copy(tree, "source", "target");
    const root = result[0];
    const target = root.children.find((c) => c.id === "target");
    expect(target!.children).toHaveLength(1);
    const copied = target!.children[0];
    expect(copied.type).toBe("container");
    expect(copied.children).toHaveLength(1);
    expect(copied.children[0].type).toBe("button");
    expect(copied.children[0].entityPath).toBe("Account>Submit");
    expect(copied.children[0].id).not.toBe("child");
  });

  it("returns unchanged tree if source not found", () => {
    const tree: UIComponent[] = [
      { id: "root", type: "container", children: [] },
    ];
    const result = copy(tree, "nonexistent", "root");
    expect(result).toEqual(tree);
  });

  it("returns tree with copy not inserted if target not found", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [{ id: "leaf", type: "text", children: [] }],
      },
    ];
    const result = copy(tree, "leaf", "nonexistent");
    // leaf should still be present, no copy inserted
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].id).toBe("leaf");
  });
});

describe("remove", () => {
  it("removes leaf component", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [
          { id: "leaf", type: "text", children: [] },
          { id: "other", type: "button", children: [] },
        ],
      },
    ];
    const result = remove(tree, "leaf");
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].id).toBe("other");
  });

  it("removes container with children", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [
          {
            id: "container",
            type: "container",
            children: [{ id: "child", type: "text", children: [] }],
          },
          { id: "other", type: "button", children: [] },
        ],
      },
    ];
    const result = remove(tree, "container");
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].id).toBe("other");
    // child should also be gone
    const found = findComponent(result, "child");
    expect(found).toBeNull();
  });

  it("returns unchanged tree if node not found", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [{ id: "leaf", type: "text", children: [] }],
      },
    ];
    const result = remove(tree, "nonexistent");
    expect(result).toEqual(tree);
  });

  it("handles empty tree", () => {
    const result = remove([], "any");
    expect(result).toEqual([]);
  });
});

describe("update", () => {
  it("updates entityPath of leaf component", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [
          {
            id: "leaf",
            type: "text",
            entityPath: "Account>Name",
            children: [],
          },
        ],
      },
    ];
    const result = update(tree, "leaf", { entityPath: "Product>Title" });
    const updated = findComponent(result, "leaf");
    expect(updated).not.toBeNull();
    expect(updated!.entityPath).toBe("Product>Title");
    expect(updated!.type).toBe("text");
    expect(updated!.children).toEqual([]);
  });

  it("updates entityPath from undefined to defined", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [{ id: "leaf", type: "text", children: [] }],
      },
    ];
    const result = update(tree, "leaf", { entityPath: "Account>Name" });
    const updated = findComponent(result, "leaf");
    expect(updated!.entityPath).toBe("Account>Name");
  });

  it("updates entityPath to undefined", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [
          {
            id: "leaf",
            type: "text",
            entityPath: "Account>Name",
            children: [],
          },
        ],
      },
    ];
    const result = update(tree, "leaf", { entityPath: undefined });
    const updated = findComponent(result, "leaf");
    expect(updated!.entityPath).toBeUndefined();
  });

  it("does not change id or children", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [
          {
            id: "container",
            type: "container",
            children: [{ id: "child", type: "text", children: [] }],
          },
        ],
      },
    ];
    const result = update(tree, "container", { entityPath: "New>Path" });
    const updated = findComponent(result, "container");
    expect(updated!.id).toBe("container");
    expect(updated!.children).toHaveLength(1);
    expect(updated!.children[0].id).toBe("child");
  });

  it("returns unchanged tree if node not found", () => {
    const tree: UIComponent[] = [
      {
        id: "root",
        type: "container",
        children: [{ id: "leaf", type: "text", children: [] }],
      },
    ];
    const result = update(tree, "nonexistent", { entityPath: "Anything" });
    expect(result).toEqual(tree);
  });
});
