import React from "react";
import { Box, Flex, Text, VStack, CloseButton } from "@chakra-ui/react";

interface ContainerContextMenuProps {
  onSelect: (
    type: "container" | "text" | "number" | "button" | "input"
  ) => void;
  onClose: () => void;
  x: number;
  y: number;
}

const ContainerContextMenu: React.FC<ContainerContextMenuProps> = ({
  onSelect,
  onClose,
  x,
  y,
}) => {
  const MENU_MAX_HEIGHT = 200;
  const isNearBottom = y + MENU_MAX_HEIGHT > window.innerHeight;
  const menuTop = isNearBottom ? undefined : y;
  const menuBottom = isNearBottom ? 0 : undefined;

  return (
    <Box
      className="context-menu container-context-menu"
      position="fixed"
      left={x}
      top={menuTop}
      bottom={menuBottom}
      zIndex={1000}
    >
      <Flex
        className="menu-header"
        justify="space-between"
        align="center"
        p={4}
      >
        <Text fontSize="lg" fontWeight="bold">
          Add Component
        </Text>
        <CloseButton onClick={onClose} />
      </Flex>
      <VStack className="menu-options" gap={1} p={2}>
        <Flex
          className="menu-option"
          onClick={() => onSelect("container")}
          align="center"
          gap={2}
          p={2}
          cursor="pointer"
          width="100%"
          _hover={{ bg: "gray.100" }}
        >
          <Box className="option-icon" fontSize="xl">
            □
          </Box>
          <Box className="option-label">Container</Box>
        </Flex>
        <Flex
          className="menu-option"
          onClick={() => onSelect("text")}
          align="center"
          gap={2}
          p={2}
          cursor="pointer"
          width="100%"
          _hover={{ bg: "gray.100" }}
        >
          <Box className="option-icon" fontSize="xl" color="blue.500">
            T
          </Box>
          <Box className="option-label">Text</Box>
        </Flex>
        <Flex
          className="menu-option"
          onClick={() => onSelect("number")}
          align="center"
          gap={2}
          p={2}
          cursor="pointer"
          width="100%"
          _hover={{ bg: "gray.100" }}
        >
          <Box className="option-icon" fontSize="xl" color="green.500">
            #
          </Box>
          <Box className="option-label">Number</Box>
        </Flex>
        <Flex
          className="menu-option"
          onClick={() => onSelect("button")}
          align="center"
          gap={2}
          p={2}
          cursor="pointer"
          width="100%"
          _hover={{ bg: "gray.100" }}
        >
          <Box className="option-icon" fontSize="xl" color="red.500">
            B
          </Box>
          <Box className="option-label">Button</Box>
        </Flex>
        <Flex
          className="menu-option"
          onClick={() => onSelect("input")}
          align="center"
          gap={2}
          p={2}
          cursor="pointer"
          width="100%"
          _hover={{ bg: "gray.100" }}
        >
          <Box className="option-icon" fontSize="xl" color="purple.500">
            I
          </Box>
          <Box className="option-label">Input</Box>
        </Flex>
      </VStack>
    </Box>
  );
};

export { ContainerContextMenu };
