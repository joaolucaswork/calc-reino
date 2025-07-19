/**
 * Sortable Manager
 *
 * Manages drag and drop functionality using SortableJS
 */

import Sortable from 'sortablejs';

import { DEFAULT_ATIVOS_OPTIONS } from './config';
import { AtivosCounter } from './counter';
import type { AtivosManagerOptions, SortableEvent } from './types';

export class AtivosManager {
  private static instances = new Map<HTMLElement, Sortable>();
  private static options: AtivosManagerOptions = DEFAULT_ATIVOS_OPTIONS;
  private static originalItemsData = new Map<HTMLElement, { parent: HTMLElement; index: number }>();

  /**
   * Initialize the Ativos Manager
   */
  public static initialize(customOptions?: Partial<AtivosManagerOptions>): void {
    this.options = { ...DEFAULT_ATIVOS_OPTIONS, ...customOptions };
    this.initializeAllContainers();
    this.setupDropAreaRedirection();
    this.setupEventListeners();
    this.setupCleanButton();
    this.setupIconVisibility();
  }

  /**
   * Initialize sortable on all containers
   */
  private static initializeAllContainers(): void {
    // Only initialize sortable on .ativos_main-list (source containers)
    const sourceContainers = document.querySelectorAll<HTMLElement>('.ativos_main-list');
    sourceContainers.forEach((container) => {
      this.initializeSourceContainer(container);
    });

    // Initialize drop area to accept items but not allow dragging from it
    const mainDropAreas = document.querySelectorAll<HTMLElement>('.ativos_main_drop_area');
    mainDropAreas.forEach((container) => {
      this.initializeDropArea(container);
    });
  }

  /**
   * Initialize sortable on source containers (.ativos_main-list)
   */
  private static initializeSourceContainer(container: HTMLElement): Sortable | null {
    if (!container || this.instances.has(container)) {
      return this.instances.get(container) || null;
    }

    // Save original items data for clean functionality
    this.saveOriginalItemsData(container);

    const sortable = new Sortable(container, {
      ...this.options.sortableConfig,
      group: {
        name: 'ativos',
        pull: 'clone', // Clone items when dragging (keep original)
        put: false, // Don't allow items to be put back here
      },
      sort: false, // Don't allow sorting within source container
      filter: '.drop_header_are-wrapper, .ativos_counter-wrapper, .ativos_clean-button', // Exclude headers and buttons
      onStart: (evt: Sortable.SortableEvent) => {
        this.handleSortStart(evt);
      },
      onEnd: (evt: Sortable.SortableEvent) => {
        this.handleSortEnd(evt);

        // Only hide the original if the item was actually dropped in a valid target
        const isValidDrop =
          evt.to &&
          evt.from !== evt.to && // Item moved to different container
          (evt.to.matches('.ativos_main_drop_area') || evt.to.matches('.drop_ativos_area-wrapper'));

        if (isValidDrop && evt.item && evt.oldIndex !== undefined) {
          // Hide the original item only when successfully dropped
          const originalItem = evt.from.children[evt.oldIndex] as HTMLElement;
          if (originalItem) {
            originalItem.style.display = 'none';
            originalItem.setAttribute('data-original-hidden', 'true');
          }
        }

        if (this.options.onSort) {
          this.options.onSort(this.createSortableEvent(evt));
        }
      },
    });

    this.instances.set(container, sortable);
    return sortable;
  }

  /**
   * Initialize drop area (.ativos_main_drop_area)
   */
  private static initializeDropArea(container: HTMLElement): Sortable | null {
    if (!container || this.instances.has(container)) {
      return this.instances.get(container) || null;
    }

    const sortable = new Sortable(container, {
      ...this.options.sortableConfig,
      group: {
        name: 'ativos',
        pull: false, // Don't allow dragging from drop area
        put: true, // Allow dropping items here
      },
      onAdd: (evt: Sortable.SortableEvent) => {
        this.handleAdd(evt);
        if (this.options.onAdd) {
          this.options.onAdd(this.createSortableEvent(evt));
        }
      },
      onRemove: (evt: Sortable.SortableEvent) => {
        this.handleRemove(evt);
        if (this.options.onRemove) {
          this.options.onRemove(this.createSortableEvent(evt));
        }
      },
    });

    this.instances.set(container, sortable);
    return sortable;
  }

  /**
   * Setup drop area redirection
   */
  private static setupDropAreaRedirection(): void {
    const dropAreas = document.querySelectorAll<HTMLElement>('.drop_ativos_area-wrapper');

    dropAreas.forEach((dropArea) => {
      // Make drop area sortable to accept items and redirect to main drop area
      const sortable = new Sortable(dropArea, {
        ...this.options.sortableConfig,
        group: {
          name: 'ativos',
          pull: false, // Don't allow pulling from this area
          put: true, // Allow dropping into this area
        },
        onAdd: (evt: Sortable.SortableEvent) => {
          // When item is dropped here, move it to main drop area immediately
          setTimeout(() => {
            this.moveItemToMainDropArea(evt.item);
          }, 0);
        },
      });

      this.instances.set(dropArea, sortable);
    });
  }

