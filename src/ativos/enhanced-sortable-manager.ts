/**
 * Enhanced Sortable Manager with GSAP FLIP Integration
 *
 * Combines SortableJS drag-and-drop functionality with GSAP FLIP animations
 * for premium animation quality while maintaining robust DnD mechanics
 */

import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import Sortable from 'sortablejs';

import { DEFAULT_ATIVOS_OPTIONS } from './config';
import { AtivosCounter } from './counter';
import type { AtivosManagerOptions, SortableEvent } from './types';

// Register GSAP plugins
gsap.registerPlugin(Flip);

export class EnhancedAtivosManager {
  private static instances = new Map<HTMLElement, Sortable>();
  private static options: AtivosManagerOptions = DEFAULT_ATIVOS_OPTIONS;
  private static originalItemsData = new Map<HTMLElement, { parent: HTMLElement; index: number }>();
  private static flipStates = new Map<string, any>();

  /**
   * GSAP FLIP Animation Configuration
   */
  private static flipConfig = {
    duration: 0.6,
    ease: 'power2.out',
    scale: true,
    simple: true,
    // Advanced easing for premium feel
    stagger: 0.05,
    // Smooth morphing between states
    fade: true,
    nested: true,
  };

  /**
   * Initialize the Enhanced Ativos Manager
   */
  public static initialize(customOptions?: Partial<AtivosManagerOptions>): void {
    this.options = { ...DEFAULT_ATIVOS_OPTIONS, ...customOptions };
    this.initializeAllContainers();
    this.setupEventListeners();
    this.setupCleanButton();
    this.setupFlipAnimations();
  }

  /**
   * Setup FLIP animations for smooth transitions
   */
  private static setupFlipAnimations(): void {
    // Create initial FLIP state
    this.captureFlipState('initial');

    // Setup ResizeObserver for responsive animations
    const resizeObserver = new ResizeObserver(() => {
      // Recalculate FLIP states on resize
      this.captureFlipState('resize');
    });

    const containers = document.querySelectorAll('.ativos_main-list, .ativos_main_drop_area');
    containers.forEach((container) => {
      resizeObserver.observe(container);
    });
  }

  /**
   * Capture FLIP state for smooth animations
   */
  private static captureFlipState(stateId: string): void {
    const elements = document.querySelectorAll('.w-dyn-item');
    if (elements.length > 0) {
      this.flipStates.set(stateId, Flip.getState(elements));
    }
  }

  /**
   * Animate to new state using FLIP
   */
  private static animateToState(fromStateId: string, customConfig?: any): void {
    const fromState = this.flipStates.get(fromStateId);
    if (!fromState) return;

    const elements = document.querySelectorAll('.w-dyn-item');
    const config = { ...this.flipConfig, ...customConfig };

    // Enhanced animation with GSAP FLIP
    Flip.from(fromState, {
      ...config,
      onComplete: () => {
        // Cleanup and update counter
        AtivosCounter.updateCounter();

        // Dispatch completion event
        this.dispatchFlipComplete();
      },
    });
  }

