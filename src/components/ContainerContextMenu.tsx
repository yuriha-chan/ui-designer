import React from "react";
import { Box, Flex, Text, VStack, CloseButton } from "@chakra-ui/react";
import { useI18n } from "../I18nContext";

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
  const { t } = useI18n();
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
      role="menu"
    >
      <Flex
        className="menu-header"
        justify="space-between"
        align="center"
        p={4}
      >
        <Text fontSize="lg" fontWeight="bold">
          {t("contextMenu.addComponent")}
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
          role="menuitem"
        >
          <Box className="option-icon" fontSize="xl">
            □
          </Box>
          <Box className="option-label">{t("contextMenu.container")}</Box>
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
          role="menuitem"
        >
          <Box className="option-icon" fontSize="xl" color="blue.500">
            T
          </Box>
          <Box className="option-label">{t("contextMenu.text")}</Box>
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
          role="menuitem"
        >
          <Box className="option-icon" fontSize="xl" color="green.500">
            #
          </Box>
          <Box className="option-label">{t("contextMenu.number")}</Box>
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
          role="menuitem"
        >
          <Box className="option-icon" fontSize="xl" color="red.500">
            B
          </Box>
          <Box className="option-label">{t("contextMenu.button")}</Box>
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
          role="menuitem"
        >
          <Box className="option-icon" fontSize="xl" color="purple.500">
            I
          </Box>
          <Box className="option-label">{t("contextMenu.input")}</Box>
        </Flex>
      </VStack>
    </Box>
  );
};

export { ContainerContextMenu };
