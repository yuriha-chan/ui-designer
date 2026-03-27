import React, { useState, useCallback, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";
import { UIComponent, Entity, Screen } from "./types";
import { DragManager } from "./DragManager";
import { exportDesign, exportStoryboard, importDesign } from "./importExport";
import {
  sortComponentsBySExpression,
  isDescendant as isDescendantPure,
  findAndRemove,
  findComponent,
  deepCopy,
} from "./componentTree";
import { ComponentNode } from "./ComponentNode";
import "./App.css";

// サンプルエンティティ定義
const sampleEntities: Entity[] = [
  { name: "Account", properties: ["Name", "Email", "Balance", "Status"] },
  { name: "Product", properties: ["Title", "Price", "Stock", "Category"] },
  { name: "Order", properties: ["ID", "Date", "Total", "Status"] },
  { name: "User", properties: ["Username", "Role", "LastLogin"] },
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

function App() {
  // ストーリーボード状態
  const [screens, setScreens] = useState<Screen[]>(initialScreens);
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

  // 現在の画面のコンポーネントを更新するヘルパー関数
  const updateCurrentScreenComponents = useCallback(
    (updater: (components: UIComponent[]) => UIComponent[]) => {
      setScreens((prevScreens) =>
        prevScreens.map((screen) =>
          screen.id === currentScreenId
            ? { ...screen, components: updater(screen.components) }
            : screen
        )
      );
    },
    [currentScreenId]
  );

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

  useEffect(() => {
    console.log("App mounted");
    return () => console.log("App unmounted");
  }, []);

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
    const [expandedEntity, setExpandedEntity] = useState<string | null>(null);

    return (
      <div
        className="context-menu entity-path-menu"
        style={{ left: x, top: y }}
      >
        <div className="menu-header">
          <h5>Select Entity Path</h5>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="accordion">
          <div className="accordion-item" onClick={() => onSelect("")}>
            <div className="accordion-title">...</div>
            <div className="accordion-content">Clear entity path</div>
          </div>
          {entities.map((entity) => (
            <div key={entity.name} className="accordion-item">
              <div
                className="accordion-title"
                onClick={() =>
                  setExpandedEntity(
                    expandedEntity === entity.name ? null : entity.name
                  )
                }
              >
                {entity.name}
                <span className="accordion-icon">
                  {expandedEntity === entity.name ? "−" : "+"}
                </span>
              </div>
              {expandedEntity === entity.name && (
                <div className="accordion-content">
                  {entity.properties.map((property) => (
                    <div
                      key={property}
                      className="property-option"
                      onClick={() => onSelect(`${entity.name}>${property}`)}
                    >
                      {property}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
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
      <div
        className="context-menu container-context-menu"
        style={{ left: x, top: y }}
      >
        <div className="menu-header">
          <h5>Add Component</h5>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="menu-options">
          <div className="menu-option" onClick={() => onSelect("container")}>
            <div className="option-icon">□</div>
            <div className="option-label">Container</div>
          </div>
          <div className="menu-option" onClick={() => onSelect("text")}>
            <div className="option-icon" style={{ color: "#3b82f6" }}>
              T
            </div>
            <div className="option-label">Text</div>
          </div>
          <div className="menu-option" onClick={() => onSelect("number")}>
            <div className="option-icon" style={{ color: "#10b981" }}>
              #
            </div>
            <div className="option-label">Number</div>
          </div>
          <div className="menu-option" onClick={() => onSelect("button")}>
            <div className="option-icon" style={{ color: "#ef4444" }}>
              B
            </div>
            <div className="option-label">Button</div>
          </div>
          <div className="menu-option" onClick={() => onSelect("input")}>
            <div className="option-icon" style={{ color: "#8b5cf6" }}>
              I
            </div>
            <div className="option-label">Input</div>
          </div>
        </div>
      </div>
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
  const PreviewView: React.FC = () => {
    const currentComponents = getCurrentComponents();
    const currentScreen = getCurrentScreen();

    const handleButtonClick = (component: UIComponent) => {
      if (component.type === "button" && component.targetScreen) {
        setCurrentScreenId(component.targetScreen);
      }
    };

    const renderPreviewComponent = (
      comp: UIComponent,
      depth: number = 0
    ): JSX.Element => {
      const color =
        comp.type === "container"
          ? "#2a2a2a"
          : comp.type === "text"
            ? "#3b82f6"
            : comp.type === "number"
              ? "#10b981"
              : comp.type === "button"
                ? "#ef4444"
                : "#8b5cf6";

      return (
        <div
          key={comp.id}
          className={`preview-component ${comp.type}`}
          style={{
            marginLeft: depth * 20,
            padding: "8px",
            border: `1px solid ${color}`,
            borderRadius: "4px",
            backgroundColor: "#2a2a2a",
            cursor: comp.type === "button" ? "pointer" : "default",
          }}
          onClick={() => comp.type === "button" && handleButtonClick(comp)}
        >
          <div className="preview-component-label">
            {comp.type}: {comp.entityPath || comp.targetScreen || ""}
          </div>
          {comp.type === "container" && comp.children.length > 0 && (
            <div className="preview-children">
              {comp.children.map((child) =>
                renderPreviewComponent(child, depth + 1)
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="preview-view">
        <div className="preview-header">
          <h2>{currentScreen?.name || "Preview"}</h2>
        </div>
        <div className="preview-components">
          {currentComponents.map((comp) => renderPreviewComponent(comp))}
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <DragManager>
        <div className="app">
          {previewMode ? (
            <button
              className="preview-close-button"
              onClick={() => setPreviewMode(false)}
              title="Exit preview mode"
            >
              {" "}
              ×{" "}
            </button>
          ) : (
            <header className="header">
              <div className="screen-name-editor">
                {isEditingScreenName ? (
                  <input
                    type="text"
                    value={editingScreenName}
                    onChange={(e) => setEditingScreenName(e.target.value)}
                    onBlur={handleScreenNameBlur}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleScreenNameBlur()
                    }
                    autoFocus
                  />
                ) : (
                  <h1 onClick={() => startEditingScreenName()}>
                    {getCurrentScreen()?.name || "Untitled"}
                  </h1>
                )}
              </div>
              <div className="menu-bar">
                <button
                  className="preview-button"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? "Exit Preview" : "Preview"}
                </button>
                <select
                  value={exportMode}
                  onChange={(e) =>
                    setExportMode(e.target.value as "screen" | "storyboard")
                  }
                >
                  <option value="screen">Current Screen</option>
                  <option value="storyboard">Storyboard</option>
                </select>
                <button className="export-button" onClick={handleExport}>
                  Export
                </button>
                <button className="import-button" onClick={handleImport}>
                  Import
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept=".json,application/json"
                />
              </div>
            </header>
          )}
          <main className="main">
            <div className={previewMode ? "preview" : "designer"}>
              <div className="component-tree">
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
              </div>
              {!previewMode && (
                <div className="side-panel">
                  <div className="side-panel-content">
                    <div className="panel-switcher">
                      <button
                        className={panelType === "entities" ? "active" : ""}
                        onClick={() => setPanelType("entities")}
                      >
                        Entities
                      </button>
                      <button
                        className={panelType === "screens" ? "active" : ""}
                        onClick={() => setPanelType("screens")}
                      >
                        Screens
                      </button>
                    </div>
                    {panelType === "entities" ? (
                      <div className="entities-panel">
                        <div className="entities-list">
                          {entities.map((entity) => (
                            <div key={entity.name} className="entity">
                              <div className="entity-name">{entity.name}</div>
                              <div className="entity-properties">
                                {entity.properties.map((prop) => (
                                  <div key={prop} className="entity-property">
                                    {entity.name} &gt; {prop}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="screens-panel">
                        <div className="add-screen-form">
                          <input
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
                          />
                          <button
                            onClick={() => {
                              const input = document.querySelector(
                                ".add-screen-form input"
                              ) as HTMLInputElement;
                              if (input && input.value.trim()) {
                                addScreen(input.value.trim());
                                input.value = "";
                              }
                            }}
                          >
                            Add
                          </button>
                        </div>
                        <div className="screens-list">
                          {screens.map((screen) => (
                            <div
                              key={screen.id}
                              className={`screen-item ${screen.id === currentScreenId ? "active" : ""}`}
                            >
                              <div
                                className="screen-name"
                                onClick={() => setCurrentScreenId(screen.id)}
                              >
                                {screen.name}
                              </div>
                              <div className="screen-actions">
                                <button
                                  className="copy-btn"
                                  onClick={() => copyScreen(screen.id)}
                                  title="Copy screen"
                                >
                                  📋
                                </button>
                                <button
                                  className="delete-btn"
                                  onClick={() => deleteScreen(screen.id)}
                                  title="Delete screen"
                                  disabled={screens.length <= 1}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
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
        </div>
      </DragManager>
    </DndProvider>
  );
}

export default App;
