import React, { useState, useCallback, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";
import { UIComponent, Entity } from "./types";
import { DragManager } from "./DragManager";
import { exportDesign, importDesign } from "./importExport";
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

function App() {
  const [components, setComponents] =
    useState<UIComponent[]>(initialComponents);
  const [entities] = useState<Entity[]>(sampleEntities);
  const fileInputRef = useRef<HTMLInputElement>(null);
  type ContextMenuType = "entity-path" | "container-create";
  const [contextMenu, setContextMenu] = useState<{
    type: ContextMenuType;
    componentId: string;
    x: number;
    y: number;
    pendingComponentType?: "text" | "number" | "button"; // エンティティパス選択待ちのコンポーネントタイプ
  } | null>(null);

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
      return isDescendantPure(components, parentId, childId);
    },
    [components]
  );

  const moveComponent = useCallback(
    (draggedId: string, targetId: string) => {
      console.log(
        `moveComponent: draggedId=${draggedId}, targetId=${targetId}`
      );
      // コンポーネントを移動するロジック
      console.log(
        `findAndRemove: searching for id=${draggedId} in components length=${components.length}`
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

      // ドラッグされたコンポーネントを探して削除
      const { node, newComps } = findAndRemove(components, draggedId);
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
      setComponents(updatedComps);
    },
    [components]
  );

  const copyComponent = useCallback(
    (sourceId: string, parentId: string) => {
      // ソースコンポーネントを探す
      const source = findComponent(components, sourceId);
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

      setComponents(updateComponents(components));
    },
    [components]
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

      setComponents(updateComponents(components));
    },
    [components]
  );

  const addComponentToContainer = useCallback(
    (
      containerId: string,
      type: "container" | "text" | "number" | "button",
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

      setComponents(updateComponents(components));
    },
    [components]
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

      setComponents(updateComponents(components));
    },
    [components]
  );

  const handleExport = useCallback(() => {
    const json = exportDesign(components, entities);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "design.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [components, entities]);

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
          const {
            components: importedComponents,
            entities: _importedEntities,
          } = importDesign(result);
          setComponents(importedComponents);
          // Note: we don't update entities state because it's read-only from sampleEntities
          // In a real app you might want to update entities as well
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
    []
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
    onSelect: (type: "container" | "text" | "number" | "button") => void;
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
    type: "container" | "text" | "number" | "button"
  ) => {
    if (!contextMenu) return;
    const { componentId, x, y } = contextMenu;
    if (type === "container") {
      // コンテナは即時作成
      addComponentToContainer(componentId, type);
      setContextMenu(null);
    } else {
      // テキスト/数字/ボタンはエンティティパス選択メニューを表示
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
    <DndProvider backend={HTML5Backend}>
      <DragManager>
        <div className="app">
          <main className="main">
            <div className="designer">
              <div className="component-tree">
                {sortComponentsBySExpression(components).map((comp) => (
                  <ComponentNode
                    key={comp.id}
                    component={comp}
                    depth={0}
                    parentId={undefined}
                    entities={entities}
                    onCopy={copyComponent}
                    onRemove={removeComponent}
                    onEntityPathChange={updateEntityPath}
                    onMoveComponent={moveComponent}
                    isDescendant={isDescendant}
                    setContextMenu={setContextMenu}
                  />
                ))}
              </div>
              <div className="side-panel">
                <div className="entities-panel">
                  <h4>Entities</h4>
                  <div className="import-export-toolbar">
                    <button className="export-button" onClick={handleExport}>
                      Export Design
                    </button>
                    <button className="import-button" onClick={handleImport}>
                      Import Design
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept=".json,application/json"
                    />
                  </div>
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
              </div>
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
