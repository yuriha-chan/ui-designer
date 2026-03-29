import React, { createContext, useContext, useState, ReactNode } from "react";

type ContextMenuType = "entity-path" | "container-create";

interface ContextMenu {
  type: ContextMenuType;
  componentId: string;
  x: number;
  y: number;
  pendingComponentType?: "text" | "number" | "button" | "input";
  isUpdate?: boolean;
}

type SetContextMenu = (menu: ContextMenu | null) => void;

const ContextMenuStateContext = createContext<ContextMenu | null>(null);
const ContextMenuDispatchContext = createContext<SetContextMenu>(() => {
  throw new Error("setContextMenu must be used within ContextMenuProvider");
});

export const ContextMenuProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  return (
    <ContextMenuStateContext.Provider value={contextMenu}>
      <ContextMenuDispatchContext.Provider value={setContextMenu}>
        {children}
      </ContextMenuDispatchContext.Provider>
    </ContextMenuStateContext.Provider>
  );
};

export const useContextMenuState = (): ContextMenu | null => {
  return useContext(ContextMenuStateContext);
};

export const useContextMenuDispatch = (): SetContextMenu => {
  return useContext(ContextMenuDispatchContext);
};
