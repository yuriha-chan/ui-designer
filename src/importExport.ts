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

function entityToMarkdown(entity: Entity): string {
  const lines = [`### ${entity.name}`];
  for (const prop of entity.properties) {
    lines.push(`- ${prop.name}: ${prop.type}`);
  }
  return lines.join("\n");
}

function componentToMarkdown(
  components: UIComponent[],
  indent: number,
  entityMap: Map<string, Entity>
): string[] {
  const lines: string[] = [];
  for (const comp of components) {
    const prefix = "  ".repeat(indent);
    if (comp.type === "container") {
      lines.push(`${prefix}container`);
      lines.push(...componentToMarkdown(comp.children, indent + 1, entityMap));
    } else {
      const entityInfo = comp.entityPath ? ` (${comp.entityPath})` : "";
      const targetInfo =
        comp.type === "button" && comp.targetScreen
          ? ` → "${comp.targetScreen}"`
          : "";
      lines.push(`${prefix}${comp.type}${entityInfo}${targetInfo}`);
    }
  }
  return lines;
}

export function exportDesignAsLLMText(
  components: UIComponent[],
  entities: Entity[]
): string {
  const entityMap = new Map<string, Entity>();
  for (const entity of entities) {
    entityMap.set(entity.name, entity);
  }

  const lines: string[] = ["# UI Design Export", ""];

  if (entities.length > 0) {
    lines.push("## Entities", "");
    for (const entity of entities) {
      lines.push(entityToMarkdown(entity), "");
    }
  }

  if (components.length > 0) {
    lines.push("## Components", "");
    lines.push(...componentToMarkdown(components, 0, entityMap));
  }

  return lines.join("\n");
}

export function exportStoryboardAsLLMText(
  screens: Screen[],
  entities: Entity[]
): string {
  const entityMap = new Map<string, Entity>();
  for (const entity of entities) {
    entityMap.set(entity.name, entity);
  }

  const lines: string[] = ["# UI Design Export", ""];

  if (entities.length > 0) {
    lines.push("## Entities", "");
    for (const entity of entities) {
      lines.push(entityToMarkdown(entity), "");
    }
  }

  for (const screen of screens) {
    lines.push(`## Screen: ${screen.name}`, "");
    if (screen.components.length > 0) {
      lines.push(...componentToMarkdown(screen.components, 0, entityMap));
    } else {
      lines.push("(empty)");
    }
    lines.push("");
  }

  return lines.join("\n");
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
