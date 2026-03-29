import type { Entity, UIComponent } from "./types";

export type EntityPathMap = Map<string, Set<string>>;

export function buildEntityPathMap(
  entities: Entity[],
  components: UIComponent[]
): EntityPathMap {
  const map: EntityPathMap = new Map();
  const entityMap = new Map(entities.map((e) => [e.name, e]));

  const registerPath = (entityPath: string, componentId: string) => {
    const parts = entityPath.split(">");
    if (parts.length < 2) return;

    let currentEntityName = parts[0];
    let currentEntity = entityMap.get(currentEntityName);
    if (!currentEntity) return;

    for (let i = 1; i < parts.length; i++) {
      const propertyName = parts[i];
      const key = `${currentEntityName}>${propertyName}`;

      if (!map.has(key)) {
        map.set(key, new Set());
      }
      map.get(key)!.add(componentId);

      const property = currentEntity.properties.find(
        (p) => p.name === propertyName
      );
      if (property?.type === "entity" && property.entity_type) {
        currentEntityName = property.entity_type;
        currentEntity = entityMap.get(currentEntityName);
        if (!currentEntity) break;
      } else {
        break;
      }
    }
  };

  const processComponent = (component: UIComponent) => {
    if (component.entityPath && !component.entityPath.startsWith(":")) {
      registerPath(component.entityPath, component.id);
    }
    component.children.forEach(processComponent);
  };

  components.forEach(processComponent);
  return map;
}

export function updateEntityPathsByEntityRename(
  map: EntityPathMap,
  oldEntityName: string,
  newEntityName: string
): [EntityPathMap, Set<string>] {
  const newMap: EntityPathMap = new Map();
  const affectedIds: Set<string> = new Set();

  for (const [key, componentIds] of map) {
    if (key === oldEntityName || key.startsWith(`${oldEntityName}>`)) {
      const newKey = key.replace(
        new RegExp(`^${oldEntityName}(>|$)`),
        `${newEntityName}$1`
      );
      newMap.set(newKey, componentIds);
      componentIds.forEach((id) => affectedIds.add(id));
    } else {
      newMap.set(key, componentIds);
    }
  }

  return [newMap, affectedIds];
}
