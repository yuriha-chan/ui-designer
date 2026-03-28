import { Screen, Entity } from "./types";
import { autoSaveDataSchema } from "./schemas";

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
    if (!autoSaveDataSchema.safeParse(parsed).success) return null;
    return parsed as AutoSaveData;
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
    return null;
  }
}
