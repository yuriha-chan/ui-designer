import React, { useCallback, useEffect, useContext } from "react";
import { Box, NativeSelect, Button } from "@chakra-ui/react";
import { useDrag, useDrop, DropTargetMonitor } from "react-dnd";
import { UIComponent, Entity, Screen } from "./types";
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
  screens: Screen[];
  onCopy: (sourceId: string, parentId: string) => void;
  onRemove: (id: string) => void;
  onEntityPathChange: (id: string, entityPath: string) => void;
  onTargetScreenChange: (id: string, targetScreen: string) => void;
  onButtonClick?: (id: string) => void;
  onMoveComponent: (draggedId: string, targetId: string) => void;
  isDescendant: (parentId: string, childId: string) => boolean;
  setContextMenu: (
    menu: {
      type: "entity-path" | "container-create";
      componentId: string;
      x: number;
      y: number;
      pendingComponentType?: "text" | "number" | "button" | "input";
    } | null
  ) => void;
  previewMode?: boolean;
}> = React.memo(
  ({
    component,
    depth,
    parentId,
    entities,
    screens,
    onCopy,
    onRemove,
    onEntityPathChange,
    onTargetScreenChange,
    onButtonClick,
    onMoveComponent,
    isDescendant,
    setContextMenu,
    previewMode = false,
  }) => {
    const color = getColorForComponent(component.type, depth);
    const { entity, property, pathParts } = parseEntityPath(
      component.entityPath
    );
    const targetScreenName = component.targetScreen
      ? screens.find((s) => s.id === component.targetScreen)?.name
      : null;

    useEffect(() => {
      console.log(
        `ComponentNode ${component.id} mounted, type=${component.type}, parentId=${parentId || "root"}`
      );
      return () => {
        console.log(`ComponentNode ${component.id} unmounted`);
      };
    }, [component.id, component.type, parentId]);

    const { setRawDropTargetId } = useContext(DragContext)!;

    // Drag and drop hooks - always called but conditionally enabled
    const [{ isDragging: dragging }, drag] = useDrag(
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
        collect: (monitor) => ({
          isDragging: monitor.isDragging(),
        }),
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
        canDrag: !previewMode,
      }),
      [component.id, component.type, parentId, onMoveComponent, previewMode]
    );
    const isDragging = dragging;
    const dragRef = drag;

    const [{ canDrop: canDropValue }, drop] = useDrop(() => {
      const isContainer = component.type === "container";
      return {
        accept: ItemTypes.COMPONENT,
        canDrop: (item) => {
          if (previewMode) return false;
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
          if (previewMode) return;
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
          if (previewMode) return undefined;
          console.log(
            `ComponentNode ${component.id}: drop called for item ${item.component.id}`
          );
          return {
            dropped: true,
            targetId: dragStore.getState().currentDropTargetId,
          } as DropResult;
        },
        collect: (monitor: DropTargetMonitor<DragItem, DropResult>) => ({
          canDrop: monitor.canDrop(),
        }),
      };
    }, [component.id, component.type, parentId, isDescendant, previewMode]);
    const canDrop = canDropValue;
    const dropRef = drop;

    // Combined ref for drag and drop
    const dragDropRef = useCallback(
      (el: HTMLDivElement | null) => {
        console.log(
          `ComponentNode ${component.id}: dragDropRef called with el=${el ? "HTMLDivElement" : "null"}`
        );
        dragRef(el);
        dropRef(el);
      },
      [dragRef, dropRef, component.id]
    );

    const isOver = useDragSelector(
      (state) => state.currentDropTargetId === component.id
    );

    const handleCopy = () => {
      if (parentId) {
        onCopy(component.id, parentId);
      } else {
        // Root components cannot be copied (no parent)
        throw new Error("Cannot copy root component");
      }
    };

    const handleButtonClick = () => {
      if (previewMode && component.type === "button" && onButtonClick) {
        onButtonClick(component.id);
      }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (component.type === "container") {
        setContextMenu({
          type: "container-create",
          componentId: component.id,
          x: e.clientX,
          y: e.clientY,
        });
      } else {
        setContextMenu({
          type: "entity-path",
          componentId: component.id,
          x: e.clientX,
          y: e.clientY,
        });
      }
    };

    const cursorClass =
      previewMode && component.type === "button"
        ? "cursor-pointer"
        : "cursor-default";

    const isRoot = depth === 0;

    return (
      <Box className="component-node">
        <Box
          ref={dragDropRef}
          className={`component-box ${cursorClass} depth-${depth} component-${component.type}`}
          onContextMenu={previewMode ? undefined : handleContextMenu}
          onClick={handleButtonClick}
          style={{
            backgroundColor: color,
            opacity: isDragging ? 0.5 : 1,
            transition: "all 0.2s ease",
            ...(isRoot && { minHeight: "100vh", height: "100%" }),
          }}
        >
          <Box className="component-content">
            {component.type !== "container" && (
              <Box className="entity-path-display">
                {pathParts.length > 2 ? (
                  <>
                    <Box className="entity-label">
                      {pathParts.slice(0, -1).map((part, idx) => (
                        <React.Fragment key={idx}>
                          {idx > 0 && " > "}
                          <Box
                            as="span"
                            className={
                              idx === 0 ? "path-entity" : "path-property"
                            }
                          >
                            {part}
                          </Box>
                        </React.Fragment>
                      ))}
                    </Box>
                    <Box className="property-label">{property}</Box>
                  </>
                ) : (
                  <>
                    <Box className="entity-label">{entity}</Box>
                    {property && (
                      <Box className="property-label">{property}</Box>
                    )}
                  </>
                )}
              </Box>
            )}
            {!previewMode && component.type === "button" && (
              <Box className="target-screen-selector">
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={component.targetScreen || ""}
                    onChange={(e) =>
                      onTargetScreenChange(component.id, e.target.value)
                    }
                    bg="white"
                    color="gray.800"
                    title={
                      targetScreenName
                        ? `Target: ${targetScreenName}`
                        : "Select target screen"
                    }
                  >
                    <option value="">Select target screen</option>
                    {screens.map((screen) => (
                      <option key={screen.id} value={screen.id}>
                        {screen.name}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Box>
            )}
            {previewMode && component.type === "button" && targetScreenName && (
              <Box className="target-screen-display">→ {targetScreenName}</Box>
            )}
          </Box>
          {component.type === "container" && isOver && canDrop && (
            <Box className="insertion-preview" />
          )}
          {!previewMode && parentId && (
            <Box className="component-actions">
              <Button
                onClick={handleCopy}
                title="Copy"
                variant="ghost"
                size="xs"
              >
                ⎘
              </Button>
              <Button
                onClick={() => onRemove(component.id)}
                title="Remove"
                variant="ghost"
                size="xs"
              >
                ×
              </Button>
            </Box>
          )}
          {component.type === "container" && component.children.length > 0 && (
            <Box className="children-container">
              {sortComponentsBySExpression(component.children).map((child) => (
                <ComponentNode
                  key={child.id}
                  component={child}
                  depth={depth + 1}
                  parentId={component.id}
                  entities={entities}
                  screens={screens}
                  onCopy={onCopy}
                  onRemove={onRemove}
                  onEntityPathChange={onEntityPathChange}
                  onTargetScreenChange={onTargetScreenChange}
                  onButtonClick={onButtonClick}
                  onMoveComponent={onMoveComponent}
                  isDescendant={isDescendant}
                  setContextMenu={setContextMenu}
                  previewMode={previewMode}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    );
  },
  (prev, next) =>
    prev === next ||
    Object.keys(prev).every(
      (k) => prev[k as keyof typeof prev] === next[k as keyof typeof prev]
    )
);

export { ComponentNode };
