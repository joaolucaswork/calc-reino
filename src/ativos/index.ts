/**
 * Ativos Module
 *
 * Manages drag and drop functionality for assets using SortableJS
 * Enhanced with GSAP FLIP animations for premium user experience
 */

// Import enhanced styles for GSAP FLIP
import './styles/enhanced-ativos.css';

import { AtivosCounter } from './counter';
// Import enhanced functionality with GSAP FLIP
import { EnhancedAtivosManager } from './enhanced-sortable-manager';
import { WebflowAtivosInit } from './webflow-integration';

// Import configuration and types
export * from './config';
export * from './types';

// Auto-initialize for Webflow with enhanced animations
WebflowAtivosInit.initialize();

// Export enhanced API
export { AtivosCounter, EnhancedAtivosManager as AtivosManager, WebflowAtivosInit };

// Export utilities for advanced usage
export const ativosUtils = {
  /**
   * Get the current number of assets
   */
  getAtivosCount: (): number => {
    return AtivosCounter.getCount();
  },

  /**
   * Update the assets counter
   */
  updateCounter: (count?: number): void => {
    AtivosCounter.updateCounter(count);
  },

  /**
   * Initialize sortable on a specific container
   */
  initializeSortable: (container: HTMLElement): void => {
    EnhancedAtivosManager.initializeSortable(container);
  },

  /**
   * Get all asset items
   */
  getAllAtivos: (): NodeListOf<Element> => {
    return document.querySelectorAll(
      '.ativos_main_drop_area .w-dyn-item, .ativos_main_drop_area [data-ativo-item], .ativos_main-list .w-dyn-item'
    );
  },

  /**
   * Clean all items and return to source (for clean button)
   */
  cleanAllItems: (): void => {
    EnhancedAtivosManager.cleanAllItems();
  },

  /**
   * Get items in main drop area only
   */
  getActiveAtivos: (): NodeListOf<Element> => {
    const mainDropArea = document.querySelector('.ativos_main_drop_area');
    return mainDropArea
      ? mainDropArea.querySelectorAll(':scope > .w-dyn-item, :scope > [data-ativo-item]')
      : document.querySelectorAll(''); // Empty NodeList
  },

  /**
   * Get items in source list only
   */
  getSourceAtivos: (): NodeListOf<Element> => {
    return document.querySelectorAll(
      '.ativos_main-list .w-dyn-item, .ativos_main-list [data-ativo-item]'
    );
  },

  /**
   * Add custom event listeners for Webflow CMS integration
   */
  onItemMoved: (callback: (item: HTMLElement) => void): void => {
    document.addEventListener('ativosMovedToMain', (e) => {
      const customEvent = e as CustomEvent;
      callback(customEvent.detail.item);
    });
  },

  /**
   * Add event listener for counter updates
   */
  onCounterUpdate: (callback: (count: number) => void): void => {
    document.addEventListener('counterUpdate', (e) => {
      const customEvent = e as CustomEvent;
      callback(customEvent.detail.count);
    });
  },

  /**
   * Webflow CMS: Hide source item when moved to active area
   * This is useful when working with Webflow CMS data
   */
  hideSourceItem: (item: HTMLElement): void => {
    const itemId = item.dataset.id || item.getAttribute('data-id');
    const sourceItems = document.querySelectorAll('.ativos_main-list .w-dyn-item');

    sourceItems.forEach((sourceItem) => {
      const sourceId = (sourceItem as HTMLElement).dataset.id || sourceItem.getAttribute('data-id');

      // Match by ID or by text content if no ID available
      if (
        (itemId && sourceId && itemId === sourceId) ||
        (!itemId && !sourceId && item.textContent?.trim() === sourceItem.textContent?.trim())
      ) {
        (sourceItem as HTMLElement).style.display = 'none';
        sourceItem.setAttribute('data-original-hidden', 'true');
      }
    });
  },

  /**
   * Webflow CMS: Show all hidden source items
   */
  showAllSourceItems: (): void => {
    const hiddenItems = document.querySelectorAll('[data-original-hidden="true"]');
    hiddenItems.forEach((item) => {
      (item as HTMLElement).style.display = '';
      item.removeAttribute('data-original-hidden');
    });
  },
};
