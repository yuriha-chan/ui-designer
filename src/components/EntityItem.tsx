import React, { useCallback, useMemo } from "react";
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
import { useI18n } from "../I18nContext";

const propertyTypeColors: Record<PropertyType, string> = {
  string: "blue.500",
  number: "green.500",
  entity: "orange.500",
  function: "purple.500",
};

const sanitizeName = (name: string): string => {
  return name.trim().replace(/[:>]/g, "-");
};

interface EntityItemProps {
  entity: Entity;
  entityIndex: number;
  isEditing: boolean;
  editingPropertyIndex: { entityIndex: number; propertyIndex: number } | null;
  entities: Entity[];
  setEditingEntityIndex: (index: number | null) => void;
  setEditingPropertyIndex: (
    index: { entityIndex: number; propertyIndex: number } | null
  ) => void;
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
  deleteEntity: (index: number) => void;
}

const EntityItemInner: React.FC<EntityItemProps> = ({
  entity,
  entityIndex,
  isEditing,
  editingPropertyIndex,
  entities,
  setEditingEntityIndex,
  setEditingPropertyIndex,
  updateEntityName,
  addProperty,
  deleteProperty,
  updatePropertyName,
  updatePropertyType,
  deleteEntity,
}) => {
  const { t } = useI18n();
  const propertyTypeCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "string", value: "string" },
          { label: "number", value: "number" },
          { label: "entity", value: "entity" },
          { label: "function", value: "function" },
        ],
      }),
    [t]
  );
  const handleEntityNameBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (e.target.value.trim()) {
        updateEntityName(entityIndex, sanitizeName(e.target.value));
      }
      setEditingEntityIndex(null);
    },
    [entityIndex, updateEntityName, setEditingEntityIndex]
  );

  const handleEntityNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (e.currentTarget.value.trim()) {
          updateEntityName(entityIndex, sanitizeName(e.currentTarget.value));
        }
        setEditingEntityIndex(null);
      } else if (e.key === "Escape") {
        setEditingEntityIndex(null);
      }
    },
    [entityIndex, updateEntityName, setEditingEntityIndex]
  );

  const handlePropertyNameBlur = useCallback(
    (propIndex: number, e: React.FocusEvent<HTMLInputElement>) => {
      if (e.target.value.trim()) {
        updatePropertyName(
          entityIndex,
          propIndex,
          sanitizeName(e.target.value)
        );
      }
      setEditingPropertyIndex(null);
    },
    [entityIndex, updatePropertyName, setEditingPropertyIndex]
  );

  const handlePropertyNameKeyDown = useCallback(
    (propIndex: number, e: React.KeyboardEvent<HTMLInputElement>) => {
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
    },
    [entityIndex, updatePropertyName, setEditingPropertyIndex]
  );

  const handleDeleteEntity = useCallback(() => {
    if (
      window.confirm(t("entity.deleteConfirm").replace("{name}", entity.name))
    ) {
      deleteEntity(entityIndex);
    }
  }, [entityIndex, entity.name, deleteEntity, t]);

  const handleDeleteProperty = useCallback(
    (propIndex: number, propName: string) => {
      if (
        window.confirm(
          t("entity.deletePropertyConfirm").replace("{name}", propName)
        )
      ) {
        deleteProperty(entityIndex, propIndex);
      }
    },
    [entityIndex, deleteProperty, t]
  );

  const handleTypeChange = useCallback(
    (propIndex: number, newType: PropertyType) => {
      const defaultEntityType = entities.find(
        (en) => en.name !== entity.name
      )?.name;
      updatePropertyType(
        entityIndex,
        propIndex,
        newType,
        newType === "entity" ? defaultEntityType : undefined
      );
    },
    [entityIndex, entity.name, entities, updatePropertyType]
  );

  const handleEntityTypeChange = useCallback(
    (propIndex: number, entityType: string) => {
      updatePropertyType(entityIndex, propIndex, "entity", entityType);
    },
    [entityIndex, updatePropertyType]
  );

  return (
    <Box className="entity" borderWidth="1px" borderRadius="md" p={2}>
      <HStack justify="space-between" mb={1}>
        {isEditing ? (
          <Input
            size="sm"
            defaultValue={entity.name}
            onBlur={handleEntityNameBlur}
            onKeyDown={handleEntityNameKeyDown}
            autoFocus
          />
        ) : (
          <Box
            className="entity-name"
            fontWeight="bold"
            cursor="pointer"
            onClick={() => setEditingEntityIndex(entityIndex)}
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
            title={t("entity.addProperty")}
          >
            +
          </Button>
          <Button
            size="xs"
            bg="red.500"
            color="white"
            _hover={{ bg: "red.600" }}
            className="delete-entity-btn"
            onClick={handleDeleteEntity}
            title={t("entity.deleteEntity")}
          >
            ×
          </Button>
        </HStack>
      </HStack>
      <VStack className="entity-properties" gap={1} align="stretch">
        {entity.properties.map((prop, propIndex) => (
          <HStack key={prop.name + propIndex} className="property-row" gap={1}>
            {editingPropertyIndex?.entityIndex === entityIndex &&
            editingPropertyIndex?.propertyIndex === propIndex ? (
              <Input
                size="xs"
                defaultValue={prop.name}
                onBlur={(e) => handlePropertyNameBlur(propIndex, e)}
                onKeyDown={(e) => handlePropertyNameKeyDown(propIndex, e)}
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
                onClick={() =>
                  setEditingPropertyIndex({
                    entityIndex,
                    propertyIndex: propIndex,
                  })
                }
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
                  handleTypeChange(propIndex, details.value[0] as PropertyType);
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
                    handleEntityTypeChange(propIndex, e.target.value);
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
              onClick={() => handleDeleteProperty(propIndex, prop.name)}
              title={t("entity.deleteProperty")}
            >
              ×
            </Button>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
};

const entityItemPropsAreEqual = (
  prev: EntityItemProps,
  next: EntityItemProps
): boolean => {
  return (
    prev.entity === next.entity &&
    prev.entityIndex === next.entityIndex &&
    prev.isEditing === next.isEditing &&
    prev.editingPropertyIndex?.entityIndex ===
      next.editingPropertyIndex?.entityIndex &&
    prev.editingPropertyIndex?.propertyIndex ===
      next.editingPropertyIndex?.propertyIndex &&
    prev.entities === next.entities
  );
};

const EntityItem = React.memo(EntityItemInner, entityItemPropsAreEqual);

export { EntityItem };
