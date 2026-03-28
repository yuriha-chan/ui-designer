import React, { useState, useCallback, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";
import { UIComponent, Entity, Screen } from "./types";
import { DragManager } from "./DragManager";
import { exportDesign, exportStoryboard, importDesign } from "./importExport";
import { saveToStorage, loadFromStorage } from "./storage";
import {
  ChakraProvider,
  defaultSystem,
  Button,
  NativeSelect,
  Input,
  Box,
  Heading,
  VStack,
  HStack,
  Accordion,
  Text,
  Flex,
  CloseButton,
  Tabs,
} from "@chakra-ui/react";
import {
  sortComponentsBySExpression,
  isDescendant as isDescendantPure,
  findAndRemove,
  findComponent,
  deepCopy,
  generateSExpression,
} from "./componentTree";
import { ComponentNode } from "./ComponentNode";
import "./App.css";

// サンプルエンティティ定義
const sampleEntities: Entity[] = [
  {
    name: "Account",
    properties: [
      { name: "Name", type: "string" },
      { name: "Email", type: "string" },
      { name: "Balance", type: "number" },
      { name: "Status", type: "string" },
    ],
  },
  {
    name: "Product",
    properties: [
      { name: "Title", type: "string" },
      { name: "Price", type: "number" },
      { name: "Stock", type: "number" },
      { name: "Category", type: "string" },
    ],
  },
  {
    name: "Order",
    properties: [
      { name: "ID", type: "string" },
      { name: "Date", type: "string" },
      { name: "Total", type: "number" },
      { name: "Status", type: "string" },
    ],
  },
  {
    name: "User",
    properties: [
      { name: "Username", type: "string" },
      { name: "Role", type: "string" },
      { name: "LastLogin", type: "string" },
    ],
  },
];

// 初期データ
const initialComponents: UIComponent[] = [
  {
    id: "root",
    type: "container",
    children: [],
  },
];

// 初期画面データ
const initialScreen: Screen = {
  id: uuidv4(),
  name: "メイン画面",
  components: initialComponents,
};

const initialScreens: Screen[] = [initialScreen];

const MAX_HISTORY = 50;

function App() {
  // ストーリーボード状態
  const [screens, setScreens] = useState<Screen[]>(initialScreens);
  const [history, setHistory] = useState<Screen[][]>([initialScreens]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Refs for synchronous access in callbacks
  const historyRef = useRef<Screen[][]>([initialScreens]);
  const historyIndexRef = useRef(0);

  const [currentScreenId, setCurrentScreenId] = useState<string>(
    initialScreen.id
  );
  const [entities, setEntities] = useState<Entity[]>(sampleEntities);
  const [panelType, setPanelType] = useState<"entities" | "screens">(
    "entities"
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [isEditingScreenName, setIsEditingScreenName] = useState(false);
  const [editingScreenName, setEditingScreenName] = useState("");
  const [exportMode, setExportMode] = useState<"screen" | "storyboard">(
    "screen"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  type ContextMenuType = "entity-path" | "container-create";
  const [contextMenu, setContextMenu] = useState<{
    type: ContextMenuType;
    componentId: string;
    x: number;
    y: number;
    pendingComponentType?: "text" | "number" | "button" | "input"; // エンティティパス選択待ちのコンポーネントタイプ
  } | null>(null);

  // 現在の画面のコンポーネントを取得するヘルパー関数
  const getCurrentComponents = useCallback((): UIComponent[] => {
    const currentScreen = screens.find(
      (screen) => screen.id === currentScreenId
    );
    return currentScreen ? currentScreen.components : [];
  }, [screens, currentScreenId]);

  // 現在の画面を取得するヘルパー関数
  const getCurrentScreen = useCallback((): Screen | undefined => {
    return screens.find((screen) => screen.id === currentScreenId);
  }, [screens, currentScreenId]);

  // Sync refs with state
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  // 現在の画面のコンポーネントを更新するヘルパー関数
  const updateCurrentScreenComponents = useCallback(
    (updater: (components: UIComponent[]) => UIComponent[]) => {
      setScreens((prevScreens) => {
        const prevScreen = prevScreens.find((s) => s.id === currentScreenId);
        const prevComponents = prevScreen?.components || [];

        const newScreens = prevScreens.map((screen) =>
          screen.id === currentScreenId
            ? { ...screen, components: updater(screen.components) }
            : screen
        );

        const newScreen = newScreens.find((s) => s.id === currentScreenId);
        const newComponents = newScreen?.components || [];

        // Skip history update if current screen's components are semantically identical
        const prevSExpr = sortComponentsBySExpression(prevComponents)
          .map(generateSExpression)
          .join(" ");
        const newSExpr = sortComponentsBySExpression(newComponents)
          .map(generateSExpression)
          .join(" ");
        if (prevSExpr === newSExpr) {
          return newScreens;
        }

        // Add new state to history, truncate forward history
        const newHistory = historyRef.current.slice(
          0,
          historyIndexRef.current + 1
        );
        newHistory.push(JSON.parse(JSON.stringify(newScreens)));
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        }
        const newIndex = newHistory.length - 1;

        setHistory(newHistory);
        setHistoryIndex(newIndex);
        historyRef.current = newHistory;
        historyIndexRef.current = newIndex;

        return newScreens;
      });
    },
    [currentScreenId]
  );

  // Undo function
  const undo = useCallback(() => {
    const currentIndex = historyIndexRef.current;
    if (currentIndex > 0) {
      const prevState = historyRef.current[currentIndex - 1];
      if (prevState) {
        setScreens(JSON.parse(JSON.stringify(prevState)));
        setHistoryIndex(currentIndex - 1);
      }
    }
  }, []);

  // Redo function
  const redo = useCallback(() => {
    const currentIndex = historyIndexRef.current;
    if (currentIndex < historyRef.current.length - 1) {
      const nextState = historyRef.current[currentIndex + 1];
      if (nextState) {
        setScreens(JSON.parse(JSON.stringify(nextState)));
        setHistoryIndex(currentIndex + 1);
      }
    }
  }, []);

  // Check if undo/redo are available
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // 画面操作関数
  const addScreen = useCallback((name: string) => {
    const newScreen: Screen = {
      id: uuidv4(),
      name,
      components: [{ id: "root", type: "container", children: [] }],
    };
    setScreens((prev) => [...prev, newScreen]);
    setCurrentScreenId(newScreen.id);
  }, []);

  const copyScreen = useCallback(
    (screenId: string) => {
      const screenToCopy = screens.find((s) => s.id === screenId);
      if (!screenToCopy) return;

      // コンポーネントのディープコピー（新しいIDを割り当て）
      const deepCopyComponents = (comps: UIComponent[]): UIComponent[] => {
        return comps.map((comp) => ({
          ...comp,
          id: uuidv4(),
          children: deepCopyComponents(comp.children),
        }));
      };

      const newScreen: Screen = {
        id: uuidv4(),
        name: `${screenToCopy.name} Copy`,
        components: deepCopyComponents(screenToCopy.components),
      };
      setScreens((prev) => [...prev, newScreen]);
      setCurrentScreenId(newScreen.id);
    },
    [screens]
  );

  const deleteScreen = useCallback(
    (screenId: string) => {
      if (screens.length <= 1) {
        alert("Cannot delete the last screen");
        return;
      }
      setScreens((prev) => prev.filter((s) => s.id !== screenId));
      // 現在の画面が削除された場合、別の画面に切り替え
      if (screenId === currentScreenId) {
        const remainingScreen = screens.find((s) => s.id !== screenId);
        if (remainingScreen) {
          setCurrentScreenId(remainingScreen.id);
        }
      }
    },
    [screens, currentScreenId]
  );

  const renameScreen = useCallback((screenId: string, newName: string) => {
    setScreens((prev) =>
      prev.map((screen) =>
        screen.id === screenId ? { ...screen, name: newName } : screen
      )
    );
  }, []);

  // 画面名編集関数
  const startEditingScreenName = useCallback(() => {
    const currentScreen = getCurrentScreen();
    if (currentScreen) {
      setEditingScreenName(currentScreen.name);
      setIsEditingScreenName(true);
    }
  }, [getCurrentScreen]);

  const handleScreenNameBlur = useCallback(() => {
    if (editingScreenName.trim()) {
      renameScreen(currentScreenId, editingScreenName.trim());
    }
    setIsEditingScreenName(false);
    setEditingScreenName("");
  }, [editingScreenName, currentScreenId, renameScreen]);

  // Auto-recovery: Load from localStorage on mount
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) {
      setScreens(saved.screens);
      setEntities(saved.entities);
      setCurrentScreenId(saved.currentScreenId);
      // Initialize history with loaded state
      const loadedHistory = [saved.screens];
      setHistory(loadedHistory);
      setHistoryIndex(0);
      historyRef.current = loadedHistory;
      historyIndexRef.current = 0;
    }
  }, []);

  // Auto-save: Save to localStorage on change (debounced 1 second)
  const lastSavedRef = useRef<string | null>(null);
  useEffect(() => {
    const currentData = JSON.stringify({ screens, entities, currentScreenId });
    if (lastSavedRef.current === currentData) {
      return;
    }
    lastSavedRef.current = currentData;
    const timer = setTimeout(() => {
      saveToStorage({ screens, entities, currentScreenId });
    }, 1000);
    return () => clearTimeout(timer);
  }, [screens, entities, currentScreenId]);

  // メニュー外クリックやエスケープキーでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu && !(e.target as Element).closest(".context-menu")) {
        setContextMenu(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && contextMenu) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [contextMenu]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      }
    };
    document.addEventListener("keydown", handleKeyboard);
    return () => {
      document.removeEventListener("keydown", handleKeyboard);
    };
  }, [undo, redo]);

  const isDescendant = useCallback(
    (parentId: string, childId: string): boolean => {
      return isDescendantPure(getCurrentComponents(), parentId, childId);
    },
    [getCurrentComponents]
  );

  const moveComponent = useCallback(
    (draggedId: string, targetId: string) => {
      console.log(
        `moveComponent: draggedId=${draggedId}, targetId=${targetId}`
      );

      const insertAt = (
        comps: UIComponent[],
        targetId: string,
        node: UIComponent
      ): UIComponent[] => {
        console.log(
          `insertAt: targetId=${targetId}, comps length=${comps.length}`
        );
        return comps.map((comp) => {
          if (comp.id === targetId) {
            console.log(`insertAt: found target comp ${comp.id}`);
            console.log(
              `insertAt: adding node to children, current children count=${comp.children.length}`
            );
            return { ...comp, children: [...comp.children, node] };
          }
          return { ...comp, children: insertAt(comp.children, targetId, node) };
        });
      };

      // 現在のコンポーネントを取得
      const currentComponents = getCurrentComponents();

      // ドラッグされたコンポーネントを探して削除
      const { node, newComps } = findAndRemove(currentComponents, draggedId);
      if (!node) {
        console.log(`moveComponent: node not found for draggedId ${draggedId}`);
        return;
      }
      console.log(
        `moveComponent: node found, newComps length=${newComps.length}`
      );

      // ターゲットに挿入
      let updatedComps = newComps;
      updatedComps = insertAt(newComps, targetId, node);

      console.log(`moveComponent: setting components`);
      updateCurrentScreenComponents(() => updatedComps);
    },
    [getCurrentComponents, updateCurrentScreenComponents]
  );

  const copyComponent = useCallback(
    (sourceId: string, parentId: string) => {
      // 現在のコンポーネントを取得
      const currentComponents = getCurrentComponents();

      // ソースコンポーネントを探す
      const source = findComponent(currentComponents, sourceId);
      if (!source) return;

      // ディープコピーを作成（新しいIDを割り当て）
      const copied = deepCopy(source);

      // 親のchildrenに追加
      const updateComponents = (comps: UIComponent[]): UIComponent[] => {
        return comps.map((comp) => {
          if (comp.id === parentId) {
            return {
              ...comp,
              children: [...comp.children, copied],
            };
          }
          return {
            ...comp,
            children: updateComponents(comp.children),
          };
        });
      };

      updateCurrentScreenComponents(() => updateComponents(currentComponents));
    },
    [getCurrentComponents, updateCurrentScreenComponents]
  );

  const removeComponent = useCallback(
    (id: string) => {
      const updateComponents = (comps: UIComponent[]): UIComponent[] => {
        return comps
          .filter((comp) => comp.id !== id)
          .map((comp) => ({
            ...comp,
            children: updateComponents(comp.children),
          }));
      };

      updateCurrentScreenComponents((currentComponents) =>
        updateComponents(currentComponents)
      );
    },
    [updateCurrentScreenComponents]
  );

  const addComponentToContainer = useCallback(
    (
      containerId: string,
      type: "container" | "text" | "number" | "button" | "input",
      entityPath?: string
    ) => {
      const newComponent: UIComponent = {
        id: uuidv4(),
        type,
        children: type === "container" ? [] : [],
        entityPath: entityPath || undefined,
      };

      const updateComponents = (comps: UIComponent[]): UIComponent[] => {
        return comps.map((comp) => {
          if (comp.id === containerId) {
            return { ...comp, children: [...comp.children, newComponent] };
          }
          return {
            ...comp,
            children: updateComponents(comp.children),
          };
        });
      };

      updateCurrentScreenComponents((currentComponents) =>
        updateComponents(currentComponents)
      );
    },
    [updateCurrentScreenComponents]
  );

  const updateEntityPath = useCallback(
    (id: string, entityPath: string) => {
      const updateComponents = (comps: UIComponent[]): UIComponent[] => {
        return comps.map((comp) => {
          if (comp.id === id) {
            return { ...comp, entityPath };
          }
          return {
            ...comp,
            children: updateComponents(comp.children),
          };
        });
      };

      updateCurrentScreenComponents((currentComponents) =>
        updateComponents(currentComponents)
      );
    },
    [updateCurrentScreenComponents]
  );

  const updateTargetScreen = useCallback(
    (id: string, targetScreen: string) => {
      const updateComponents = (comps: UIComponent[]): UIComponent[] => {
        return comps.map((comp) => {
          if (comp.id === id) {
            return { ...comp, targetScreen };
          }
          return {
            ...comp,
            children: updateComponents(comp.children),
          };
        });
      };

      updateCurrentScreenComponents((currentComponents) =>
        updateComponents(currentComponents)
      );
    },
    [updateCurrentScreenComponents]
  );

  const handleButtonClick = useCallback(
    (id: string) => {
      const currentComponents = getCurrentComponents();
      const component = findComponent(currentComponents, id);
      if (component && component.type === "button" && component.targetScreen) {
        setCurrentScreenId(component.targetScreen);
      }
    },
    [getCurrentComponents]
  );

  const handleExport = useCallback(() => {
    let json: string;
    if (exportMode === "screen") {
      const currentComponents = getCurrentComponents();
      json = exportDesign(currentComponents, entities);
    } else {
      json = exportStoryboard(screens, entities);
    }
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "design.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [getCurrentComponents, entities, screens, exportMode]);

  const handleImport = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const result = event.target?.result;
          if (typeof result !== "string") {
            throw new Error("File content is not text");
          }
          const imported = importDesign(result);
          if (imported.version === "1.0") {
            updateCurrentScreenComponents(() => imported.components);
            setEntities(imported.entities);
          } else {
            // version "2.0"
            setScreens(imported.screens);
            setEntities(imported.entities);
            if (imported.screens.length > 0) {
              setCurrentScreenId(imported.screens[0].id);
            } else {
              // If no screens, create a default screen
              const defaultScreen = {
                id: uuidv4(),
                name: "Imported Screen",
                components: [],
              };
              setScreens([defaultScreen]);
              setCurrentScreenId(defaultScreen.id);
            }
          }
        } catch (error) {
          if (error instanceof Error) {
            alert(error.message);
          } else {
            alert("Unknown error");
          }
        }
      };
      reader.readAsText(file);
      // Reset file input to allow re-uploading the same file
      e.target.value = "";
    },
    [updateCurrentScreenComponents, setScreens, setCurrentScreenId, setEntities]
  );

  // Attach native change event listener to file input to ensure test events are captured
  useEffect(() => {
    const input = fileInputRef.current;
    if (!input) return;
    const handleNativeChange = (e: Event) => {
      // Convert native event to React event-like object
      const reactEvent = {
        target: e.target,
        currentTarget: e.currentTarget,
        nativeEvent: e,
        persist: () => {},
        bubbles: e.bubbles,
        cancelable: e.cancelable,
        defaultPrevented: e.defaultPrevented,
        eventPhase: e.eventPhase,
        isTrusted: e.isTrusted,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation(),
        timeStamp: e.timeStamp,
        type: e.type,
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(reactEvent);
    };
    input.addEventListener("change", handleNativeChange);
    return () => {
      input.removeEventListener("change", handleNativeChange);
    };
  }, [handleFileChange]);

  // エンティティパス選択メニューコンポーネント
  const EntityPathMenu: React.FC<{
    entities: Entity[];
    onSelect: (entityPath: string) => void;
    onClose: () => void;
    x: number;
    y: number;
  }> = ({ entities, onSelect, onClose, x, y }) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const handleValueChange = (details: { value: string[] }) => {
      const value = details.value;
      if (value.length === 0) {
        setExpandedIndex(null);
      } else {
        const firstValue = value[0];
        // If it's a number string, parse it
        const num = parseInt(firstValue, 10);
        if (!isNaN(num)) {
          setExpandedIndex(num);
        }
      }
    };

    return (
      <Box
        className="context-menu entity-path-menu"
        position="fixed"
        left={x}
        top={y}
        zIndex={1000}
      >
        <Flex
          className="menu-header"
          justify="space-between"
          align="center"
          p={4}
        >
          <Text fontSize="lg" fontWeight="bold">
            Select Entity Path
          </Text>
          <CloseButton onClick={onClose} />
        </Flex>
        <Accordion.Root
          collapsible
          value={expandedIndex !== null ? [expandedIndex.toString()] : []}
          onValueChange={handleValueChange}
          className="accordion"
        >
          <Accordion.Item value="clear" className="accordion-item">
            <Accordion.ItemTrigger
              className="accordion-title"
              onClick={() => onSelect("")}
            >
              <Box flex="1" textAlign="left">
                ...
              </Box>
            </Accordion.ItemTrigger>
            <Accordion.ItemContent className="accordion-content" p={4}>
              <Accordion.ItemBody>Clear entity path</Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
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
              <Accordion.ItemContent className="accordion-content" p={4}>
                <Accordion.ItemBody>
                  {entity.properties.map((property) => (
                    <Box
                      key={property.name}
                      className="property-option"
                      onClick={() =>
                        onSelect(`${entity.name}>${property.name}`)
                      }
                      p={2}
                      cursor="pointer"
                      _hover={{ bg: "gray.100" }}
                    >
                      {property.name}
                    </Box>
                  ))}
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </Box>
    );
  };

  // コンテナ作成コンテキストメニューコンポーネント
  const ContainerContextMenu: React.FC<{
    onSelect: (
      type: "container" | "text" | "number" | "button" | "input"
    ) => void;
    onClose: () => void;
    x: number;
    y: number;
  }> = ({ onSelect, onClose, x, y }) => {
    return (
      <Box
        className="context-menu container-context-menu"
        position="fixed"
        left={x}
        top={y}
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
        <VStack className="menu-options" gap={2} p={4}>
          <Flex
            className="menu-option"
            onClick={() => onSelect("container")}
            align="center"
            gap={3}
            p={3}
            cursor="pointer"
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
            gap={3}
            p={3}
            cursor="pointer"
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
            gap={3}
            p={3}
            cursor="pointer"
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
            gap={3}
            p={3}
            cursor="pointer"
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
            gap={3}
            p={3}
            cursor="pointer"
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

  const handleEntityPathSelect = (entityPath: string) => {
    if (!contextMenu) return;
    const { componentId, pendingComponentType } = contextMenu;
    if (pendingComponentType) {
      // エンティティパス選択待ちのコンポーネントを作成
      addComponentToContainer(componentId, pendingComponentType, entityPath);
    } else {
      // 既存コンポーネントのエンティティパスを更新
      updateEntityPath(componentId, entityPath);
    }
    setContextMenu(null);
  };

  const handleComponentCreate = (
    type: "container" | "text" | "number" | "button" | "input"
  ) => {
    if (!contextMenu) return;
    const { componentId, x, y } = contextMenu;
    if (type === "container") {
      // コンテナは即時作成
      addComponentToContainer(componentId, type);
      setContextMenu(null);
    } else {
      // テキスト/数字/ボタン/入力はエンティティパス選択メニューを表示
      setContextMenu({
        type: "entity-path",
        componentId,
        x,
        y,
        pendingComponentType: type,
      });
    }
  };

  // プレビューモード表示コンポーネント

  return (
    <ChakraProvider value={defaultSystem}>
      <DndProvider backend={HTML5Backend}>
        <DragManager>
          <Box className="app">
            {previewMode ? (
              <Button
                onClick={() => setPreviewMode(false)}
                title="Exit preview mode"
                variant="ghost"
                colorScheme="gray"
                size="sm"
              >
                ×
              </Button>
            ) : (
              <Box as="header" className="header">
                <Box className="screen-name-editor">
                  {isEditingScreenName ? (
                    <Input
                      type="text"
                      value={editingScreenName}
                      onChange={(e) => setEditingScreenName(e.target.value)}
                      onBlur={handleScreenNameBlur}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleScreenNameBlur()
                      }
                      autoFocus
                      variant="outline"
                      size="sm"
                    />
                  ) : (
                    <Heading
                      as="h1"
                      size="lg"
                      onClick={() => startEditingScreenName()}
                      cursor="pointer"
                    >
                      {getCurrentScreen()?.name || "Untitled"}
                    </Heading>
                  )}
                </Box>
                <HStack className="menu-bar" gap={2}>
                  <Button
                    onClick={undo}
                    disabled={!canUndo}
                    colorScheme="gray"
                    size="sm"
                    title="Undo (Ctrl+Z)"
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
                        <path d="M3 7v6h6" />
                        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                      </svg>
                    </Box>
                    Undo
                  </Button>
                  <Button
                    onClick={redo}
                    disabled={!canRedo}
                    colorScheme="gray"
                    size="sm"
                    title="Redo (Ctrl+Shift+Z)"
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
                        <path d="M21 7v6h-6" />
                        <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                      </svg>
                    </Box>
                    Redo
                  </Button>
                  <Button
                    onClick={() => setPreviewMode(!previewMode)}
                    colorScheme="blue"
                    size="sm"
                  >
                    {previewMode ? "Exit Preview" : "Preview"}
                  </Button>
                  <NativeSelect.Root size="sm" width="auto">
                    <NativeSelect.Field
                      value={exportMode}
                      onChange={(e) =>
                        setExportMode(e.target.value as "screen" | "storyboard")
                      }
                    >
                      <option value="screen">Current Screen</option>
                      <option value="storyboard">Storyboard</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                  <Button onClick={handleExport} colorScheme="green" size="sm">
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
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </Box>
                    Export
                  </Button>
                  <Button onClick={handleImport} colorScheme="purple" size="sm">
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
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </Box>
                    Import
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept=".json,application/json"
                  />
                </HStack>
              </Box>
            )}
            <Box as="main" className="main">
              <Box className={previewMode ? "preview" : "designer"}>
                <Box className="component-tree">
                  {sortComponentsBySExpression(getCurrentComponents()).map(
                    (comp) => (
                      <ComponentNode
                        key={comp.id}
                        component={comp}
                        depth={0}
                        parentId={undefined}
                        entities={entities}
                        screens={screens}
                        onCopy={copyComponent}
                        onRemove={removeComponent}
                        onEntityPathChange={updateEntityPath}
                        onTargetScreenChange={updateTargetScreen}
                        onButtonClick={handleButtonClick}
                        onMoveComponent={moveComponent}
                        isDescendant={isDescendant}
                        setContextMenu={setContextMenu}
                        previewMode={previewMode}
                      />
                    )
                  )}
                </Box>
                {!previewMode && (
                  <Box className="side-panel">
                    <Box className="side-panel-content">
                      <Tabs.Root
                        value={panelType}
                        onValueChange={(details) =>
                          setPanelType(details.value as "entities" | "screens")
                        }
                        variant="subtle"
                      >
                        <Tabs.List>
                          <Tabs.Trigger value="entities">Entities</Tabs.Trigger>
                          <Tabs.Trigger value="screens">Screens</Tabs.Trigger>
                        </Tabs.List>
                      </Tabs.Root>
                      {panelType === "entities" ? (
                        <Box className="entities-panel">
                          <VStack
                            className="entities-list"
                            gap={2}
                            align="stretch"
                          >
                            {entities.map((entity) => (
                              <Box
                                key={entity.name}
                                className="entity"
                                borderWidth="1px"
                                borderRadius="md"
                                p={2}
                              >
                                <Box
                                  className="entity-name"
                                  fontWeight="bold"
                                  mb={1}
                                >
                                  {entity.name}
                                </Box>
                                <VStack
                                  className="entity-properties"
                                  gap={1}
                                  align="stretch"
                                >
                                  {entity.properties.map((prop) => (
                                    <Box
                                      key={prop.name}
                                      className="entity-property"
                                      fontSize="sm"
                                    >
                                      {entity.name} &gt; {prop.name}
                                    </Box>
                                  ))}
                                </VStack>
                              </Box>
                            ))}
                          </VStack>
                        </Box>
                      ) : (
                        <Box className="screens-panel">
                          <HStack className="add-screen-form" gap={2} mb={4}>
                            <Input
                              type="text"
                              placeholder="New screen name"
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  e.currentTarget.value.trim()
                                ) {
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
                          <VStack
                            className="screens-list"
                            gap={2}
                            align="stretch"
                          >
                            {screens.map((screen) => (
                              <Box
                                key={screen.id}
                                className={`screen-item ${screen.id === currentScreenId ? "active" : ""}`}
                                borderWidth="1px"
                                borderRadius="md"
                                p={2}
                                bg={
                                  screen.id === currentScreenId
                                    ? "blue.50"
                                    : "transparent"
                                }
                                borderColor={
                                  screen.id === currentScreenId
                                    ? "blue.200"
                                    : "gray.200"
                                }
                                cursor="pointer"
                                onClick={() => setCurrentScreenId(screen.id)}
                              >
                                <HStack justify="space-between">
                                  <Box
                                    className="screen-name"
                                    fontWeight="medium"
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
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
            {contextMenu && contextMenu.type === "entity-path" && (
              <EntityPathMenu
                entities={entities}
                onSelect={handleEntityPathSelect}
                onClose={() => setContextMenu(null)}
                x={contextMenu.x}
                y={contextMenu.y}
              />
            )}
            {contextMenu && contextMenu.type === "container-create" && (
              <ContainerContextMenu
                onSelect={handleComponentCreate}
                onClose={() => setContextMenu(null)}
                x={contextMenu.x}
                y={contextMenu.y}
              />
            )}
          </Box>
        </DragManager>
      </DndProvider>
    </ChakraProvider>
  );
}

export default App;
