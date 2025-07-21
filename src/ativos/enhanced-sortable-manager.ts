/**
 * Lightweight Sortable Manager
 *
 * Simplified drag-and-drop functionality using SortableJS
 * Optimized for performance with minimal animations
 */

import Sortable from 'sortablejs';

import { DEFAULT_ATIVOS_OPTIONS } from './config';
import { ContextMenuService } from './context-menu';
import { AtivosCounter } from './counter';
import { DropAreaPersistence } from './drop-area-persistence';
import { NotificationService } from './notification-service';
import type { AtivosManagerOptions, SortableEvent } from './types';

export class EnhancedAtivosManager {
  private static instances = new Map<HTMLElement, Sortable>();
  private static options: AtivosManagerOptions = DEFAULT_ATIVOS_OPTIONS;
  private static originalItemsData = new Map<HTMLElement, { parent: HTMLElement; index: number }>();

  /**
   * Initialize the Ativos Manager
   */
  public static initialize(customOptions?: Partial<AtivosManagerOptions>): void {
    this.options = { ...DEFAULT_ATIVOS_OPTIONS, ...customOptions };

    // Initialize notification service
    NotificationService.initialize();

    // Initialize context menu service
    ContextMenuService.initialize();

    this.initializeAllContainers();
    this.setupEventListeners();
    this.setupCleanButton();
    this.setupAddAssetButton();
    this.setupAddAssetInput();
    this.setupWebflowAdicionarButton();
    this.setupClickToAddFunctionality();
    this.setupAdicionarToggle();

    // Set initial state for source containers and load persisted assets
    setTimeout(() => {
      this.updateSourceContainerState();
      this.loadPersistedAssets();
      // Load drop area items after other assets are loaded
      DropAreaPersistence.loadDropAreaItems();
    }, 100);
  }

  /**
   * Initialize sortable on source containers
   */
  private static initializeSourceContainer(container: HTMLElement): Sortable | null {
    if (!container || this.instances.has(container)) {
      return this.instances.get(container) || null;
    }

    // Save original items data for clean functionality
    this.saveOriginalItemsData(container);

    const sortable = new Sortable(container, {
      ...this.options.sortableConfig,
      // Minimal animations for performance
      animation: 150,
      group: 'shared', // Allow items to move between source and drop areas
      sort: false, // Don't allow sorting within source container
      filter:
        '.drop_header_are-wrapper, .ativos_counter-wrapper, .ativos_clean-button, #adicionarAtivo',

      onStart: (evt: Sortable.SortableEvent) => {
        this.handleSortStart(evt);
      },

      onEnd: this.handleSortEnd,
    });

    this.instances.set(container, sortable);
    return sortable;
  }

  /**
   * Initialize drop area
   */
  private static initializeDropArea(container: HTMLElement): Sortable | null {
    if (!container || this.instances.has(container)) {
      return this.instances.get(container) || null;
    }

    const sortable = new Sortable(container, {
      ...this.options.sortableConfig,
      animation: 150,
      group: 'shared', // Allow items to move between source and drop areas
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
        this.handleRemove();
        if (this.options.onRemove) {
          this.options.onRemove(this.createSortableEvent(evt));
        }
      },
    });