  /**
   * Initialize sortable on source containers with FLIP integration
   */
  private static initializeSourceContainer(container: HTMLElement): Sortable | null {
    if (!container || this.instances.has(container)) {
      return this.instances.get(container) || null;
    }

    // Save original items data for clean functionality
    this.saveOriginalItemsData(container);

    const sortable = new Sortable(container, {
      ...this.options.sortableConfig,
      // Disable SortableJS animations - FLIP will handle them
      animation: 0,
      group: {
        name: 'ativos',
        pull: 'clone',
        put: false,
      },
      sort: false,
      filter: '.drop_header_are-wrapper, .ativos_counter-wrapper, .ativos_clean-button',

      onStart: (evt: Sortable.SortableEvent) => {
        // Capture pre-drag state
        this.captureFlipState('preDrag');
        this.handleSortStart(evt);
      },

      onEnd: (evt: Sortable.SortableEvent) => {
        this.handleSortEnd(evt);

        // Handle item visibility after drag
        const isValidDrop =
          evt.to && evt.from !== evt.to && evt.to.matches('.ativos_main_drop_area');
        if (isValidDrop && evt.item && evt.oldIndex !== undefined) {
          // Ensure dropped item is visible
          evt.item.style.opacity = '1';
          evt.item.style.transform = '';
          evt.item.style.display = '';

          // Hide the original item in source
          setTimeout(() => {
            if (evt.oldIndex !== undefined && evt.from.children[evt.oldIndex]) {
              const originalItem = evt.from.children[evt.oldIndex] as HTMLElement;
              originalItem.style.display = 'none';
              originalItem.setAttribute('data-original-hidden', 'true');
            }
          }, 50);
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
   * Initialize drop area with FLIP animations
   */
  private static initializeDropArea(container: HTMLElement): Sortable | null {
    if (!container || this.instances.has(container)) {
      return this.instances.get(container) || null;
    }

    const sortable = new Sortable(container, {
      ...this.options.sortableConfig,
      animation: 0, // FLIP handles animations
      group: {
        name: 'ativos',
        pull: false,
        put: true,
      },
      onAdd: (evt: Sortable.SortableEvent) => {
        // Ensure item is visible and properly positioned
        if (evt.item) {
          evt.item.style.opacity = '1';
          evt.item.style.transform = '';
          evt.item.style.display = '';
        }

        this.handleAdd(evt);
        if (this.options.onAdd) {
          this.options.onAdd(this.createSortableEvent(evt));
        }
      },
      onRemove: (evt: Sortable.SortableEvent) => {
        // Animate removal
        this.animateToState('preAdd', {
          duration: 0.3,
          ease: 'power2.out',
        });

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
   * Initialize all containers with enhanced animations
   */
  private static initializeAllContainers(): void {
    const sourceContainers = document.querySelectorAll<HTMLElement>('.ativos_main-list');
    sourceContainers.forEach((container) => {
      this.initializeSourceContainer(container);
    });

    const mainDropAreas = document.querySelectorAll<HTMLElement>('.ativos_main_drop_area');
    mainDropAreas.forEach((container) => {
      this.initializeDropArea(container);
    });
  }

  /**
   * Enhanced clean all items with smooth FLIP animations
   */
  public static cleanAllItems(): void {
    // Capture current state
    this.captureFlipState('preClean');

    // Show all hidden original items
    const hiddenItems = document.querySelectorAll('[data-original-hidden="true"]');

    // Animate hidden items back to visibility
    hiddenItems.forEach((item, index) => {
      const htmlItem = item as HTMLElement;
      htmlItem.style.display = '';
      htmlItem.removeAttribute('data-original-hidden');

      gsap.fromTo(
        htmlItem,
        {
          opacity: 0,
          scale: 0.8,
          y: 20,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.6,
          ease: 'back.out(1.7)',
          delay: index * 0.05, // Stagger animation
        }
      );
    });

    // Remove items from drop area with smooth animation
    const dropArea = document.querySelector('.ativos_main_drop_area');
    if (dropArea) {
      const dropAreaItems = dropArea.querySelectorAll('.w-dyn-item, [data-ativo-item]');

      // Create staggered exit animation
      gsap.to(dropAreaItems, {
        opacity: 0,
        scale: 0.8,
        y: -30,
        duration: 0.4,
        ease: 'power2.in',
        stagger: 0.05,
        onComplete: () => {
          // Remove elements after animation
          dropAreaItems.forEach((item) => {
            if (item.parentElement) {
              item.parentElement.removeChild(item);
            }
          });

          // Update counter with delay
          setTimeout(() => {
            AtivosCounter.updateCounter();
          }, 100);
        },
      });
    }
  }

  /**
   * Dispatch FLIP animation completion event
   */
  private static dispatchFlipComplete(): void {
    const event = new CustomEvent('flipAnimationComplete', {
      detail: {
        timestamp: Date.now(),
        manager: 'EnhancedAtivosManager',
      },
      bubbles: true,
    });

    document.dispatchEvent(event);
  }

  // ... (inherit all other methods from original AtivosManager)
  private static handleSortStart = (evt: Sortable.SortableEvent): void => {
    const { item } = evt;
    item.classList.add('ativos-dragging');
    document.body.classList.add('ativos-sorting');
  };

  private static handleSortEnd = (evt: Sortable.SortableEvent): void => {
    const { item } = evt;
    item.classList.remove('ativos-dragging');
    document.body.classList.remove('ativos-sorting');
  };

  private static handleAdd = (evt: Sortable.SortableEvent): void => {
    AtivosCounter.updateCounter();
  };

  private static handleRemove = (evt: Sortable.SortableEvent): void => {
    AtivosCounter.updateCounter();
  };

  private static createSortableEvent = (evt: Sortable.SortableEvent): SortableEvent => {
    return {
      oldIndex: evt.oldIndex ?? -1,
      newIndex: evt.newIndex ?? -1,
      item: evt.item,
      from: evt.from,
      to: evt.to,
    };
  };

  private static saveOriginalItemsData = (container: HTMLElement): void => {
    const items = container.querySelectorAll<HTMLElement>('.w-dyn-item, [data-ativo-item]');
    items.forEach((item, index) => {
      this.originalItemsData.set(item, {
        parent: container,
        index,
      });
    });
  };

  private static setupCleanButton = (): void => {
    const cleanButtons = document.querySelectorAll('.ativos_clean-button');
    cleanButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.cleanAllItems();
      });
    });
  };

  private static setupEventListeners = (): void => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.matches(this.options.containerSelector)) {
              this.initializeSortable(element as HTMLElement);
            }
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
  };

  public static initializeSortable = (container: HTMLElement): Sortable | null => {
    if (!container || this.instances.has(container)) {
      return this.instances.get(container) || null;
    }

    if (container.matches('.ativos_main-list')) {
      return this.initializeSourceContainer(container);
    }
    if (container.matches('.ativos_main_drop_area')) {
      return this.initializeDropArea(container);
    }

    return null;
  };

  // Additional utility methods for advanced animations
  public static animateCounter = (newCount: number): void => {
    const counter = document.querySelector('.counter_ativos');
    if (counter) {
      gsap.to(counter, {
        scale: 1.2,
        duration: 0.2,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          counter.textContent = `(${newCount})`;
        },
      });
    }
  };

  public static destroyAll = (): void => {
    this.instances.forEach((sortable) => {
      sortable.destroy();
    });
    this.instances.clear();
    this.flipStates.clear();
  };

  /**
   * Get all sortable instances
   */
  public static getAllSortables(): Map<HTMLElement, Sortable> {
    return new Map(this.instances);
  }

  /**
   * Get sortable instance for a container
   */
  public static getSortable(container: HTMLElement): Sortable | undefined {
    return this.instances.get(container);
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
}
