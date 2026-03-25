import { useSyncExternalStore } from 'react';

type DragState = {
  currentDropTargetId: string | null;
};

let state: DragState = { currentDropTargetId: null };
const listeners = new Set<() => void>();

const notify = () => listeners.forEach(listener => listener());

export const dragStore = {
  getState: () => state,
  setCurrentDropTargetId: (id: string | null) => {
    if (state.currentDropTargetId !== id) {
      state = { ...state, currentDropTargetId: id };
      notify();
    }
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useDragSelector<T>(selector: (state: DragState) => T): T {
  return useSyncExternalStore(
    dragStore.subscribe,
    () => selector(dragStore.getState()),
    () => selector(dragStore.getState())
  );
}