  /**
   * Move item to main drop area
   */
  private static moveItemToMainDropArea(item: HTMLElement): void {
    const mainDropArea = document.querySelector('.ativos_main_drop_area');

    if (!mainDropArea || !item) {
      return;
    }

    // Check if item is already in the main drop area
    if (item.closest('.ativos_main_drop_area')) {
      return;
    }

    // Temporarily disable sortable to prevent loops
    const dropAreaWrapper = item.closest('.drop_ativos_area-wrapper');
    let sortableInstance = null;
    if (dropAreaWrapper) {
      sortableInstance = this.instances.get(dropAreaWrapper as HTMLElement);
      if (sortableInstance) {
        sortableInstance.option('disabled', true);
      }
    }

    // Remove from current location safely
    if (item.parentElement) {
      item.parentElement.removeChild(item);
    }

    // Add smooth transition
    item.style.transition = 'all 0.3s ease';
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';

    mainDropArea.appendChild(item);

    // Animate in
    requestAnimationFrame(() => {
      item.style.opacity = '1';
      item.style.transform = 'translateY(0)';
    });

    // Clean up styles and re-enable sortable
    setTimeout(() => {
      item.style.transition = '';
      item.style.opacity = '';
      item.style.transform = '';

      // Re-enable sortable
      if (sortableInstance) {
        sortableInstance.option('disabled', false);
      }

      // Update counter
      AtivosCounter.updateCounter();

      // Dispatch custom event
      const event = new CustomEvent('ativosMovedToMain', {
        detail: { item },
        bubbles: true,
      });
      mainDropArea.dispatchEvent(event);
    }, 350);
  }

  /**
   * Initialize sortable on a specific container
   */
  public static initializeSortable(container: HTMLElement): Sortable | null {
    if (!container || this.instances.has(container)) {
      return this.instances.get(container) || null;
    }

    // Determine container type and use appropriate method
    if (container.matches('.ativos_main-list')) {
      return this.initializeSourceContainer(container);
    }
    if (container.matches('.ativos_main_drop_area')) {
      return this.initializeDropArea(container);
    }

    // For other containers, return null (they shouldn't be sortable)
    return null;
  }

  /**
   * Handle sort start
   */
  private static handleSortStart(evt: Sortable.SortableEvent): void {
    const { item } = evt;

    // Add dragging class to item
    item.classList.add('ativos-dragging');

    // Show icon during drag
    const icon = item.querySelector('.icon-draggable') as HTMLElement;
    if (icon) {
      icon.style.visibility = 'visible';
      icon.style.opacity = '1';
    }

    // Add visual feedback to drop zones
    document.body.classList.add('ativos-sorting');
  }

  /**
   * Handle sort end
   */
  private static handleSortEnd(evt: Sortable.SortableEvent): void {
    const { item } = evt;

    // Remove dragging class from item
    item.classList.remove('ativos-dragging');

    // Hide icon after drag (unless hovering)
    const icon = item.querySelector('.icon-draggable') as HTMLElement;
    if (icon && !item.matches(':hover')) {
      icon.style.visibility = 'hidden';
      icon.style.opacity = '0';
    }

    // Remove visual feedback from drop zones
    document.body.classList.remove('ativos-sorting');

    // Update counter only for items physically in main drop area
    setTimeout(() => {
      AtivosCounter.updateCounter();
    }, 50);

    // Dispatch custom sort event
    this.dispatchSortEvent(evt);
  }

  /**
   * Handle item add
   */
  private static handleAdd(evt: Sortable.SortableEvent): void {
    // Update counter
    AtivosCounter.updateCounter();

    // Dispatch custom add event
    this.dispatchAddEvent(evt);
  }

  /**
   * Handle item remove
   */
  private static handleRemove(evt: Sortable.SortableEvent): void {
    // Update counter
    AtivosCounter.updateCounter();

    // Dispatch custom remove event
    this.dispatchRemoveEvent(evt);
  }

  /**
   * Create a normalized sortable event
   */
  private static createSortableEvent(evt: Sortable.SortableEvent): SortableEvent {
    return {
      oldIndex: evt.oldIndex ?? -1,
      newIndex: evt.newIndex ?? -1,
      item: evt.item,
      from: evt.from,
      to: evt.to,
    };
  }

