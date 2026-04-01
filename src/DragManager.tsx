import { useState, useEffect, createContext, ReactNode } from "react";
import { useThrottle } from "@uidotdev/usehooks";
import { dragStore } from "./dragStore";

export const DragContext = createContext<{
  setRawDropTargetId: (id: string | null) => void;
} | null>(null);

export function DragManager({ children }: { children: ReactNode }) {
  const [rawDropTargetId, setRawDropTargetId] = useState<string | null>(null);
  const throttledId = useThrottle(rawDropTargetId, 100);

  useEffect(() => {
    dragStore.setCurrentDropTargetId(throttledId);
  }, [throttledId]);

  return (
    <DragContext.Provider value={{ setRawDropTargetId }}>
      {children}
    </DragContext.Provider>
  );
}
