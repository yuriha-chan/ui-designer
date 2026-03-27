import { UIComponent, Entity, Screen } from "./types";

export interface ComponentsDesignData {
  version: "1.0";
  components: UIComponent[];
  entities: Entity[];
}

export interface StoryboardDesignData {
  version: "2.0";
  screens: Screen[];
  entities: Entity[];
}

export type DesignData = ComponentsDesignData | StoryboardDesignData;

export function exportDesign(
  components: UIComponent[],
  entities: Entity[]
): string {
  const designData: ComponentsDesignData = {
    version: "1.0",
    components,
    entities,
  };
  return JSON.stringify(designData);
}

export function exportStoryboard(
  screens: Screen[],
  entities: Entity[]
): string {
  const designData: StoryboardDesignData = {
    version: "2.0",
    screens,
    entities,
  };
  return JSON.stringify(designData);
}

export function importDesign(json: string): DesignData {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new Error("Invalid JSON");
  }

  if (!validateDesignData(parsed)) {
    throw new Error("Invalid design data");
  }

  return parsed;
}

function isValidUIComponent(obj: any): obj is UIComponent {
  if (typeof obj !== "object" || obj === null) return false;
  if (typeof obj.id !== "string") return false;
  if (
    obj.type !== "container" &&
    obj.type !== "text" &&
    obj.type !== "number" &&
    obj.type !== "button" &&
    obj.type !== "input"
  )
    return false;
  if (!Array.isArray(obj.children)) return false;
  // recursively validate children
  if (!obj.children.every(isValidUIComponent)) return false;
  // entityPath is optional, but if present must be string
  if (obj.entityPath !== undefined && typeof obj.entityPath !== "string")
    return false;
  // targetScreen is optional, but if present must be string
  if (obj.targetScreen !== undefined && typeof obj.targetScreen !== "string")
    return false;
  return true;
}

function isValidEntity(obj: any): obj is Entity {
  if (typeof obj !== "object" || obj === null) return false;
  if (typeof obj.name !== "string") return false;
  if (!Array.isArray(obj.properties)) return false;
  if (!obj.properties.every((p: any) => typeof p === "string")) return false;
  return true;
}

function isValidScreen(obj: any): obj is Screen {
  if (typeof obj !== "object" || obj === null) return false;
  if (typeof obj.id !== "string") return false;
  if (typeof obj.name !== "string") return false;
  if (!Array.isArray(obj.components)) return false;
  if (!obj.components.every(isValidUIComponent)) return false;
  return true;
}

export function validateDesignData(data: any): data is DesignData {
  if (typeof data !== "object" || data === null) return false;
  if (data.version !== "1.0" && data.version !== "2.0") return false;
  if (!Array.isArray(data.entities)) return false;
  if (!data.entities.every(isValidEntity)) return false;

  if (data.version === "1.0") {
    if (!Array.isArray(data.components)) return false;
    if (!data.components.every(isValidUIComponent)) return false;
    return true;
  } else {
    // version "2.0"
    if (!Array.isArray(data.screens)) return false;
    if (!data.screens.every(isValidScreen)) return false;
    return true;
  }
}
