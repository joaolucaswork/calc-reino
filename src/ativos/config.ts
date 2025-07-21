/**
 * Configuration for Ativos Module
 */

import type { AtivosManagerOptions, SortableConfig } from './types';

/**
 * Default Sortable.js configuration optimized for Webflow
 */
export const DEFAULT_SORTABLE_CONFIG: SortableConfig = {
  animation: 150,
  ghostClass: 'ativos-ghost',
  chosenClass: 'ativos-chosen',
  dragClass: 'ativos-drag',
  forceFallback: false,
  fallbackClass: 'ativos-fallback',
  fallbackOnBody: true,
  swapThreshold: 0.65,
  // Enhanced options for better clone behavior
  removeCloneOnHide: true, // Remove clone when not showing
  dragoverBubble: false, // Prevent event bubbling issues
  emptyInsertThreshold: 5, // Better empty area detection
};

/**
 * Default selectors for Webflow elements
 */
export const DEFAULT_SELECTORS = {
  MAIN_DROP_AREA: '.ativos_main_drop_area',
  CONTAINER: '.ativos_main-list',
  ITEM: '.w-dyn-item',
  COUNTER: '.counter_ativos',
  DROP_AREA: '.drop_ativos_area-wrapper',
} as const;

/**
 * Default manager options
 */
export const DEFAULT_ATIVOS_OPTIONS: AtivosManagerOptions = {
  containerSelector: DEFAULT_SELECTORS.MAIN_DROP_AREA,
  itemSelector: DEFAULT_SELECTORS.ITEM,
  counterSelector: DEFAULT_SELECTORS.COUNTER,
  sortableConfig: DEFAULT_SORTABLE_CONFIG,
};

/**
 * CSS classes for different states
 */
export const CSS_CLASSES = {
  GHOST: 'ativos-ghost',
  CHOSEN: 'ativos-chosen',
  DRAG: 'ativos-drag',
  FALLBACK: 'ativos-fallback',
  EMPTY_STATE: 'ativos-empty',
  HAS_ITEMS: 'ativos-has-items',
} as const;

/**
 * Animation durations
 */
export const ANIMATIONS = {
  SORT_DURATION: 150,
  COUNTER_UPDATE: 200,
  DROP_FEEDBACK: 300,
} as const;
