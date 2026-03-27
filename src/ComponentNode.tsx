import React, { useCallback, useEffect, useContext } from "react";
import { useDrag, useDrop, DropTargetMonitor } from "react-dnd";
import { UIComponent, Entity } from "./types";
import { DragItem, ItemTypes, DropResult } from "./dnd";
import { dragStore, useDragSelector } from "./dragStore";
import { DragContext } from "./DragManager";
import {
  getColorForComponent,
  sortComponentsBySExpression,
  parseEntityPath,
} from "./componentTree";

const ComponentNode: React.FC<{
  component: UIComponent;
  depth: number;
  parentId?: string;
  entities: Entity[];
  onCopy: (sourceId: string, parentId: string) => void;
  onRemove: (id: string) => void;
  onEntityPathChange: (id: string, entityPath: string) => void;
  onMoveComponent: (draggedId: string, targetId: string) => void;
  isDescendant: (parentId: string, childId: string) => boolean;
  setContextMenu: (
    menu: {
      type: "entity-path" | "container-create";
      componentId: string;
      x: number;
      y: number;
    } | null
  ) => void;
}> = React.memo(
  ({
    component,
    depth,
    parentId,
    entities,
    onCopy,
    onRemove,
    onEntityPathChange,
    onMoveComponent,
    isDescendant,
    setContextMenu,
  }) => {
    const color = getColorForComponent(component.type, depth);
    const { entity, property } = parseEntityPath(component.entityPath);

    useEffect(() => {
      console.log(
        `ComponentNode ${component.id} mounted, type=${component.type}, parentId=${parentId || "root"}`
      );
      return () => {
        console.log(`ComponentNode ${component.id} unmounted`);
      };
    }, [component.id, component.type, parentId]);

    const { setRawDropTargetId } = useContext(DragContext)!;

    const [{ isDragging }, drag] = useDrag(
      () => ({
        type: ItemTypes.COMPONENT,
        item: () => {
          console.log(
            `ComponentNode ${component.id}: drag item created, actual parentId=${parentId || "none"}`
          );
          return {
            type: ItemTypes.COMPONENT,
            component,
            parentId: parentId,
          } as DragItem;
        },
        collect: (monitor) => {
          const dragging = monitor.isDragging();
          return {
            isDragging: dragging,
          };
        },
        end: (item, monitor) => {
          const dropResult = monitor.getDropResult<DropResult>();
          console.log(
            `ComponentNode ${component.id}: drag end, dropResult=`,
            dropResult,
            "item=",
            item
          );
          if (dropResult && dropResult.dropped) {
            console.log(
              `ComponentNode ${component.id}: moving component to target ${dropResult.targetId}`
            );
            onMoveComponent(item.component.id, dropResult.targetId);
          } else {
            console.log(
              `ComponentNode ${component.id}: dropResult invalid or missing`
            );
          }
          setRawDropTargetId(null);
        },
      }),
      [component.id, component.type, parentId, onMoveComponent]
    );

    const isOver = useDragSelector(
      (state) => state.currentDropTargetId === component.id
    );

    // ドロップ可能にする
    const isContainer = component.type === "container";
    console.log(
      `ComponentNode ${component.id}: useDrop hook called, isContainer=${isContainer}, parentId=${parentId || "none"}`
    );
    const [{ canDrop }, drop] = useDrop(() => {
      const isContainer = component.type === "container";
      return {
        accept: ItemTypes.COMPONENT,
        canDrop: (item) => {
          // Prevent dragging a container into its own descendant
          if (
            item.component.type === "container" &&
            isDescendant(item.component.id, component.id)
          ) {
            console.log(
              `ComponentNode ${component.id}: canDrop false - would create cycle (descendant)`
            );
            return false;
          }

          // For non-container components, allow drop only if they have a parent (will route to parent)
          if (!isContainer) {
            if (!parentId) {
              console.log(
                `ComponentNode ${component.id}: canDrop false - non-container has no parent`
              );
              return false;
            }
            console.log(
              `ComponentNode ${component.id}: canDrop true - non-container will route to parent ${parentId}`
            );
            return true;
          }

          if (item.component.id === component.id) {
            console.log(
              `ComponentNode ${component.id}: canDrop false - dropping onto itself`
            );
            return false;
          }

          return true;
        },

        hover: (_item, monitor) => {
          if (monitor.isOver({ shallow: true })) {
            let targetId = component.id;
            // For non-containers, route hover to parent
            if (!isContainer && parentId) {
              targetId = parentId;
            }
            console.log(
              `ComponentNode ${component.id}: setting currentDropTargetId=${targetId}`
            );
            setRawDropTargetId(targetId);
          }
        },
        drop: (item: DragItem) => {
          console.log(
            `ComponentNode ${component.id}: drop called for item ${item.component.id}`
          );
          return {
            dropped: true,
            targetId: dragStore.getState().currentDropTargetId,
          } as DropResult;
        },
        collect: (monitor: DropTargetMonitor<DragItem, DropResult>) => {
          const canDropValue = monitor.canDrop();
          return {
            canDrop: canDropValue,
          };
        },
      };
    }, [component.id, component.type, parentId, isDescendant]);

    // dragとdropを同じ要素に適用（dropはコンテナのみ）
    const dragDropRef = useCallback(
      (el: HTMLDivElement | null) => {
        console.log(
          `ComponentNode ${component.id}: dragDropRef called with el=${el ? "HTMLDivElement" : "null"}`
        );
        drag(el);
        drop(el);
      },
      [drag, drop, component.id]
    );

    const handleCopy = () => {
      if (parentId) {
        onCopy(component.id, parentId);
      } else {
        // Root components cannot be copied (no parent)
        throw new Error("Cannot copy root component");
      }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const menuType =
        component.type === "container" ? "container-create" : "entity-path";
      setContextMenu({
        type: menuType,
        componentId: component.id,
        x: e.clientX,
        y: e.clientY,
      });
    };

    // TODO
    const cursorClass = "cursor-default";

    return (
      <div className="component-node">
        <div
          ref={dragDropRef}
          className={`component-box ${cursorClass} depth-${depth} component-${component.type}`}
          onContextMenu={handleContextMenu}
          style={{
            backgroundColor: color,
            opacity: isDragging ? 0.5 : 1,
            transition: "all 0.2s ease",
          }}
        >
          <div className="component-content">
            {component.type !== "container" && (
              <div className="entity-path-display">
                <div className="entity-label">{entity}</div>
                {property && <div className="property-label">{property}</div>}
              </div>
            )}
          </div>
          {component.type === "container" && isOver && canDrop && (
            <div className="insertion-preview" />
          )}
          {parentId && (
            <div className="component-actions">
              <button onClick={handleCopy} title="Copy">
                ⎘
              </button>
              <button onClick={() => onRemove(component.id)} title="Remove">
                ×
              </button>
            </div>
          )}
          {component.type === "container" && component.children.length > 0 && (
            <div className="children-container">
              {sortComponentsBySExpression(component.children).map((child) => (
                <ComponentNode
                  key={child.id}
                  component={child}
                  depth={depth + 1}
                  parentId={component.id}
                  entities={entities}
                  onCopy={onCopy}
                  onRemove={onRemove}
                  onEntityPathChange={onEntityPathChange}
                  onMoveComponent={onMoveComponent}
                  isDescendant={isDescendant}
                  setContextMenu={setContextMenu}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev === next ||
    Object.keys(prev).every(
      (k) => prev[k as keyof typeof prev] === next[k as keyof typeof prev]
    )
);

export { ComponentNode };
