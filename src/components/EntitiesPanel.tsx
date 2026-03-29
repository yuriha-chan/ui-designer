import React from "react";
import { Box, VStack, HStack, Button } from "@chakra-ui/react";
import { Entity, PropertyType } from "../types";
import { EntityItem } from "./EntityItem";

interface EntitiesPanelProps {
  entities: Entity[];
  editingEntityIndex: number | null;
  editingPropertyIndex: { entityIndex: number; propertyIndex: number } | null;
  setEditingEntityIndex: (index: number | null) => void;
  setEditingPropertyIndex: (
    index: { entityIndex: number; propertyIndex: number } | null
  ) => void;
  addEntity: () => void;
  deleteEntity: (index: number) => void;
  updateEntityName: (index: number, name: string) => void;
  addProperty: (entityIndex: number) => void;
  deleteProperty: (entityIndex: number, propertyIndex: number) => void;
  updatePropertyName: (
    entityIndex: number,
    propertyIndex: number,
    name: string
  ) => void;
  updatePropertyType: (
    entityIndex: number,
    propertyIndex: number,
    type: PropertyType,
    entityType?: string
  ) => void;
}

const EntitiesPanel: React.FC<EntitiesPanelProps> = ({
  entities,
  editingEntityIndex,
  editingPropertyIndex,
  setEditingEntityIndex,
  setEditingPropertyIndex,
  addEntity,
  deleteEntity,
  updateEntityName,
  addProperty,
  deleteProperty,
  updatePropertyName,
  updatePropertyType,
}) => {
  return (
    <Box className="entities-panel">
      <HStack mb={2}>
        <Button size="sm" colorScheme="blue" onClick={addEntity}>
          + Add Entity
        </Button>
      </HStack>
      <VStack className="entities-list" gap={2} align="stretch">
        {entities.map((entity, entityIndex) => (
          <EntityItem
            key={entity.name + entityIndex}
            entity={entity}
            entityIndex={entityIndex}
            isEditing={editingEntityIndex === entityIndex}
            editingPropertyIndex={editingPropertyIndex}
            entities={entities}
            setEditingEntityIndex={setEditingEntityIndex}
            setEditingPropertyIndex={setEditingPropertyIndex}
            updateEntityName={updateEntityName}
            addProperty={addProperty}
            deleteProperty={deleteProperty}
            updatePropertyName={updatePropertyName}
            updatePropertyType={updatePropertyType}
            deleteEntity={deleteEntity}
          />
        ))}
      </VStack>
    </Box>
  );
};

export { EntitiesPanel };
