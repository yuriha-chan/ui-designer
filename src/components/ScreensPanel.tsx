import React from "react";
import { Box, VStack, HStack, Input, Button } from "@chakra-ui/react";
import { Screen } from "../types";

interface ScreensPanelProps {
  screens: Screen[];
  currentScreenId: string;
  setCurrentScreenId: (id: string) => void;
  addScreen: (name: string) => void;
  copyScreen: (id: string) => void;
  deleteScreen: (id: string) => void;
}

const ScreensPanel: React.FC<ScreensPanelProps> = ({
  screens,
  currentScreenId,
  setCurrentScreenId,
  addScreen,
  copyScreen,
  deleteScreen,
}) => {
  return (
    <Box className="screens-panel">
      <HStack className="add-screen-form" gap={2} mb={4}>
        <Input
          type="text"
          placeholder="New screen name"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value.trim()) {
              addScreen(e.currentTarget.value.trim());
              e.currentTarget.value = "";
            }
          }}
          size="sm"
        />
        <Button
          onClick={() => {
            const input = document.querySelector(
              ".add-screen-form input"
            ) as HTMLInputElement;
            if (input && input.value.trim()) {
              addScreen(input.value.trim());
              input.value = "";
            }
          }}
          size="sm"
          colorScheme="blue"
        >
          <Box as="span" mr={1}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Box>
          Add
        </Button>
      </HStack>
      <VStack className="screens-list" gap={2} align="stretch">
        {screens.map((screen) => (
          <Box
            key={screen.id}
            className={`screen-item ${screen.id === currentScreenId ? "active" : ""}`}
            borderWidth="1px"
            borderRadius="md"
            p={2}
            bg={screen.id === currentScreenId ? "blue.50" : "transparent"}
            borderColor={
              screen.id === currentScreenId ? "blue.200" : "gray.200"
            }
            cursor="pointer"
            onClick={() => setCurrentScreenId(screen.id)}
          >
            <HStack justify="space-between">
              <Box
                className="screen-name"
                fontWeight="medium"
                color={screen.id === currentScreenId ? "gray.800" : "inherit"}
              >
                {screen.name}
              </Box>
              <HStack className="screen-actions" gap={1}>
                <Button
                  className="copy-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyScreen(screen.id);
                  }}
                  title="Copy screen"
                  size="xs"
                  variant="ghost"
                >
                  📋
                </Button>
                <Button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteScreen(screen.id);
                  }}
                  title="Delete screen"
                  disabled={screens.length <= 1}
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                >
                  🗑️
                </Button>
              </HStack>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export { ScreensPanel };
