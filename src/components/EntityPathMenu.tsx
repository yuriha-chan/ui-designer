import React, { useState } from "react";
import {
  Box,
  VStack,
  Accordion,
  Text,
  Flex,
  CloseButton,
} from "@chakra-ui/react";
import { Entity, EntityProperty } from "../types";
import { useI18n } from "../I18nContext";

interface EntityPathMenuProps {
  entities: Entity[];
  onSelect: (entityPath: string) => void;
  onClose: () => void;
  x: number;
  y: number;
  componentType?: "text" | "number" | "button" | "input";
}

const EntityPathMenu: React.FC<EntityPathMenuProps> = ({
  entities,
  onSelect,
  onClose,
  x,
  y,
  componentType,
}) => {
  const { t } = useI18n();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const MENU_MAX_HEIGHT = 400;
  const isNearBottom = y + MENU_MAX_HEIGHT > window.innerHeight;
  const menuTop = isNearBottom ? undefined : y;
  const menuBottom = isNearBottom ? 0 : undefined;

  const findEntity = (name: string) => entities.find((e) => e.name === name);

  const placeholderOptions =
    componentType === "button" || componentType === undefined
      ? [
          t("placeholder.ok"),
          t("placeholder.cancel"),
          t("placeholder.select"),
          t("placeholder.delete"),
          t("placeholder.new"),
          "...",
        ]
      : componentType === "number"
        ? ["12..."]
        : ["..."];

  const handleValueChange = (details: { value: string[] }) => {
    const value = details.value;
    if (value.length === 0) {
      setExpandedIndex(null);
    } else {
      const firstValue = value[0];
      const num = parseInt(firstValue, 10);
      if (!isNaN(num)) {
        setExpandedIndex(num);
      }
    }
  };

  const toggleExpanded = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const PropertyOption: React.FC<{
    property: EntityProperty;
    basePath: string;
    depth: number;
  }> = ({ property, basePath, depth }) => {
    const isEntityType = property.type === "entity" && property.entity_type;
    const nestedEntity = isEntityType
      ? findEntity(property.entity_type!)
      : null;

    const currentPath = basePath
      ? `${basePath}>${property.name}`
      : property.name;
    const isExpanded = expandedPaths.has(currentPath);

    const handleClick = () => {
      if (isEntityType && nestedEntity) {
        toggleExpanded(currentPath);
      } else {
        onSelect(currentPath);
      }
    };

    return (
      <Box>
        <Box
          className="property-option"
          p={1}
          cursor="pointer"
          _hover={{ bg: "gray.100" }}
          display="flex"
          alignItems="center"
          width="100%"
          role="menuitem"
        >
          <Box flex="1" onClick={handleClick} textAlign="left" pl={depth * 4}>
            {property.name}
          </Box>
          {isEntityType && nestedEntity && (
            <Box
              as="button"
              fontSize="xs"
              color="orange.500"
              fontWeight="bold"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                toggleExpanded(currentPath);
              }}
              px={2}
              py={1}
              borderRadius="md"
              _hover={{ bg: "orange.100" }}
            >
              {isExpanded ? "▼" : "▶"} {property.entity_type}
            </Box>
          )}
        </Box>
        {isExpanded &&
          nestedEntity &&
          nestedEntity.properties.map((nestedProp) => (
            <PropertyOption
              key={nestedProp.name}
              property={nestedProp}
              basePath={currentPath}
              depth={depth + 1}
            />
          ))}
      </Box>
    );
  };

  return (
    <Box
      className="context-menu entity-path-menu"
      position="fixed"
      left={x}
      top={menuTop}
      bottom={menuBottom}
      zIndex={1000}
      overflowY="auto"
      role="menu"
    >
      <Flex
        className="menu-header"
        justify="space-between"
        align="center"
        p={4}
      >
        <Text fontSize="lg" fontWeight="bold">
          {t("contextMenu.selectEntityPath")}
        </Text>
        <CloseButton onClick={onClose} />
      </Flex>
      <VStack gap={1} p={2} align="stretch">
        {placeholderOptions.map((placeholder) => (
          <Box
            key={placeholder}
            className="placeholder-option"
            p={1}
            cursor="pointer"
            _hover={{ bg: "gray.100" }}
            onClick={() => onSelect(`:${placeholder}`)}
            fontWeight={placeholder === "..." ? "bold" : "normal"}
            role="menuitem"
          >
            {placeholder}
          </Box>
        ))}
      </VStack>
      <Accordion.Root
        collapsible
        value={expandedIndex !== null ? [expandedIndex.toString()] : []}
        onValueChange={handleValueChange}
        className="accordion"
      >
        {entities.map((entity, index) => (
          <Accordion.Item
            key={entity.name}
            value={index.toString()}
            className="accordion-item"
          >
            <Accordion.ItemTrigger className="accordion-title">
              <Box flex="1" textAlign="left">
                {entity.name}
              </Box>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent className="accordion-content" p={2}>
              <Accordion.ItemBody>
                {entity.properties.map((property) => (
                  <PropertyOption
                    key={property.name}
                    property={property}
                    basePath={entity.name}
                    depth={0}
                  />
                ))}
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </Box>
  );
};

export { EntityPathMenu };
