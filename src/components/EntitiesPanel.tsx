import React from "react";
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Select,
  NativeSelect,
} from "@chakra-ui/react";
import { createListCollection } from "@chakra-ui/react";
import { Entity, PropertyType } from "../types";

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

const sanitizeName = (name: string): string => {
  return name.trim().replace(/[:>]/g, "-");
};

const propertyTypeColors: Record<PropertyType, string> = {
  string: "blue.500",
  number: "green.500",
  entity: "orange.500",
  function: "purple.500",
};

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
  const propertyTypeCollection = createListCollection({
    items: [
      { label: "string", value: "string" },
      { label: "number", value: "number" },
      { label: "entity", value: "entity" },
      { label: "function", value: "function" },
    ],
  });

  return (
    <Box className="entities-panel">
      <HStack mb={2}>
        <Button size="sm" colorScheme="blue" onClick={addEntity}>
          + Add Entity
        </Button>
      </HStack>
      <VStack className="entities-list" gap={2} align="stretch">
        {entities.map((entity, entityIndex) => (
          <Box
            key={entity.name + entityIndex}
            className="entity"
            borderWidth="1px"
            borderRadius="md"
            p={2}
          >
            <HStack justify="space-between" mb={1}>
              {editingEntityIndex === entityIndex ? (
                <Input
                  size="sm"
                  defaultValue={entity.name}
                  onBlur={(e) => {
                    if (e.target.value.trim()) {
                      updateEntityName(
                        entityIndex,
                        sanitizeName(e.target.value)
                      );
                    }
                    setEditingEntityIndex(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (e.currentTarget.value.trim()) {
                        updateEntityName(
                          entityIndex,
                          sanitizeName(e.currentTarget.value)
                        );
                      }
                      setEditingEntityIndex(null);
                    } else if (e.key === "Escape") {
                      setEditingEntityIndex(null);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <Box
                  className="entity-name"
                  fontWeight="bold"
                  cursor="pointer"
                  onClick={() => {
                    setEditingEntityIndex(entityIndex);
                  }}
                >
                  {entity.name}
                </Box>
              )}
              <HStack gap={1}>
                <Button
                  size="xs"
                  bg="green.500"
                  color="white"
                  _hover={{ bg: "green.600" }}
                  onClick={() => addProperty(entityIndex)}
                  title="Add property"
                >
                  +
                </Button>
                <Button
                  size="xs"
                  bg="red.500"
                  color="white"
                  _hover={{ bg: "red.600" }}
                  className="delete-entity-btn"
                  onClick={() => {
                    if (window.confirm(`Delete entity "${entity.name}"?`)) {
                      deleteEntity(entityIndex);
                    }
                  }}
                  title="Delete entity"
                >
                  ×
                </Button>
              </HStack>
            </HStack>
            <VStack className="entity-properties" gap={1} align="stretch">
              {entity.properties.map((prop, propIndex) => (
                <HStack
                  key={prop.name + propIndex}
                  className="property-row"
                  gap={1}
                >
                  {editingPropertyIndex?.entityIndex === entityIndex &&
                  editingPropertyIndex?.propertyIndex === propIndex ? (
                    <Input
                      size="xs"
                      defaultValue={prop.name}
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          updatePropertyName(
                            entityIndex,
                            propIndex,
                            sanitizeName(e.target.value)
                          );
                        }
                        setEditingPropertyIndex(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (e.currentTarget.value.trim()) {
                            updatePropertyName(
                              entityIndex,
                              propIndex,
                              sanitizeName(e.currentTarget.value)
                            );
                          }
                          setEditingPropertyIndex(null);
                        } else if (e.key === "Escape") {
                          setEditingPropertyIndex(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <Box
                      className="entity-property"
                      fontSize="sm"
                      cursor="pointer"
                      width="10em"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                      onClick={() => {
                        setEditingPropertyIndex({
                          entityIndex,
                          propertyIndex: propIndex,
                        });
                      }}
                    >
                      {prop.name}
                    </Box>
                  )}
                  <Box
                    as="span"
                    className={`type-select type-${prop.type}`}
                    color={propertyTypeColors[prop.type]}
                  >
                    <Select.Root
                      size="xs"
                      width="70px"
                      collection={propertyTypeCollection}
                      value={[prop.type]}
                      onValueChange={(details) => {
                        const newType = details.value[0] as
                          | "string"
                          | "number"
                          | "entity"
                          | "function";
                        const defaultEntityType = entities.find(
                          (en) => en.name !== entity.name
                        )?.name;
                        updatePropertyType(
                          entityIndex,
                          propIndex,
                          newType,
                          newType === "entity" ? defaultEntityType : undefined
                        );
                      }}
                    >
                      <Select.Trigger className="property-type-badge">
                        <Select.ValueText />
                      </Select.Trigger>
                      <Select.Positioner>
                        <Select.Content>
                          {propertyTypeCollection.items.map((item) => (
                            <Select.Item key={item.value} item={item}>
                              <Select.ItemText>{item.label}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Select.Root>
                  </Box>
                  {prop.type === "entity" ? (
                    <NativeSelect.Root
                      size="xs"
                      width="80px"
                      backgroundColor="gray.600"
                      color="white"
                      className="entity-type-select"
                    >
                      <NativeSelect.Field
                        value={prop.entity_type || ""}
                        onChange={(e) => {
                          updatePropertyType(
                            entityIndex,
                            propIndex,
                            "entity",
                            e.target.value
                          );
                        }}
                      >
                        {entities.map((en) => (
                          <option key={en.name} value={en.name}>
                            {en.name}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  ) : (
                    <Box width="80px" />
                  )}
                  <Button
                    size="2xs"
                    bg="red.500"
                    color="white"
                    _hover={{ bg: "red.600" }}
                    ml={1}
                    className="delete-property-btn"
                    onClick={() => {
                      if (window.confirm(`Delete property "${prop.name}"?`)) {
                        deleteProperty(entityIndex, propIndex);
                      }
                    }}
                    title="Delete property"
                  >
                    ×
                  </Button>
                </HStack>
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export { EntitiesPanel };
