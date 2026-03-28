import { describe, it, expect } from "vitest";
import {
  buildEntityPathMap,
  updateEntityPathsByEntityRename,
  type EntityPathMap,
} from "../../entityPathMap";
import type { Entity, UIComponent } from "../../types";

describe("buildEntityPathMap", () => {
  it("returns empty map for empty entities and components", () => {
    const entities: Entity[] = [];
    const components: UIComponent[] = [];
    const map = buildEntityPathMap(entities, components);
    expect(map.size).toBe(0);
  });

  it("registers single entity path component", () => {
    const entities: Entity[] = [
      { name: "Account", properties: [{ name: "Name", type: "string" }] },
    ];
    const components: UIComponent[] = [
      {
        id: "comp1",
        type: "text",
        entityPath: "Account>Name",
        children: [],
      },
    ];
    const map = buildEntityPathMap(entities, components);
    expect(map.get("Account>Name")).toEqual(new Set(["comp1"]));
  });

  it("registers nested entity path with entity property", () => {
    const entities: Entity[] = [
      {
        name: "Product",
        properties: [
          { name: "Creator", type: "entity", entity_type: "Account" },
        ],
      },
      { name: "Account", properties: [{ name: "Username", type: "string" }] },
    ];
    const components: UIComponent[] = [
      {
        id: "comp1",
        type: "text",
        entityPath: "Product>Creator>Username",
        children: [],
      },
    ];
    const map = buildEntityPathMap(entities, components);
    expect(map.get("Product>Creator")).toEqual(new Set(["comp1"]));
    expect(map.get("Account>Username")).toEqual(new Set(["comp1"]));
  });

  it("registers multiple components for same entity path", () => {
    const entities: Entity[] = [
      { name: "Account", properties: [{ name: "Name", type: "string" }] },
    ];
    const components: UIComponent[] = [
      { id: "comp1", type: "text", entityPath: "Account>Name", children: [] },
      { id: "comp2", type: "number", entityPath: "Account>Name", children: [] },
    ];
    const map = buildEntityPathMap(entities, components);
    expect(map.get("Account>Name")).toEqual(new Set(["comp1", "comp2"]));
  });

  it("ignores components without entityPath", () => {
    const entities: Entity[] = [
      { name: "Account", properties: [{ name: "Name", type: "string" }] },
    ];
    const components: UIComponent[] = [
      { id: "comp1", type: "container", children: [] },
    ];
    const map = buildEntityPathMap(entities, components);
    expect(map.size).toBe(0);
  });

  it("ignores placeholder entity paths", () => {
    const entities: Entity[] = [];
    const components: UIComponent[] = [
      { id: "comp1", type: "button", entityPath: ":OK", children: [] },
      { id: "comp2", type: "text", entityPath: "...", children: [] },
    ];
    const map = buildEntityPathMap(entities, components);
    expect(map.size).toBe(0);
  });

  it("handles deeply nested entity chain", () => {
    const entities: Entity[] = [
      {
        name: "A",
        properties: [{ name: "B", type: "entity", entity_type: "B" }],
      },
      {
        name: "B",
        properties: [{ name: "C", type: "entity", entity_type: "C" }],
      },
      { name: "C", properties: [{ name: "Value", type: "string" }] },
    ];
    const components: UIComponent[] = [
      { id: "comp1", type: "text", entityPath: "A>B>C>Value", children: [] },
    ];
    const map = buildEntityPathMap(entities, components);
    expect(map.get("A>B")).toEqual(new Set(["comp1"]));
    expect(map.get("B>C")).toEqual(new Set(["comp1"]));
    expect(map.get("C>Value")).toEqual(new Set(["comp1"]));
  });

  it("handles container with nested components", () => {
    const entities: Entity[] = [
      { name: "Account", properties: [{ name: "Name", type: "string" }] },
    ];
    const components: UIComponent[] = [
      {
        id: "container1",
        type: "container",
        children: [
          {
            id: "comp1",
            type: "text",
            entityPath: "Account>Name",
            children: [],
          },
        ],
      },
    ];
    const map = buildEntityPathMap(entities, components);
    expect(map.get("Account>Name")).toEqual(new Set(["comp1"]));
  });
});

describe("updateEntityPathsByEntityRename", () => {
  it("returns empty map for empty map input", () => {
    const map: EntityPathMap = new Map();
    const [newMap, affectedIds] = updateEntityPathsByEntityRename(
      map,
      "Account",
      "User"
    );
    expect(newMap.size).toBe(0);
    expect(affectedIds.size).toBe(0);
  });

  it("updates simple entity path", () => {
    const map: EntityPathMap = new Map([["Account>Name", new Set(["comp1"])]]);
    const [newMap, affectedIds] = updateEntityPathsByEntityRename(
      map,
      "Account",
      "User"
    );
    expect(newMap.get("User>Name")).toEqual(new Set(["comp1"]));
    expect(newMap.has("Account>Name")).toBe(false);
    expect(affectedIds).toEqual(new Set(["comp1"]));
  });

  it("updates multiple paths for same renamed entity", () => {
    const map: EntityPathMap = new Map([
      ["Account>Name", new Set(["comp1"])],
      ["Account>Email", new Set(["comp2", "comp3"])],
    ]);
    const [newMap, affectedIds] = updateEntityPathsByEntityRename(
      map,
      "Account",
      "User"
    );
    expect(newMap.get("User>Name")).toEqual(new Set(["comp1"]));
    expect(newMap.get("User>Email")).toEqual(new Set(["comp2", "comp3"]));
    expect(newMap.has("Account>Name")).toBe(false);
    expect(newMap.has("Account>Email")).toBe(false);
    expect(affectedIds).toEqual(new Set(["comp1", "comp2", "comp3"]));
  });

  it("does not affect unrelated entity paths", () => {
    const map: EntityPathMap = new Map([
      ["Account>Name", new Set(["comp1"])],
      ["Product>Title", new Set(["comp2"])],
    ]);
    const [newMap, affectedIds] = updateEntityPathsByEntityRename(
      map,
      "Account",
      "User"
    );
    expect(newMap.get("User>Name")).toEqual(new Set(["comp1"]));
    expect(newMap.get("Product>Title")).toEqual(new Set(["comp2"]));
    expect(affectedIds).toEqual(new Set(["comp1"]));
  });

  it("handles entity without property (just entity name as key)", () => {
    const map: EntityPathMap = new Map([["Account", new Set(["comp1"])]]);
    const [newMap, affectedIds] = updateEntityPathsByEntityRename(
      map,
      "Account",
      "User"
    );
    expect(newMap.get("User")).toEqual(new Set(["comp1"]));
    expect(newMap.has("Account")).toBe(false);
    expect(affectedIds).toEqual(new Set(["comp1"]));
  });

  it("updates all entity paths where entity appears in chain", () => {
    const map: EntityPathMap = new Map([
      ["Product>Creator", new Set(["comp1"])],
      ["Account>Username", new Set(["comp1"])],
    ]);
    const [newMap, affectedIds] = updateEntityPathsByEntityRename(
      map,
      "Account",
      "User"
    );
    expect(newMap.get("Product>Creator")).toEqual(new Set(["comp1"]));
    expect(newMap.get("User>Username")).toEqual(new Set(["comp1"]));
    expect(affectedIds).toEqual(new Set(["comp1"]));
  });
});
