import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { saveToStorage, loadFromStorage } from "../../storage";
import { simpleTree, mediumTree } from "../../../__fixtures__/componentTrees";
import { allEntities } from "../../../__fixtures__/entities";

const originalLocalStorage = global.localStorage;

const mockLocalStorage = {
  data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.data[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.data[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.data[key];
  }),
};

describe("saveToStorage", () => {
  beforeEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
    mockLocalStorage.data = {};
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: originalLocalStorage,
      writable: true,
    });
  });

  it("saves screens, entities, and currentScreenId to localStorage", () => {
    const data = {
      screens: [
        { id: "screen-1", name: "Screen 1", components: simpleTree },
        { id: "screen-2", name: "Screen 2", components: mediumTree },
      ],
      entities: allEntities,
      currentScreenId: "screen-1",
    };

    saveToStorage(data);

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "autosave",
      expect.any(String)
    );
    const savedData = JSON.parse(mockLocalStorage.data["autosave"]);
    expect(savedData.screens).toEqual(data.screens);
    expect(savedData.entities).toEqual(data.entities);
    expect(savedData.currentScreenId).toBe("screen-1");
  });

  it("saves empty arrays", () => {
    const data = {
      screens: [],
      entities: [],
      currentScreenId: "",
    };

    saveToStorage(data);

    const savedData = JSON.parse(mockLocalStorage.data["autosave"]);
    expect(savedData.screens).toEqual([]);
    expect(savedData.entities).toEqual([]);
    expect(savedData.currentScreenId).toBe("");
  });

  it("handles localStorage errors gracefully", () => {
    const errorStorage = {
      setItem: vi.fn(() => {
        throw new Error("Storage full");
      }),
    };
    Object.defineProperty(global, "localStorage", {
      value: errorStorage,
      writable: true,
    });

    const data = {
      screens: [],
      entities: [],
      currentScreenId: "",
    };

    expect(() => saveToStorage(data)).not.toThrow();
  });
});

describe("loadFromStorage", () => {
  beforeEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
    mockLocalStorage.data = {};
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: originalLocalStorage,
      writable: true,
    });
  });

  it("loads saved data from localStorage", () => {
    const savedData = {
      screens: [{ id: "screen-1", name: "Screen 1", components: simpleTree }],
      entities: allEntities,
      currentScreenId: "screen-1",
    };
    mockLocalStorage.data["autosave"] = JSON.stringify(savedData);

    const result = loadFromStorage();

    expect(result).toEqual(savedData);
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith("autosave");
  });

  it("returns null when no data exists", () => {
    const result = loadFromStorage();
    expect(result).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    mockLocalStorage.data["autosave"] = "invalid json {{{";

    const result = loadFromStorage();
    expect(result).toBeNull();
  });

  it("returns null for missing required fields", () => {
    mockLocalStorage.data["autosave"] = JSON.stringify({
      screens: [],
    });

    const result = loadFromStorage();
    expect(result).toBeNull();
  });

  it("returns null for invalid screen structure", () => {
    mockLocalStorage.data["autosave"] = JSON.stringify({
      screens: [{ id: "1" }],
      entities: [],
      currentScreenId: "1",
    });

    const result = loadFromStorage();
    expect(result).toBeNull();
  });

  it("returns null for invalid entity structure", () => {
    mockLocalStorage.data["autosave"] = JSON.stringify({
      screens: [],
      entities: [{ name: "Account" }],
      currentScreenId: "",
    });

    const result = loadFromStorage();
    expect(result).toBeNull();
  });

  it("returns null for entity with string properties (old format)", () => {
    mockLocalStorage.data["autosave"] = JSON.stringify({
      screens: [],
      entities: [{ name: "Account", properties: ["Name", "Email"] }],
      currentScreenId: "",
    });

    const result = loadFromStorage();
    expect(result).toBeNull();
  });

  it("returns data for entity with typed EntityProperty", () => {
    mockLocalStorage.data["autosave"] = JSON.stringify({
      screens: [],
      entities: [
        {
          name: "Account",
          properties: [
            { name: "Name", type: "string" },
            { name: "Balance", type: "number" },
          ],
        },
      ],
      currentScreenId: "",
    });

    const result = loadFromStorage();
    expect(result).not.toBeNull();
    expect(result?.entities).toHaveLength(1);
  });

  it("returns null for entity with type=entity but no entity_type", () => {
    mockLocalStorage.data["autosave"] = JSON.stringify({
      screens: [],
      entities: [
        {
          name: "Order",
          properties: [{ name: "Account", type: "entity" }],
        },
      ],
      currentScreenId: "",
    });

    const result = loadFromStorage();
    expect(result).toBeNull();
  });

  it("returns data for entity with type=entity and entity_type", () => {
    mockLocalStorage.data["autosave"] = JSON.stringify({
      screens: [],
      entities: [
        {
          name: "Order",
          properties: [
            { name: "Account", type: "entity", entity_type: "Account" },
          ],
        },
      ],
      currentScreenId: "",
    });

    const result = loadFromStorage();
    expect(result).not.toBeNull();
  });

  it("handles localStorage errors gracefully", () => {
    const errorStorage = {
      getItem: vi.fn(() => {
        throw new Error("Storage error");
      }),
    };
    Object.defineProperty(global, "localStorage", {
      value: errorStorage,
      writable: true,
    });

    const result = loadFromStorage();
    expect(result).toBeNull();
  });
});
