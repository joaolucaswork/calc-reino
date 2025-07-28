/**
 * Types for Ativos Module
 */

export interface AtivoItem {
  id: string;
  element: HTMLElement;
  data?: Record<string, unknown>;
}

export interface SortableConfig {
  animation: number;
  ghostClass: string;
  chosenClass: string;
  dragClass: string;
  forceFallback: boolean;
  fallbackClass: string;
  fallbackOnBody: boolean;
  swapThreshold: number;
  // Enhanced options for better clone behavior
  removeCloneOnHide?: boolean;
  dragoverBubble?: boolean;
  emptyInsertThreshold?: number;
}

export interface AtivosManagerOptions {
  containerSelector: string;
  itemSelector: string;
  counterSelector: string;
  sortableConfig?: Partial<SortableConfig>;
  onSort?: (event: SortableEvent) => void;
  onAdd?: (event: SortableEvent) => void;
  onRemove?: (event: SortableEvent) => void;
}

export interface SortableEvent {
  oldIndex: number;
  newIndex: number;
  item: HTMLElement;
  from: HTMLElement;
  to: HTMLElement;
}

export interface CounterUpdateEvent {
  count: number;
  container: HTMLElement;
}
