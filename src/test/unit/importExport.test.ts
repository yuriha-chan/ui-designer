import { describe, it, expect } from "vitest";
import { UIComponent, Entity, Screen } from "../../types";
import {
  exportDesign,
  exportStoryboard,
  importDesign,
  validateDesignData,
  exportDesignAsLLMText,
  exportStoryboardAsLLMText,
} from "../../importExport";
import {
  simpleTree,
  mediumTree,
  deepTree,
  wideTree,
  mixedTree,
  emptyTree,
  singleComponentTree,
} from "../../../__fixtures__/componentTrees";
import { allEntities, accountEntity } from "../../../__fixtures__/entities";

describe("exportDesign", () => {
  it("exports simple tree with entities", () => {
    const components = simpleTree;
    const entities = allEntities;
    const json = exportDesign(components, entities);

    // Should produce valid JSON
    expect(() => JSON.parse(json)).not.toThrow();

    const parsed = JSON.parse(json);
    // Should have components and entities fields
    expect(parsed).toHaveProperty("components");
    expect(parsed).toHaveProperty("entities");
    // Should have metadata
    expect(parsed).toHaveProperty("version");
    expect(parsed.version).toBe("1.0");

    // Components should match original structure
    expect(parsed.components).toEqual(components);
    // Entities should match
    expect(parsed.entities).toEqual(entities);
  });

  it("exports empty tree and empty entities", () => {
    const components: UIComponent[] = [];
    const entities: Entity[] = [];
    const json = exportDesign(components, entities);
    const parsed = JSON.parse(json);

    expect(parsed.components).toEqual([]);
    expect(parsed.entities).toEqual([]);
  });

  it("exports complex tree preserving all properties", () => {
    const components = mixedTree;
    const entities = allEntities;
    const json = exportDesign(components, entities);
    const parsed = JSON.parse(json);

    // Deep equality check
    expect(parsed.components).toEqual(components);
    expect(parsed.entities).toEqual(entities);
  });
});

describe("importDesign", () => {
  it("imports previously exported design", () => {
    const components = mediumTree;
    const entities = allEntities;
    const json = exportDesign(components, entities);

    const result = importDesign(json);
    expect(result.version).toBe("1.0");
    if (result.version === "1.0") {
      expect(result.components).toEqual(components);
      expect(result.entities).toEqual(entities);
    }
  });

  it("throws error on invalid JSON", () => {
    expect(() => importDesign("invalid json")).toThrow();
  });

  it("throws error on missing required fields", () => {
    const invalidData = { components: [] }; // missing entities
    expect(() => importDesign(JSON.stringify(invalidData))).toThrow();
  });

  it("throws error on malformed components", () => {
    const invalidData = {
      components: [{ id: "1", type: "invalid" }], // missing children
      entities: [],
      version: "1.0",
    };
    expect(() => importDesign(JSON.stringify(invalidData))).toThrow();
  });
});

describe("validateDesignData", () => {
  it("returns true for valid design data", () => {
    const components = simpleTree;
    const entities = allEntities;
    const data = { components, entities, version: "1.0" };
    expect(validateDesignData(data)).toBe(true);
  });

  it("returns false for missing version", () => {
    const components = simpleTree;
    const entities = allEntities;
    const data = { components, entities };
    expect(validateDesignData(data)).toBe(false);
  });

  it("returns false for missing components", () => {
    const data = { entities: [], version: "1.0" };
    expect(validateDesignData(data)).toBe(false);
  });

  it("returns false for missing entities", () => {
    const data = { components: [], version: "1.0" };
    expect(validateDesignData(data)).toBe(false);
  });

  it("returns false for invalid component structure", () => {
    const data = {
      components: [{ id: "1", type: "container" }], // missing children
      entities: [],
      version: "1.0",
    };
    expect(validateDesignData(data)).toBe(false);
  });

  it("returns false for invalid entity structure", () => {
    const data = {
      components: [],
      entities: [{ name: "Account" }], // missing properties
      version: "1.0",
    };
    expect(validateDesignData(data)).toBe(false);
  });

  it("returns true for valid storyboard data", () => {
    const screens: Screen[] = [
      { id: "1", name: "Screen 1", components: simpleTree },
      { id: "2", name: "Screen 2", components: mediumTree },
    ];
    const entities = allEntities;
    const data = { screens, entities, version: "2.0" };
    expect(validateDesignData(data)).toBe(true);
  });

  it("returns false for invalid screen structure", () => {
    const data = {
      screens: [{ id: "1", name: "Screen 1" }], // missing components
      entities: [],
      version: "2.0",
    };
    expect(validateDesignData(data)).toBe(false);
  });
});

