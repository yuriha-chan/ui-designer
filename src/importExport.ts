import { UIComponent, Entity, Screen } from "./types";
import { designDataSchema } from "./schemas";

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

  const result = designDataSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("Invalid design data");
  }

  return result.data as DesignData;
}

export function validateDesignData(data: unknown): data is DesignData {
  return designDataSchema.safeParse(data).success;
}
