import React, { ReactElement } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { render, RenderOptions } from "@testing-library/react";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { DragManager } from "../../DragManager";
import { ContextMenuProvider } from "../../ContextMenuContext";

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <ChakraProvider value={defaultSystem}>
        <DragManager>
          <ContextMenuProvider>{children}</ContextMenuProvider>
        </DragManager>
      </ChakraProvider>
    </DndProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