describe("round-trip", () => {
  const testCases = [
    { name: "simple tree", components: simpleTree, entities: allEntities },
    { name: "medium tree", components: mediumTree, entities: allEntities },
    { name: "deep tree", components: deepTree, entities: allEntities },
    { name: "wide tree", components: wideTree, entities: allEntities },
    { name: "mixed tree", components: mixedTree, entities: allEntities },
    { name: "empty tree", components: emptyTree, entities: [] },
    {
      name: "single component",
      components: singleComponentTree,
      entities: allEntities,
    },
  ];

  testCases.forEach(({ name, components, entities }) => {
    it(`preserves data for ${name}`, () => {
      const json = exportDesign(components, entities);
      const result = importDesign(json);

      expect(result.version).toBe("1.0");
      if (result.version === "1.0") {
        expect(result.components).toEqual(components);
        expect(result.entities).toEqual(entities);
      }
    });
  });
});

describe("exportStoryboard", () => {
  it("exports screens with entities", () => {
    const screens: Screen[] = [
      { id: "1", name: "Screen 1", components: simpleTree },
      { id: "2", name: "Screen 2", components: mediumTree },
    ];
    const entities = allEntities;
    const json = exportStoryboard(screens, entities);

    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe("2.0");
    expect(parsed.screens).toEqual(screens);
    expect(parsed.entities).toEqual(entities);
  });
});

describe("importDesign storyboard", () => {
  it("imports previously exported storyboard", () => {
    const screens: Screen[] = [
      { id: "1", name: "Screen 1", components: simpleTree },
      { id: "2", name: "Screen 2", components: mediumTree },
    ];
    const entities = allEntities;
    const json = exportStoryboard(screens, entities);

    const result = importDesign(json);
    expect(result.version).toBe("2.0");
    if (result.version === "2.0") {
      expect(result.screens).toEqual(screens);
      expect(result.entities).toEqual(entities);
    }
  });
});

describe("exportDesignAsLLMText", () => {
  it("exports simple tree as markdown", () => {
    const components = simpleTree;
    const entities = allEntities;
    const text = exportDesignAsLLMText(components, entities);

    expect(text).toContain("# UI Design Export");
    expect(text).toContain("## Entities");
    expect(text).toContain("### Account");
    expect(text).toContain("- Name: string");
    expect(text).toContain("## Components");
    expect(text).toContain("container");
    expect(text).toContain("text (Account>Name)");
  });

  it("exports empty tree", () => {
    const components: UIComponent[] = [];
    const entities: Entity[] = [];
    const text = exportDesignAsLLMText(components, entities);

    expect(text).toContain("# UI Design Export");
    expect(text).not.toContain("## Entities");
    expect(text).not.toContain("## Components");
  });

  it("exports button with target screen", () => {
    const components: UIComponent[] = [
      {
        id: "btn1",
        type: "button",
        entityPath: "Account>Submit",
        targetScreen: "screen2",
        children: [],
      },
    ];
    const entities = [accountEntity];
    const text = exportDesignAsLLMText(components, entities);

    expect(text).toContain('button (Account>Submit) → "screen2"');
  });
});

describe("exportStoryboardAsLLMText", () => {
  it("exports screens as markdown", () => {
    const screens: Screen[] = [
      { id: "1", name: "Main", components: simpleTree },
      { id: "2", name: "Settings", components: emptyTree },
    ];
    const entities = allEntities;
    const text = exportStoryboardAsLLMText(screens, entities);

    expect(text).toContain("# UI Design Export");
    expect(text).toContain("## Entities");
    expect(text).toContain("## Screen: Main");
    expect(text).toContain("container");
    expect(text).toContain("## Screen: Settings");
    expect(text).toContain("(empty)");
  });

  it("exports empty storyboard", () => {
    const screens: Screen[] = [];
    const entities: Entity[] = [];
    const text = exportStoryboardAsLLMText(screens, entities);

    expect(text).toContain("# UI Design Export");
    expect(text).not.toContain("## Entities");
    expect(text).not.toContain("## Screen:");
  });
});
