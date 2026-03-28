import { z } from "zod";
import type { PropertyType, ComponentType } from "./types";

export const propertyTypeSchema: z.ZodType<PropertyType> = z.enum([
  "string",
  "number",
  "entity",
  "function",
]);

export const componentTypeSchema: z.ZodType<ComponentType> = z.enum([
  "container",
  "text",
  "number",
  "button",
  "input",
]);

export const entityPropertySchema = z
  .object({
    name: z.string(),
    type: propertyTypeSchema,
    entity_type: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "entity") {
        return typeof data.entity_type === "string";
      }
      return true;
    },
    {
      message: "entity_type is required when type is 'entity'",
    }
  );

export const entitySchema = z.object({
  name: z.string(),
  properties: z.array(entityPropertySchema),
});

export const uiComponentSchema: z.ZodSchema = z.lazy(() =>
  z.object({
    id: z.string(),
    type: componentTypeSchema,
    entityPath: z.string().optional(),
    targetScreen: z.string().optional(),
    children: z.array(uiComponentSchema),
  })
);

export const screenSchema = z.object({
  id: z.string(),
  name: z.string(),
  components: z.array(uiComponentSchema),
});

export const componentsDesignDataSchema = z.object({
  version: z.literal("1.0"),
  components: z.array(uiComponentSchema),
  entities: z.array(entitySchema),
});

export const storyboardDesignDataSchema = z.object({
  version: z.literal("2.0"),
  screens: z.array(screenSchema),
  entities: z.array(entitySchema),
});

export const designDataSchema = z.discriminatedUnion("version", [
  componentsDesignDataSchema,
  storyboardDesignDataSchema,
]);

export const autoSaveDataSchema = z.object({
  screens: z.array(screenSchema),
  entities: z.array(entitySchema),
  currentScreenId: z.string(),
});