  /**
   * Setup global event listeners
   */
  private static setupEventListeners(): void {
    // Listen for dynamically added containers
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // Check if the added element is a container
            if (element.matches(this.options.containerSelector)) {
              this.initializeSortable(element as HTMLElement);
            }

            // Check if the added element contains containers
            const containers = element.querySelectorAll<HTMLElement>(
              this.options.containerSelector
            );
            containers.forEach((container) => {
              this.initializeSortable(container);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Dispatch custom sort event
   */
  private static dispatchSortEvent(evt: Sortable.SortableEvent): void {
    const customEvent = new CustomEvent('ativosSort', {
      detail: this.createSortableEvent(evt),
      bubbles: true,
    });

    evt.item.dispatchEvent(customEvent);
  }

  /**
   * Dispatch custom add event
   */
  private static dispatchAddEvent(evt: Sortable.SortableEvent): void {
    const customEvent = new CustomEvent('ativosAdd', {
      detail: this.createSortableEvent(evt),
      bubbles: true,
    });

    evt.to.dispatchEvent(customEvent);
  }

  /**
   * Dispatch custom remove event
   */
  private static dispatchRemoveEvent(evt: Sortable.SortableEvent): void {
    const customEvent = new CustomEvent('ativosRemove', {
      detail: this.createSortableEvent(evt),
      bubbles: true,
    });

    evt.from.dispatchEvent(customEvent);
  }

  /**
   * Destroy sortable instance for a container
   */
  public static destroySortable(container: HTMLElement): void {
    const sortable = this.instances.get(container);
    if (sortable) {
      sortable.destroy();
      this.instances.delete(container);
    }
  }

  /**
   * Destroy all sortable instances
   */
  public static destroyAll(): void {
    this.instances.forEach((sortable) => {
      sortable.destroy();
    });
    this.instances.clear();
  }

  /**
   * Get sortable instance for a container
   */
  public static getSortable(container: HTMLElement): Sortable | undefined {
    return this.instances.get(container);
  }

  /**
   * Get all sortable instances
   */
  public static getAllSortables(): Map<HTMLElement, Sortable> {
    return new Map(this.instances);
  }

  /**
   * Save original items data for clean functionality
   */
  private static saveOriginalItemsData(container: HTMLElement): void {
    const items = container.querySelectorAll<HTMLElement>('.w-dyn-item, [data-ativo-item]');

    items.forEach((item, index) => {
      this.originalItemsData.set(item, {
        parent: container,
        index,
      });
    });
  }

  /**
   * Setup clean button functionality
   */
  private static setupCleanButton(): void {
    const cleanButtons = document.querySelectorAll('.ativos_clean-button');

    cleanButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.cleanAllItems();
      });
    });
  }

  /**
   * Setup icon visibility controls
   */
  private static setupIconVisibility(): void {
    // Handle icon visibility for draggable items
    document.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      const draggableItem = target.closest('.w-dyn-item');

      if (draggableItem && this.isItemInSourceContainer(draggableItem as HTMLElement)) {
        const icon = draggableItem.querySelector('.icon-draggable') as HTMLElement;
        if (icon) {
          icon.style.visibility = 'visible';
          icon.style.opacity = '1';
        }
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target as HTMLElement;
      const draggableItem = target.closest('.w-dyn-item');

      if (draggableItem && !draggableItem.classList.contains('ativos-dragging')) {
        const icon = draggableItem.querySelector('.icon-draggable') as HTMLElement;
        if (icon) {
          icon.style.visibility = 'hidden';
          icon.style.opacity = '0';
        }
      }
    });
  }

  /**
   * Check if item is in a source container
   */
  private static isItemInSourceContainer(item: HTMLElement): boolean {
    return !!item.closest('.ativos_main-list');
  }

  /**
   * Clean all items and return to original positions
   */
  public static cleanAllItems(): void {
    // Show all hidden original items with animation
    const hiddenItems = document.querySelectorAll('[data-original-hidden="true"]');

    hiddenItems.forEach((item) => {
      const htmlItem = item as HTMLElement;
      htmlItem.style.transition = 'all 0.3s ease';
      htmlItem.style.display = '';
      htmlItem.removeAttribute('data-original-hidden');

      // Animate back in
      setTimeout(() => {
        htmlItem.style.opacity = '1';
        htmlItem.style.transform = 'translateY(0)';
      }, 10);
    });

    // Remove all items from drop area with animation
    const dropArea = document.querySelector('.ativos_main_drop_area');
    if (dropArea) {
      const dropAreaItems = dropArea.querySelectorAll('.w-dyn-item, [data-ativo-item]');

      dropAreaItems.forEach((item, index) => {
        const htmlItem = item as HTMLElement;
        htmlItem.style.transition = 'all 0.3s ease';
        htmlItem.style.opacity = '0';
        htmlItem.style.transform = 'translateY(-20px)';

        setTimeout(() => {
          if (htmlItem.parentElement) {
            htmlItem.parentElement.removeChild(htmlItem);
          }

          // Update counter after all items are removed
          if (index === dropAreaItems.length - 1) {
            setTimeout(() => {
              AtivosCounter.updateCounter();
            }, 50);
          }
        }, 300);
      });
    }

    // Update counter immediately to 0
    setTimeout(() => {
      AtivosCounter.updateCounter();
    }, 350);
  }
}
