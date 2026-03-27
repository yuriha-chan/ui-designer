import { describe, it, expect } from "vitest";
import { UIComponent, Entity } from "../../types";
import {
  exportDesign,
  importDesign,
  validateDesignData,
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
import { allEntities } from "../../../__fixtures__/entities";

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
    expect(result.components).toEqual(components);
    expect(result.entities).toEqual(entities);
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

      expect(result.components).toEqual(components);
      expect(result.entities).toEqual(entities);
    });
  });
});
