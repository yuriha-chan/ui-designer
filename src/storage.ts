import { Screen, Entity } from "./types";

const STORAGE_KEY = "autosave";

export interface AutoSaveData {
  screens: Screen[];
  entities: Entity[];
  currentScreenId: string;
}

export function saveToStorage(data: AutoSaveData): void {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && existing === JSON.stringify(data)) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
}

export function loadFromStorage(): AutoSaveData | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (!validateAutoSaveData(parsed)) return null;
    return parsed;
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
    return null;
  }
}

function isValidEntity(obj: unknown): obj is Entity {
  if (typeof obj !== "object" || obj === null) return false;
  const entity = obj as Record<string, unknown>;
  if (typeof entity.name !== "string") return false;
  if (!Array.isArray(entity.properties)) return false;
  if (!entity.properties.every(isValidEntityProperty)) return false;
  return true;
}

function isValidEntityProperty(
  p: unknown
): p is { name: string; type: string; entity_type?: string } {
  if (typeof p !== "object" || p === null) return false;
  const prop = p as Record<string, unknown>;
  if (typeof prop.name !== "string") return false;
  if (typeof prop.type !== "string") return false;
  if (!["string", "number", "entity"].includes(prop.type)) return false;
  if (prop.type === "entity") {
    if (typeof prop.entity_type !== "string") return false;
  }
  return true;
}

function isValidUIComponent(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null) return false;
  const comp = obj as Record<string, unknown>;
  if (typeof comp.id !== "string") return false;
  if (
    comp.type !== "container" &&
    comp.type !== "text" &&
    comp.type !== "number" &&
    comp.type !== "button" &&
    comp.type !== "input"
  )
    return false;
  if (!Array.isArray(comp.children)) return false;
  if (!comp.children.every(isValidUIComponent)) return false;
  if (comp.entityPath !== undefined && typeof comp.entityPath !== "string")
    return false;
  if (comp.targetScreen !== undefined && typeof comp.targetScreen !== "string")
    return false;
  return true;
}

function isValidScreen(obj: unknown): obj is Screen {
  if (typeof obj !== "object" || obj === null) return false;
  const screen = obj as Record<string, unknown>;
  if (typeof screen.id !== "string") return false;
  if (typeof screen.name !== "string") return false;
  if (!Array.isArray(screen.components)) return false;
  return screen.components.every(isValidUIComponent);
}

function validateAutoSaveData(data: unknown): data is AutoSaveData {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.screens)) return false;
  if (!obj.screens.every(isValidScreen)) return false;
  if (!Array.isArray(obj.entities)) return false;
  if (!obj.entities.every(isValidEntity)) return false;
  if (typeof obj.currentScreenId !== "string") return false;
  return true;
}
