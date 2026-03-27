// Mock for react-dnd
import React, { ReactNode } from "react";

// Mock DndProvider - just passes children through
export const DndProvider = ({
  children,
  backend,
}: {
  children: ReactNode;
  backend: any;
}) => {
  return React.createElement(React.Fragment, null, children);
};

// Mock useDrag
export const useDrag = () => {
  return [{ isDragging: false }, () => {}];
};

// Mock useDrop
export const useDrop = () => {
  return [{ canDrop: false }, () => {}];
};

// Mock DropTargetMonitor (empty object)
export const DropTargetMonitor = {};