    this.instances.set(container, sortable);
    return sortable;
  }

  /**
   * Initialize all containers
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
   * Clean all items - restore items to their exact original positions
   */
  public static cleanAllItems(): void {
    // Get all items currently in drop areas
    const dropArea = document.querySelector('.ativos_main_drop_area');
    if (!dropArea) return;

    const dropAreaItems = Array.from(
      dropArea.querySelectorAll<HTMLElement>('.w-dyn-item, [data-ativo-item]')
    );

    // Group items by their original containers for batch processing
    const itemsByContainer = new Map<
      HTMLElement,
      Array<{ item: HTMLElement; originalIndex: number }>
    >();

    dropAreaItems.forEach((item) => {
      // Check if this is a new custom asset
      if (item.hasAttribute('data-new-asset')) {
        // Move new assets to the first available source container
        const sourceContainer = document.querySelector('.ativos_main-list');
        if (sourceContainer) {
          // Add to container but before the #adicionarAtivo button
          const addButton = sourceContainer.querySelector('#adicionarAtivo');
          if (addButton) {
            sourceContainer.insertBefore(item, addButton);
          } else {
            sourceContainer.appendChild(item);
          }
        }
      } else {
        // Handle original assets with their saved positions
        const originalData = this.originalItemsData.get(item);
        if (originalData && originalData.parent) {
          if (!itemsByContainer.has(originalData.parent)) {
            itemsByContainer.set(originalData.parent, []);
          }
          itemsByContainer.get(originalData.parent)!.push({
            item,
            originalIndex: originalData.index,
          });
        }
      }
    });

    // Restore items to their exact original positions
    itemsByContainer.forEach((items, container) => {
      // Sort items by their original index to restore proper order
      items.sort((a, b) => a.originalIndex - b.originalIndex);

      items.forEach(({ item, originalIndex }) => {
        // Clean up any inline styles
        item.style.opacity = '';
        item.style.transform = '';
        item.style.display = '';

        // Insert item at its exact original position
        const containerChildren = Array.from(container.children);
        const targetIndex = originalIndex;

        if (targetIndex >= containerChildren.length) {
          // If original index is at the end, append
          container.appendChild(item);
        } else {
          // Insert before the element currently at the target position
          const referenceElement = containerChildren[targetIndex];
          container.insertBefore(item, referenceElement);
        }
      });
    });

    // Handle items without original data (fallback)
    dropAreaItems.forEach((item) => {
      if (!this.originalItemsData.has(item)) {
        const sourceContainer = document.querySelector('.ativos_main-list');
        if (sourceContainer && item.parentElement === dropArea) {
          item.style.opacity = '';
          item.style.transform = '';
          item.style.display = '';
          sourceContainer.appendChild(item);
        }
      }
    });

    // Update counter and source container states after restoration
    setTimeout(() => {
      AtivosCounter.updateCounter();
      this.updateSourceContainerState();
      this.ensureAddButtonPosition(); // Ensure add button stays at the end
      // Clear drop area persistence since all items are back in source
      DropAreaPersistence.clearStoredItems();
    }, 50);
  }

  // Event handlers
  private static handleSortStart = (evt: Sortable.SortableEvent): void => {
    const { item } = evt;

    // Add dragging class for visual feedback
    item.classList.add('ativos-dragging');

    // Add visual feedback to the entire interface
    document.body.classList.add('ativos-sorting');
  };

  private static handleSortEnd = (evt: Sortable.SortableEvent): void => {
    const { item } = evt;

    // Remove dragging class
    item.classList.remove('ativos-dragging');

    // Remove visual feedback from the interface
    document.body.classList.remove('ativos-sorting');

    // Ensure item is properly styled (remove any leftover inline styles)
    item.style.opacity = '';
    item.style.transform = '';
    item.style.display = '';

    // Update counter after any movement
    setTimeout(() => AtivosCounter.updateCounter(), 50);
  };

  private static handleAdd = (evt: Sortable.SortableEvent): void => {
    AtivosCounter.updateCounter();
    // Update source container state (item was removed from source)
    this.updateSourceContainerState();

    // Ensure the moved item has proper identification for persistence
    if (evt.item) {
      const element = evt.item as HTMLElement;
      const itemName = this.extractItemName(element);

      // Add identification attributes if missing for original items
      if (
        !element.getAttribute('data-original-id') &&
        !element.getAttribute('data-id') &&
        !element.hasAttribute('data-new-asset')
      ) {
        const uniqueId = `original-${itemName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        element.setAttribute('data-original-id', uniqueId);
        element.setAttribute('data-ativo-item', 'true');
      }

      // Store original item data for restoration
      if (!this.originalItemsData.has(element)) {
        const sourceContainer = evt.from;
        const originalIndex = Array.from(sourceContainer.children).indexOf(element);
        this.originalItemsData.set(element, {
          parent: sourceContainer,
          index: originalIndex,
        });
      }
    }

    // Save drop area items to persistence
    setTimeout(() => DropAreaPersistence.saveDropAreaItems(), 150);
  };

  private static handleRemove = (): void => {
    AtivosCounter.updateCounter();
    // Update source container state (item was returned to source)
    this.updateSourceContainerState();
    // Save drop area items to persistence
    setTimeout(() => DropAreaPersistence.saveDropAreaItems(), 100);
  };

  /**
   * Update the visual state of source containers based on their content
   */
  private static updateSourceContainerState(): void {
    const sourceContainers = document.querySelectorAll<HTMLElement>('.ativos_main-list');

    sourceContainers.forEach((container) => {
      // Count draggable items (exclude filtered elements)
      const draggableItems = container.querySelectorAll('.w-dyn-item, [data-ativo-item]');
      const filteredItems = container.querySelectorAll(
        '.drop_header_are-wrapper, .ativos_counter-wrapper, .ativos_clean-button, #adicionarAtivo'
      );

      const actualDraggableCount = draggableItems.length - filteredItems.length;
      const isEmpty = actualDraggableCount <= 0;

      // Find the .texto-info element within this container or its parent
      const textoInfo =
        container.querySelector('.texto-info') ||
        container.parentElement?.querySelector('.texto-info');

      if (textoInfo) {
        if (isEmpty) {
          // Add 'ativo' class when container is empty
          textoInfo.classList.add('ativo');
        } else {
          // Remove 'ativo' class when container has items
          textoInfo.classList.remove('ativo');
        }
      }
    });
  }

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
      // Only save original CMS items, not custom assets
      if (!item.hasAttribute('data-new-asset')) {
        this.originalItemsData.set(item, {
          parent: container,
          index,
        });
      }
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

  public static destroyAll = (): void => {
    this.instances.forEach((sortable) => {
      sortable.destroy();
    });
    this.instances.clear();
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

  /**
   * Setup "Add New Asset" button functionality (toggle visibility)
   */
  private static setupAddAssetButton = (): void => {
    const addButtons = document.querySelectorAll('#adicionarAtivo');

    addButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleAddAssetClick();
      });
    });
  };

  /**
   * Setup "Add New Asset" input functionality (create assets)
   */
  private static setupAddAssetInput = (): void => {
    const addInputs = document.querySelectorAll('#adicionarNAtivo');

    addInputs.forEach((input) => {
      input.addEventListener('keydown', (e) => {
        const keyEvent = e as KeyboardEvent;

        if (keyEvent.key === 'Enter') {
          e.preventDefault();
          this.handleAddAssetInput(input as HTMLInputElement);
        }
      });
    });
  };

  /**
   * Setup click-to-add functionality for source items
   */
  private static setupClickToAddFunctionality = (): void => {
    // Use event delegation to handle clicks on source items
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const sourceContainer = target.closest('.ativos_main-list');

      if (!sourceContainer) return;

      const assetItem = target.closest('.w-dyn-item, [data-ativo-item]') as HTMLElement;

      if (
        assetItem &&
        assetItem.id !== 'adicionarAtivo' &&
        !assetItem.classList.contains('add_ativo_manual') &&
        assetItem.style.display !== 'none'
      ) {
        // Prevent default click behavior
        e.preventDefault();

        // Check if this is a right-click (handled by context menu)
        if (e.button === 2) return;

        // Move item to drop area
        this.moveItemToDropArea(assetItem);
      }
    });
  };

  /**
   * Move an item from source to drop area (click-to-add functionality)
   */
  private static moveItemToDropArea = (sourceItem: HTMLElement): void => {
    const dropArea = document.querySelector('.ativos_main_drop_area');
    if (!dropArea) {
      return;
    }

    const itemName = this.extractItemName(sourceItem);

    // Clone the item for the drop area
    const clonedItem = sourceItem.cloneNode(true) as HTMLElement;

    // Ensure the cloned item has proper identification for persistence
    if (
      !clonedItem.getAttribute('data-original-id') &&
      !clonedItem.getAttribute('data-id') &&
      !clonedItem.hasAttribute('data-new-asset')
    ) {
      const uniqueId = `original-${itemName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      clonedItem.setAttribute('data-original-id', uniqueId);
      clonedItem.setAttribute('data-ativo-item', 'true');
    }

    // Store original item data for restoration
    if (!this.originalItemsData.has(clonedItem)) {
      const sourceContainer = sourceItem.parentElement;
      const originalIndex = Array.from(sourceContainer?.children || []).indexOf(sourceItem);
      this.originalItemsData.set(clonedItem, {
        parent: sourceContainer as HTMLElement,
        index: originalIndex,
      });
    }

    // Add to drop area
    dropArea.appendChild(clonedItem);

    // Hide the source item
    sourceItem.style.display = 'none';
    sourceItem.setAttribute('data-original-hidden', 'true');

    // Update counter and states
    AtivosCounter.updateCounter();
    this.updateSourceContainerState();

    // Save to persistence
    setTimeout(() => DropAreaPersistence.saveDropAreaItems(), 150);
  };

  /**
   * Toggle visibility of add asset input (consolidated function)
   */
  private static toggleAddAssetInput = (forceHide: boolean = false): void => {
    const addAtivoManual = document.querySelector('.add_ativo_manual');
    const adicionarButton = document.querySelector('#adicionar_ativo_novo');
    const adicionarElements = document.querySelectorAll<HTMLElement>('.ativos_item.adicionar');

    if (addAtivoManual) {
      if (forceHide) {
        addAtivoManual.classList.add('desativado');
        // Sync with the other toggle system
        adicionarElements.forEach((target) => target.classList.remove('close'));
        // Clear input and reset button
        this.clearInputAndResetButton();
      } else {
        // Toggle behavior
        if (addAtivoManual.classList.contains('desativado')) {
          addAtivoManual.classList.remove('desativado');
          // Sync with the other toggle system
          adicionarElements.forEach((target) => target.classList.add('close'));
          // Ensure button starts disabled until user types
          if (adicionarButton) {
            adicionarButton.classList.add('desativado');
          }
        } else {
          addAtivoManual.classList.add('desativado');
          // Sync with the other toggle system
          adicionarElements.forEach((target) => target.classList.remove('close'));
          // Clear input and reset button
          this.clearInputAndResetButton();
        }
      }
    }
  };

  /**
   * Handle click on "Add New Asset" button (toggle visibility only)
   */
  private static handleAddAssetClick = (): void => {
    this.toggleAddAssetInput();
  };

  /**
   * Handle input on "Add New Asset" input field (create assets)
   */
  private static handleAddAssetInput = (input: HTMLInputElement): void => {
    if (input && input.value.trim()) {
      this.createNewAsset(input.value.trim());

      // Hide the input after creating asset using consolidated function
      // This will clear the input, reset button state, and sync both toggle systems
      this.toggleAddAssetInput(true); // forceHide = true
    }
  };

  /**
   * Setup existing Webflow "Adicionar" button functionality and combo class toggle
   */
  private static setupWebflowAdicionarButton = (): void => {
    // Find the existing Webflow button
    const adicionarButton = document.querySelector('#adicionar_ativo_novo');
    const inputField = document.querySelector('#adicionarNAtivo') as HTMLInputElement;

    if (adicionarButton && inputField) {
      // Add click event listener to the button
      adicionarButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleAddAssetInput(inputField);
      });

      // Setup real-time combo class toggle based on input content
      const updateButtonState = () => {
        const hasText = inputField.value.trim().length > 0;

        if (hasText) {
          adicionarButton.classList.remove('desativado');
        } else {
          adicionarButton.classList.add('desativado');
        }
      };

      // Initial state check
      updateButtonState();

      // Listen for input changes (real-time updates)
      inputField.addEventListener('input', updateButtonState);
      inputField.addEventListener('keyup', updateButtonState);
      inputField.addEventListener('paste', () => {
        // Handle paste events with a small delay to ensure content is processed
        setTimeout(updateButtonState, 10);
      });
    }
  };

  /**
   * Create a new asset and add it to the source list for immediate visibility
   */
  private static createNewAsset = (assetName: string): void => {
    // Check if asset with same name already exists in DOM or source list
    const existingAssetInDom = document.querySelector(`[data-asset-name="${assetName}"]`);
    const existingAssetInSource = this.checkForDuplicateInSource(assetName);

    if (existingAssetInDom || existingAssetInSource) {
      // Show duplicate notification
      NotificationService.showDuplicateAsset(assetName);
      return;
    }

    // Create new asset element
    const newAsset = this.createAssetElement(assetName);

    // Add to source container (not drop area) so it appears in the list immediately
    const sourceContainer = document.querySelector('.ativos_main-list');
    if (sourceContainer && newAsset) {
      // Add before the #adicionarAtivo button if it exists, otherwise append to end
      const addButton = sourceContainer.querySelector('#adicionarAtivo');
      if (addButton) {
        sourceContainer.insertBefore(newAsset, addButton);
      } else {
        sourceContainer.appendChild(newAsset);
      }

      // Save to localStorage for persistence
      this.saveNewAssetToStorage(assetName);

      // Update counter and container states
      AtivosCounter.updateCounter();
      this.updateSourceContainerState();

      // Show success notification
      NotificationService.showAssetCreated(assetName);
    } else {
      NotificationService.showError('Erro ao criar ativo. Tente novamente.');
    }
  };

  /**
   * Check for duplicate asset names in source containers
   */
  private static checkForDuplicateInSource = (assetName: string): boolean => {
    const sourceContainers = document.querySelectorAll('.ativos_main-list');

    for (const container of sourceContainers) {
      const items = container.querySelectorAll('.w-dyn-item, [data-ativo-item]');

      for (const item of items) {
        const element = item as HTMLElement;
        // Skip hidden items and buttons
        if (element.style.display === 'none' || element.id === 'adicionarAtivo') {
          continue;
        }

        const itemName = this.extractItemName(element);
        if (itemName.toLowerCase() === assetName.toLowerCase()) {
          return true;
        }
      }
    }

    return false;
  };

  /**
   * Extract item name from element
   */
  private static extractItemName = (element: HTMLElement): string => {
    // Try different selectors to find the text content
    const textElement =
      element.querySelector('[class*="text"], .text-block, span, div') ||
      element.querySelector('*:not(script):not(style)');

    if (textElement) {
      return textElement.textContent?.trim() || '';
    }

    return element.textContent?.trim() || '';
  };

  /**
   * Create a new asset DOM element using the existing #pillAtivo template
   */
  private static createAssetElement = (assetName: string): HTMLElement | null => {
    // Find the existing #pillAtivo template element
    const pillAtivoTemplate = document.querySelector('#pillAtivo');
    if (!pillAtivoTemplate) {
      console.error('DEBUG: #pillAtivo template not found, falling back to custom structure');
      return this.createFallbackAssetElement(assetName);
    }

    // Clone the template element
    const assetElement = pillAtivoTemplate.cloneNode(true) as HTMLElement;

    // Remove the ID to avoid duplicates and add necessary attributes
    assetElement.removeAttribute('id');
    assetElement.classList.add('w-dyn-item');
    assetElement.setAttribute('data-ativo-item', 'true');
    assetElement.setAttribute('data-new-asset', 'true');
    assetElement.setAttribute('data-asset-name', assetName);

    // Find and update the text block inside the cloned element with the asset name
    const textBlock = assetElement.querySelector('[class*="text"], .text-block, span, div');
    if (textBlock) {
      textBlock.textContent = assetName;
      console.error('DEBUG: Updated text block with asset name:', assetName);
    } else {
      console.error(
        'DEBUG: Text block not found in #pillAtivo, asset name may not display correctly'
      );
    }

    return assetElement;
  };

  /**
   * Fallback method to create asset element if #pillAtivo template is not found
   */
  private static createFallbackAssetElement = (assetName: string): HTMLElement | null => {
    const assetElement = document.createElement('div');
    assetElement.className = 'w-dyn-item new-asset-item';
    assetElement.setAttribute('data-ativo-item', 'true');
    assetElement.setAttribute('data-new-asset', 'true');
    assetElement.setAttribute('data-asset-name', assetName);

    assetElement.innerHTML = `
      <div class="asset-content">
        <span class="asset-name">${assetName}</span>
      </div>
    `;

    return assetElement;
  };

  /**
   * Save new asset to localStorage for persistence
   */
  private static saveNewAssetToStorage = (assetName: string): void => {
    try {
      const existingAssets = this.getStoredAssets();

      // Check if asset with same name already exists
      const isDuplicate = existingAssets.some((asset) => asset.name === assetName);
      if (isDuplicate) {
        console.error('DEBUG: Asset with name already exists, skipping save:', assetName);
        return;
      }

      const newAsset = {
        id: Date.now().toString(),
        name: assetName,
        type: 'custom',
        createdAt: new Date().toISOString(),
      };

      existingAssets.push(newAsset);
      localStorage.setItem('ativos_custom_assets', JSON.stringify(existingAssets));
      console.error('DEBUG: Asset saved to localStorage:', assetName);
    } catch (error) {
      console.error('Failed to save asset to localStorage:', error);
    }
  };

  /**
   * Get stored assets from localStorage
   */
  private static getStoredAssets = (): Array<{
    id: string;
    name: string;
    type: string;
    createdAt: string;
  }> => {
    try {
      const stored = localStorage.getItem('ativos_custom_assets');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load assets from localStorage:', error);
      return [];
    }
  };

  /**
   * Clear all stored assets from localStorage (debug utility)
   */
  public static clearStoredAssets(): void {
    try {
      localStorage.removeItem('ativos_custom_assets');
      console.error('DEBUG: Cleared all stored assets from localStorage');
    } catch (error) {
      console.error('Failed to clear stored assets:', error);
    }
  }

  /**
   * Load persisted assets from localStorage and add them to source containers
   */
  private static loadPersistedAssets = (): void => {
    const storedAssets = this.getStoredAssets();
    const sourceContainer = document.querySelector('.ativos_main-list');
    if (!sourceContainer || storedAssets.length === 0) return;

    storedAssets.forEach((assetData) => {
      // Check if asset already exists in DOM to prevent duplicates
      const existingAsset = document.querySelector(`[data-asset-name="${assetData.name}"]`);
      if (existingAsset) {
        return;
      }
      const assetElement = this.createAssetElement(assetData.name);
      if (assetElement) {
        // Add to source container before the #adicionarAtivo button
        const addButton = sourceContainer.querySelector('#adicionarAtivo');
        if (addButton) {
          sourceContainer.insertBefore(assetElement, addButton);
        } else {
          sourceContainer.appendChild(assetElement);
        }
      }
    });

    // Update container state after loading assets
    this.updateSourceContainerState();
  };

  /**
   * Ensure "Add New Asset" button remains at the end of source containers
   */
  private static ensureAddButtonPosition = (): void => {
    const sourceContainers = document.querySelectorAll<HTMLElement>('.ativos_main-list');

    sourceContainers.forEach((container) => {
      const addButton = container.querySelector('#adicionarAtivo');
      if (addButton && addButton.parentElement === container) {
        // Move button to the end if it's not already there
        const lastChild = container.lastElementChild;
        if (lastChild !== addButton) {
          container.appendChild(addButton);
        }
      }
    });
  };

  /**
   * Setup toggle functionality for "adicionar" items
   */
  private static setupAdicionarToggle = (): void => {
    const triggers = document.querySelectorAll<HTMLElement>('.ativos_item.adicionar');

    triggers.forEach((trigger) => {
      // Initialize toggle state property
      let toggleState = 0;

      trigger.addEventListener('click', () => {
        toggleState = (toggleState + 1) % 2;

        const addAtivoManualElements = document.querySelectorAll<HTMLElement>('.add_ativo_manual');
        const adicionarElements = document.querySelectorAll<HTMLElement>('.ativos_item.adicionar');

        if (toggleState === 1) {
          // 1st click - Show input field
          addAtivoManualElements.forEach((target) => target.classList.remove('desativado'));
          adicionarElements.forEach((target) => target.classList.add('close'));

          // Ensure button state is properly initialized (disabled until user types)
          const adicionarButton = document.querySelector('#adicionar_ativo_novo');
          if (adicionarButton) {
            adicionarButton.classList.add('desativado');
          }
        } else {
          // 2nd click (toggle) - Hide input field
          addAtivoManualElements.forEach((target) => target.classList.add('desativado'));
          adicionarElements.forEach((target) => target.classList.remove('close'));

          // Use the existing toggleAddAssetInput method to ensure proper cleanup
          // This will clear the input field and reset button state
          this.clearInputAndResetButton();
        }
      });
    });
  };

  /**
   * Clear input field and reset button state (helper for toggle synchronization)
   */
  private static clearInputAndResetButton = (): void => {
    const inputField = document.querySelector('#adicionarNAtivo') as HTMLInputElement;
    const adicionarButton = document.querySelector('#adicionar_ativo_novo');

    // Clear input field
    if (inputField) {
      inputField.value = '';
    }

    // Reset button state to disabled
    if (adicionarButton) {
      adicionarButton.classList.add('desativado');
    }
  };
}
