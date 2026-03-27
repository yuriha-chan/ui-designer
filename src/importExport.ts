import { UIComponent, Entity } from "./types";

export interface DesignData {
  version: string;
  components: UIComponent[];
  entities: Entity[];
}

export function exportDesign(
  components: UIComponent[],
  entities: Entity[]
): string {
  const designData: DesignData = {
    version: "1.0",
    components,
    entities,
  };
  return JSON.stringify(designData);
}

export function importDesign(json: string): {
  components: UIComponent[];
  entities: Entity[];
} {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new Error("Invalid JSON");
  }

  if (!validateDesignData(parsed)) {
    throw new Error("Invalid design data");
  }

  return {
    components: parsed.components,
    entities: parsed.entities,
  };
}

function isValidUIComponent(obj: any): obj is UIComponent {
  if (typeof obj !== "object" || obj === null) return false;
  if (typeof obj.id !== "string") return false;
  if (
    obj.type !== "container" &&
    obj.type !== "text" &&
    obj.type !== "number" &&
    obj.type !== "button"
  )
    return false;
  if (!Array.isArray(obj.children)) return false;
  // recursively validate children
  if (!obj.children.every(isValidUIComponent)) return false;
  // entityPath is optional, but if present must be string
  if (obj.entityPath !== undefined && typeof obj.entityPath !== "string")
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

export function validateDesignData(data: any): data is DesignData {
  if (typeof data !== "object" || data === null) return false;
  if (data.version !== "1.0") return false;
  if (!Array.isArray(data.components)) return false;
  if (!Array.isArray(data.entities)) return false;
  if (!data.components.every(isValidUIComponent)) return false;
  if (!data.entities.every(isValidEntity)) return false;
  return true;
}
