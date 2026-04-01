import React, { useState, useCallback, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";
import {
  UIComponent,
  Entity,
  Screen,
  PropertyType,
  ComponentType,
} from "./types";
import { DragManager } from "./DragManager";
import {
  exportDesign,
  exportStoryboard,
  importDesign,
  exportDesignAsLLMText,
  exportStoryboardAsLLMText,
} from "./importExport";
import { saveToStorage, loadFromStorage } from "./storage";
import {
  ChakraProvider,
  defaultSystem,
  Button,
  NativeSelect,
  Input,
  Box,
  Heading,
  HStack,
  Tabs,
} from "@chakra-ui/react";
import {
  sortComponentsBySExpression,
  isDescendant as isDescendantPure,
  findAndRemove,
  insert,
  findComponent,
  deepCopy,
  generateSExpression,
} from "./componentTree";
import { buildEntityPathMap, type EntityPathMap } from "./entityPathMap";
import { ComponentNode } from "./ComponentNode";
import { EntityPathMenu } from "./components/EntityPathMenu";
import { ContainerContextMenu } from "./components/ContainerContextMenu";
import { EntitiesPanel } from "./components/EntitiesPanel";
import { ScreensPanel } from "./components/ScreensPanel";
import {
  useContextMenuState,
  useContextMenuDispatch,
} from "./ContextMenuContext";
import { useI18n, type Language } from "./I18nContext";
import "./App.css";

function getSampleEntities(lang: Language): Entity[] {
  return [];
}

function getInitialScreen(lang: Language): Screen {
  const name = lang === "ja" ? "メイン画面" : "Main Screen";
  return {
    id: uuidv4(),
    name,
    components: [{ id: "root", type: "container", children: [] }],
  };
}

const MAX_HISTORY = 50;

const ROOT_SCREEN_ID = "root-screen";

function App() {
  const { language, setLanguage, t } = useI18n();

  // Create initial screen with fixed ID to avoid uuid mismatch
  const createInitialScreen = (lang: Language): Screen => ({
    id: ROOT_SCREEN_ID,
    name: lang === "ja" ? "メイン画面" : "Main Screen",
    components: [{ id: "root", type: "container", children: [] }],
  });

  // ストーリーボード状態
  const [screens, setScreens] = useState<Screen[]>(() => [
    createInitialScreen(language),
  ]);
  const [history, setHistory] = useState<Screen[][]>(() => [
    [createInitialScreen(language)],
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Refs for synchronous access in callbacks
  const historyRef = useRef<Screen[][]>([[createInitialScreen(language)]]);
  const historyIndexRef = useRef(0);

  const [currentScreenId, setCurrentScreenId] =
    useState<string>(ROOT_SCREEN_ID);
  const [entities, setEntities] = useState<Entity[]>(() =>
    getSampleEntities(language)
  );
  const [panelType, setPanelType] = useState<"entities" | "screens">(
    "entities"
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [isEditingScreenName, setIsEditingScreenName] = useState(false);
  const [, setEditingScreenName] = useState("");
  const [exportMode, setExportMode] = useState<"screen" | "storyboard">(
    "storyboard"
  );
  const [exportFormat, setExportFormat] = useState<"json" | "llm-text">("json");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contextMenu = useContextMenuState();
  const setContextMenu = useContextMenuDispatch();

  // Entity editing state
  const [editingEntityIndex, setEditingEntityIndex] = useState<number | null>(
    null
  );
  const [editingPropertyIndex, setEditingPropertyIndex] = useState<{
    entityIndex: number;
    propertyIndex: number;
  } | null>(null);

  // Entity path map for efficient component lookups
  const [entityPathMap, setEntityPathMap] = useState<EntityPathMap>(new Map());

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

  // Rebuild entity path map whenever entities or screens change
  useEffect(() => {
    const allComponents: UIComponent[] = [];
    const collectComponents = (comps: UIComponent[]) => {
      for (const comp of comps) {
        allComponents.push(comp);
        collectComponents(comp.children);
      }
    };
    for (const screen of screens) {
      collectComponents(screen.components);
    }
    setEntityPathMap(buildEntityPathMap(entities, allComponents));
  }, [entities, screens]);

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
    setIsEditingScreenName(false);
    setEditingScreenName("");
  }, []);

  const handleScreenNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const value = e.currentTarget.value;
      if (e.key === "Enter" && value.trim()) {
        renameScreen(currentScreenId, value.trim());
        setIsEditingScreenName(false);
        setEditingScreenName("");
      } else if (e.key === "Escape") {
        setIsEditingScreenName(false);
        setEditingScreenName("");
      }
    },
    [currentScreenId, renameScreen]
  );

  // Entity CRUD functions
  const addEntity = useCallback(() => {
    const newEntity: Entity = {
      name: "New Entity",
      properties: [],
    };
    setEntities((prev) => [...prev, newEntity]);
  }, []);

  const deleteEntity = useCallback((entityIndex: number) => {
    setEntities((prev) => prev.filter((_, i) => i !== entityIndex));
  }, []);

  // Helper to update a single component's entity path if affected
  const updateComponentEntityPath = (
    comp: UIComponent,
    affectedIds: Set<string>,
    oldName: string,
    newName: string
  ): UIComponent => {
    let updated = { ...comp };
    if (affectedIds.has(comp.id) && comp.entityPath) {
      updated.entityPath = comp.entityPath.replace(
        new RegExp(`^${oldName}(>|$)`, "g"),
        `${newName}$1`
      );
    }
    if (comp.children.length > 0) {
      updated.children = comp.children.map((child) =>
        updateComponentEntityPath(child, affectedIds, oldName, newName)
      );
    }
    return updated;
  };

  const updateComponentEntityPathByPropertyRename = (
    comp: UIComponent,
    affectedIds: Set<string>,
    targetEntityName: string,
    oldPropertyName: string,
    newPropertyName: string
  ): UIComponent => {
    let updated = { ...comp };
    if (affectedIds.has(comp.id) && comp.entityPath) {
      const parts = comp.entityPath.split(">");
      let currentEntityName = parts[0];
      const newParts: string[] = [parts[0]];

      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const currentEntity = entities.find(
          (e) => e.name === currentEntityName
        );
        const property = currentEntity?.properties.find((p) => p.name === part);

        if (
          currentEntityName === targetEntityName &&
          part === oldPropertyName
        ) {
          newParts.push(newPropertyName);
        } else {
          newParts.push(part);
        }

        if (property?.type === "entity" && property.entity_type) {
          currentEntityName = property.entity_type;
        }
      }
      updated.entityPath = newParts.join(">");
    }
    if (comp.children.length > 0) {
      updated.children = comp.children.map((child) =>
        updateComponentEntityPathByPropertyRename(
          child,
          affectedIds,
          targetEntityName,
          oldPropertyName,
          newPropertyName
        )
      );
    }
    return updated;
  };

  const updateEntityName = useCallback(
    (entityIndex: number, newName: string) => {
      const oldName = entities[entityIndex]?.name;
      if (!oldName) return;

      // Find all components affected by this entity rename using the map
      const affectedComponentIds = new Set<string>();
      const entity = entities[entityIndex];
      for (const prop of entity.properties) {
        const ids = entityPathMap.get(`${oldName}>${prop.name}`);
        ids?.forEach((id) => affectedComponentIds.add(id));
      }

      // Update entity name in state
      setEntities((prev) =>
        prev.map((entity, i) =>
          i === entityIndex ? { ...entity, name: newName } : entity
        )
      );

      // Update entity_type in properties that reference the renamed entity
      setEntities((prev) =>
        prev.map((entity) => ({
          ...entity,
          properties: entity.properties.map((prop) =>
            prop.entity_type === oldName
              ? { ...prop, entity_type: newName }
              : prop
          ),
        }))
      );

      // Update affected components' entity paths in ALL screens
      if (affectedComponentIds.size > 0) {
        setScreens((prevScreens) =>
          prevScreens.map((screen) => ({
            ...screen,
            components: screen.components.map((comp) =>
              updateComponentEntityPath(
                comp,
                affectedComponentIds,
                oldName,
                newName
              )
            ),
          }))
        );
      }
    },
    [entities, entityPathMap]
  );

  const addProperty = useCallback((entityIndex: number) => {
    const newProperty = { name: "newProperty", type: "string" as const };
    setEntities((prev) =>
      prev.map((entity, i) =>
        i === entityIndex
          ? { ...entity, properties: [...entity.properties, newProperty] }
          : entity
      )
    );
  }, []);

  const deleteProperty = useCallback(
    (entityIndex: number, propertyIndex: number) => {
      setEntities((prev) =>
        prev.map((entity, i) =>
          i === entityIndex
            ? {
                ...entity,
                properties: entity.properties.filter(
                  (_, p) => p !== propertyIndex
                ),
              }
            : entity
        )
      );
    },
    []
  );

  const updatePropertyName = useCallback(
    (entityIndex: number, propertyIndex: number, newName: string) => {
      const oldPropertyName =
        entities[entityIndex]?.properties[propertyIndex]?.name;
      const entityName = entities[entityIndex]?.name;
      if (!oldPropertyName || !entityName) return;

      // Find all components affected by this property rename using the map
      const affectedComponentIds = new Set<string>();
      const ids = entityPathMap.get(`${entityName}>${oldPropertyName}`);
      ids?.forEach((id) => affectedComponentIds.add(id));

      setEntities((prev) =>
        prev.map((entity, i) =>
          i === entityIndex
            ? {
                ...entity,
                properties: entity.properties.map((prop, p) =>
                  p === propertyIndex ? { ...prop, name: newName } : prop
                ),
              }
            : entity
        )
      );

      if (affectedComponentIds.size > 0) {
        setScreens((prevScreens) =>
          prevScreens.map((screen) => ({
            ...screen,
            components: screen.components.map((comp) =>
              updateComponentEntityPathByPropertyRename(
                comp,
                affectedComponentIds,
                entityName,
                oldPropertyName,
                newName
              )
            ),
          }))
        );
      }
    },
    [entities, entityPathMap]
  );

  const updatePropertyType = useCallback(
    (
      entityIndex: number,
      propertyIndex: number,
      newType: "string" | "number" | "entity" | "function",
      newEntityType?: string
    ) => {
      setEntities((prev) =>
        prev.map((entity, i) =>
          i === entityIndex
            ? {
                ...entity,
                properties: entity.properties.map((prop, p) =>
                  p === propertyIndex
                    ? {
                        ...prop,
                        type: newType,
                        entity_type:
                          newType === "entity" ? newEntityType : undefined,
                      }
                    : prop
                ),
              }
            : entity
        )
      );
    },
    []
  );

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
      if (targetId === null) return;
      updateCurrentScreenComponents((comps) => {
        if (
          draggedId === targetId ||
          isDescendantPure(comps, draggedId, targetId)
        ) {
          return comps;
        }
        const { node, newComps } = findAndRemove(comps, draggedId);
        if (!node) {
          throw Error(`component draggedId=${draggedId} not found`);
        }
        if (!findComponent(newComps, targetId)) {
          throw Error(`component targetId=${targetId} not found`);
        }
        const inserted = insert(newComps, targetId, node);
        console.log("move", comps, inserted);
        return inserted;
      });
    },
    [updateCurrentScreenComponents]
  );

  const copyComponent = useCallback(
    (sourceId: string, parentId: string) => {
      const copyRecursive = (
        copied: UIComponent,
        comps: UIComponent[]
      ): UIComponent[] => {
        return comps.map((comp) => {
          if (comp.id === parentId) {
            return {
              ...comp,
              children: [...comp.children, copied],
            };
          }
          return {
            ...comp,
            children: copyRecursive(copied, comp.children),
          };
        });
      };
      updateCurrentScreenComponents((comps) => {
        const source = findComponent(comps, sourceId);
        if (!source) {
          throw Error(
            `component sourceId=${sourceId} not found in ${JSON.stringify(comps)}`
          );
        }
        const copied = deepCopy(source);
        return copyRecursive(copied, comps);
      });
    },
    [updateCurrentScreenComponents]
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
    (id: string, entityPath: string, type?: ComponentType) => {
      const updateComponents = (comps: UIComponent[]): UIComponent[] => {
        return comps.map((comp) => {
          if (comp.id === id) {
            return type !== undefined
              ? { ...comp, entityPath, type }
              : { ...comp, entityPath };
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
    let content: string;
    let filename: string;
    let mimeType: string;

    if (exportFormat === "llm-text") {
      if (exportMode === "screen") {
        const currentComponents = getCurrentComponents();
        content = exportDesignAsLLMText(currentComponents, entities);
      } else {
        content = exportStoryboardAsLLMText(screens, entities);
      }
      filename = "design.md";
      mimeType = "text/markdown";
    } else {
      if (exportMode === "screen") {
        const currentComponents = getCurrentComponents();
        content = exportDesign(currentComponents, entities);
      } else {
        content = exportStoryboard(screens, entities);
      }
      filename = "design.json";
      mimeType = "application/json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [getCurrentComponents, entities, screens, exportMode, exportFormat]);

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

  const placeholderPathTypes: Record<string, "string" | "number"> = {
    ":...": "string",
    ":12...": "number",
  };

  const getPropertyTypeFromPath = (path: string): PropertyType | null => {
    if (path.startsWith(":")) {
      return placeholderPathTypes[path] ?? null;
    }
    const parts = path.split(">");
    let currentEntityName = parts[0];
    for (let i = 1; i < parts.length; i++) {
      const propertyName = parts[i];
      const currentEntity = entities.find((e) => e.name === currentEntityName);
      if (!currentEntity) return null;
      const property = currentEntity.properties.find(
        (p) => p.name === propertyName
      );
      if (!property) return null;
      if (property.type === "entity" && property.entity_type) {
        currentEntityName = property.entity_type;
      } else {
        return property.type;
      }
    }
    return null;
  };

  const handleEntityPathSelect = (entityPath: string) => {
    if (!contextMenu) return;
    const { componentId, pendingComponentType, isUpdate } = contextMenu;

    if (isUpdate) {
      const existingComponent = findComponent(
        getCurrentComponents(),
        componentId
      );
      const propertyType = getPropertyTypeFromPath(entityPath);
      const componentType =
        existingComponent &&
        (existingComponent.type === "text" ||
          existingComponent.type === "number")
          ? propertyType === "number"
            ? "number"
            : propertyType === "string"
              ? "text"
              : undefined
          : undefined;
      updateEntityPath(componentId, entityPath, componentType);
    } else if (pendingComponentType) {
      if (
        pendingComponentType === "text" ||
        pendingComponentType === "number"
      ) {
        const propertyType = getPropertyTypeFromPath(entityPath);
        const componentType = propertyType === "number" ? "number" : "text";
        addComponentToContainer(componentId, componentType, entityPath);
      } else {
        addComponentToContainer(componentId, pendingComponentType, entityPath);
      }
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

  return (
    <ChakraProvider value={defaultSystem}>
      <DndProvider backend={HTML5Backend}>
        <DragManager>
          <Box className="app">
            {previewMode ? (
              <Button
                className="preview-exit-btn"
                onClick={() => setPreviewMode(false)}
                title="Exit preview mode"
                variant="ghost"
                colorScheme="gray"
                size="sm"
              >
                {t("app.exitPreview")}
              </Button>
            ) : (
              <Box as="header" className="header">
                <Box className="screen-name-editor">
                  {isEditingScreenName ? (
                    <Input
                      type="text"
                      defaultValue={getCurrentScreen()?.name || ""}
                      onBlur={handleScreenNameBlur}
                      onKeyDown={handleScreenNameKeyDown}
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
                    title={t("app.undo") + " (Ctrl+Z)"}
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
                    {t("app.undo")}
                  </Button>
                  <Button
                    onClick={redo}
                    disabled={!canRedo}
                    colorScheme="gray"
                    size="sm"
                    title={t("app.redo") + " (Ctrl+Shift+Z)"}
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
                    {t("app.redo")}
                  </Button>
                  <Button
                    onClick={() => setPreviewMode(!previewMode)}
                    colorScheme="blue"
                    size="sm"
                  >
                    {previewMode ? t("app.exitPreview") : t("app.preview")}
                  </Button>
                  <NativeSelect.Root
                    size="sm"
                    width="auto"
                    backgroundColor="white"
                  >
                    <NativeSelect.Field
                      value={language}
                      color="gray.900"
                      onChange={(e) =>
                        setLanguage(e.target.value as "en" | "ja")
                      }
                    >
                      <option value="en">English</option>
                      <option value="ja">日本語</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                  <NativeSelect.Root
                    size="sm"
                    width="auto"
                    backgroundColor="white"
                  >
                    <NativeSelect.Field
                      value={exportMode}
                      color="gray.900"
                      onChange={(e) =>
                        setExportMode(e.target.value as "screen" | "storyboard")
                      }
                    >
                      <option value="storyboard">{t("app.storyboard")}</option>
                      <option value="screen">{t("app.currentScreen")}</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                  <NativeSelect.Root
                    size="sm"
                    width="auto"
                    backgroundColor="white"
                  >
                    <NativeSelect.Field
                      value={exportFormat}
                      color="gray.900"
                      onChange={(e) =>
                        setExportFormat(e.target.value as "json" | "llm-text")
                      }
                    >
                      <option value="json">{t("app.json")}</option>
                      <option value="llm-text">{t("app.llmText")}</option>
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
                    {t("app.export")}
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
                    {t("app.import")}
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
                        previewMode={previewMode}
                      />
                    )
                  )}
                </Box>
                {!previewMode && (
                  <Box className="side-panel">
                    <Box
                      className="side-panel-content"
                      overflowY="auto"
                      height="100%"
                    >
                      <Tabs.Root
                        value={panelType}
                        onValueChange={(details) =>
                          setPanelType(details.value as "entities" | "screens")
                        }
                        variant="subtle"
                      >
                        <Tabs.List>
                          <Tabs.Trigger
                            value="entities"
                            color="gray.300"
                            _selected={{ color: "white", bg: "gray.700" }}
                          >
                            {t("tabs.entities")}
                          </Tabs.Trigger>
                          <Tabs.Trigger
                            value="screens"
                            color="gray.300"
                            _selected={{ color: "white", bg: "gray.700" }}
                          >
                            {t("tabs.screens")}
                          </Tabs.Trigger>
                        </Tabs.List>
                      </Tabs.Root>
                      {panelType === "entities" ? (
                        <EntitiesPanel
                          entities={entities}
                          editingEntityIndex={editingEntityIndex}
                          editingPropertyIndex={editingPropertyIndex}
                          setEditingEntityIndex={setEditingEntityIndex}
                          setEditingPropertyIndex={setEditingPropertyIndex}
                          addEntity={addEntity}
                          deleteEntity={deleteEntity}
                          updateEntityName={updateEntityName}
                          addProperty={addProperty}
                          deleteProperty={deleteProperty}
                          updatePropertyName={updatePropertyName}
                          updatePropertyType={updatePropertyType}
                        />
                      ) : (
                        <ScreensPanel
                          screens={screens}
                          currentScreenId={currentScreenId}
                          setCurrentScreenId={setCurrentScreenId}
                          addScreen={addScreen}
                          copyScreen={copyScreen}
                          deleteScreen={deleteScreen}
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
            {contextMenu &&
              contextMenu.type === "entity-path" &&
              (() => {
                let componentType:
                  | "text"
                  | "number"
                  | "button"
                  | "input"
                  | undefined;
                if (contextMenu.pendingComponentType) {
                  // CREATE flow: use the pending type
                  componentType = contextMenu.pendingComponentType;
                } else {
                  // UPDATE flow: look up existing component's type
                  const existingComp = getCurrentComponents().find(
                    (c) => c.id === contextMenu.componentId
                  );
                  componentType = existingComp?.type as
                    | "text"
                    | "number"
                    | "button"
                    | "input"
                    | undefined;
                }
                return (
                  <EntityPathMenu
                    entities={entities}
                    onSelect={handleEntityPathSelect}
                    onClose={() => setContextMenu(null)}
                    x={contextMenu.x}
                    y={contextMenu.y}
                    componentType={componentType}
                  />
                );
              })()}
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
