/**
 * Clean Drag-Drop Manager
 *
 * Simplified and reliable drag-and-drop system using SortableJS shared groups
 * - No cloning complications
 * - No visual duplication issues
 * - Clean item movement between containers
 * - Webflow CMS compatible
 */

import Sortable from 'sortablejs';

import { DEFAULT_ATIVOS_OPTIONS } from './config';
import { AtivosCounter } from './counter';
import type { AtivosManagerOptions } from './types';

export class AtivosManager {
  private static instances = new Map<HTMLElement, Sortable>();
  private static options: AtivosManagerOptions = DEFAULT_ATIVOS_OPTIONS;
  private static originalItemsData = new Map<HTMLElement, { parent: HTMLElement; index: number }>();
  private static isInitialized = false;

  /**
   * Initialize the clean drag-drop system
   */
  public static initialize(customOptions?: Partial<AtivosManagerOptions>): void {
    if (this.isInitialized) {
      return;
    }

    this.options = { ...DEFAULT_ATIVOS_OPTIONS, ...customOptions };
    this.initializeContainers();
    this.setupCleanButton();
    this.setupAddAssetButton();
    this.setupAddAssetInput();
    this.setupDynamicContainerHandling();

    // Set initial state for source containers and load persisted assets
    setTimeout(() => {
      this.updateSourceContainerState();
      this.loadPersistedAssets();
    }, 100);

    this.isInitialized = true;
  }

  /**
   * Initialize all drag-drop containers with shared groups
   */
  private static initializeContainers(): void {
    // Initialize source containers (where items start)
    const sourceContainers = document.querySelectorAll<HTMLElement>('.ativos_main-list');
    sourceContainers.forEach((container) => {
      this.initializeSourceContainer(container);
    });

    // Initialize drop areas (where items are moved to)
    const dropAreas = document.querySelectorAll<HTMLElement>('.ativos_main_drop_area');
    dropAreas.forEach((container) => {
      this.initializeDropArea(container);
    });
  }

  /**
   * Initialize source container with clean shared groups configuration
   */
  private static initializeSourceContainer(container: HTMLElement): Sortable | null {
    if (!container || this.instances.has(container)) {
      return this.instances.get(container) || null;
    }

    // Save original positions for clean functionality
    this.saveOriginalItemsData(container);

    const sortable = new Sortable(container, {
      group: 'shared', // Simple shared group - items move between containers
      animation: 150,
      sort: false, // Don't allow reordering within source
      filter:
        '.drop_header_are-wrapper, .ativos_counter-wrapper, .ativos_clean-button, #adicionarAtivo',

      onStart: this.handleDragStart,
      onEnd: this.handleDragEnd,
    });

    this.instances.set(container, sortable);
    return sortable;
  }

  /**
   * Initialize drop area with clean shared groups configuration
   */
  private static initializeDropArea(container: HTMLElement): Sortable | null {
    if (!container || this.instances.has(container)) {
      return this.instances.get(container) || null;
    }

    const sortable = new Sortable(container, {
      group: 'shared', // Same shared group as source containers
      animation: 150,

      onAdd: this.handleItemAdded,
      onRemove: this.handleItemRemoved,
    });

    this.instances.set(container, sortable);
    return sortable;
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
   * Handle drag start - clean visual feedback
   */
  private static handleDragStart = (evt: Sortable.SortableEvent): void => {
    const { item } = evt;

    // Add visual feedback classes
    item.classList.add('ativos-dragging');
    document.body.classList.add('ativos-sorting');
  };

  /**
   * Handle drag end - clean up and ensure proper styling
   */
  private static handleDragEnd = (evt: Sortable.SortableEvent): void => {
    const { item } = evt;

    // Remove visual feedback classes
    item.classList.remove('ativos-dragging');
    document.body.classList.remove('ativos-sorting');

    // Ensure item is properly styled (no leftover inline styles)
    item.style.opacity = '';
    item.style.transform = '';
    item.style.display = '';

    // Update counter after any movement
    setTimeout(() => AtivosCounter.updateCounter(), 50);
  };

  /**
   * Handle item added to drop area
   */
  private static handleItemAdded = (): void => {
    // Update counter immediately
    AtivosCounter.updateCounter();

    // Update source container state (item was removed from source)
    this.updateSourceContainerState();
  };

  /**
   * Handle item removed from drop area
   */
  private static handleItemRemoved = (): void => {
    // Update counter immediately
    AtivosCounter.updateCounter();

    // Update source container state
    this.updateSourceContainerState();
  };

  /**
   * Ensure "Add New Asset" button remains at the end of source containers
   */
  private static ensureAddButtonPosition(): void {
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
  }

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

      // Find the .text-info_wrapper element within this container or its parent
      const textInfoWrapper =
        container.querySelector('.text-info_wrapper') ||
        container.parentElement?.querySelector('.text-info_wrapper');

      if (textInfoWrapper) {
        if (isEmpty) {
          // Remove 'hide' class when container is empty (show the element)
          textInfoWrapper.classList.remove('hide');
        } else {
          // Add 'hide' class when container has items (hide the element)
          textInfoWrapper.classList.add('hide');
        }
      }
    });
  }

  /**
   * Setup handling for dynamically added containers (Webflow compatibility)
   */
  private static setupDynamicContainerHandling(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // Check for new source containers
            if (element.matches('.ativos_main-list')) {
              this.initializeSourceContainer(element as HTMLElement);
            }

            // Check for new drop areas
            if (element.matches('.ativos_main_drop_area')) {
              this.initializeDropArea(element as HTMLElement);
            }

            // Check for containers within added elements
            const sourceContainers = element.querySelectorAll<HTMLElement>('.ativos_main-list');
            sourceContainers.forEach((container) => this.initializeSourceContainer(container));

            const dropAreas = element.querySelectorAll<HTMLElement>('.ativos_main_drop_area');
            dropAreas.forEach((container) => this.initializeDropArea(container));
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
   * Save original items data with exact positions for clean functionality
   */
  private static saveOriginalItemsData(container: HTMLElement): void {
    const items = container.querySelectorAll<HTMLElement>('.w-dyn-item, [data-ativo-item]');

    items.forEach((item, index) => {
      // Only save original CMS items, not custom assets
      if (!item.hasAttribute('data-new-asset')) {
        // Store both parent and exact index position
        this.originalItemsData.set(item, {
          parent: container,
          index,
        });

        // Also store as data attributes for reliability
        item.setAttribute('data-original-index', index.toString());
        item.setAttribute('data-original-container', container.className);
      }
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
   * Setup "Add New Asset" button functionality (toggle visibility)
   */
  private static setupAddAssetButton(): void {
    const addButtons = document.querySelectorAll('#adicionarAtivo');

    addButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleAddAssetClick();
      });
    });
  }

  /**
   * Setup "Add New Asset" input functionality (create assets)
   */
  private static setupAddAssetInput(): void {
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
  }

  /**
   * Toggle visibility of add asset input (consolidated function)
   */
  private static toggleAddAssetInput(forceHide: boolean = false): void {
    const addAtivoManual = document.querySelector('.add_ativo_manual');
    if (addAtivoManual) {
      if (forceHide) {
        addAtivoManual.classList.add('desativado');
      } else {
        // Toggle behavior
        if (addAtivoManual.classList.contains('desativado')) {
          addAtivoManual.classList.remove('desativado');
        } else {
          addAtivoManual.classList.add('desativado');
        }
      }
    }
  }

  /**
   * Handle click on "Add New Asset" button (toggle visibility only)
   */
  private static handleAddAssetClick(): void {
    this.toggleAddAssetInput();
  }

  /**
   * Handle input on "Add New Asset" input field (create assets)
   */
  private static handleAddAssetInput(input: HTMLInputElement): void {
    if (input && input.value.trim()) {
      this.createNewAsset(input.value.trim());
      input.value = ''; // Clear input after creation

      // Hide the input after creating asset using consolidated function
      this.toggleAddAssetInput(true); // forceHide = true
    }
  }

  /**
   * Create a new asset and add it to the drop area
   */
  private static createNewAsset(assetName: string): void {
    // Check if asset with same name already exists in DOM
    const existingAsset = document.querySelector(`[data-asset-name="${assetName}"]`);
    if (existingAsset) {
      console.error(
        'DEBUG: Asset with same name already exists in DOM, skipping creation:',
        assetName
      );
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
    } else {
      console.error('Source container not found or asset creation failed');
    }
  }

  /**
   * Create a new asset DOM element using the existing #pillAtivo template
   */
  private static createAssetElement(assetName: string): HTMLElement | null {
    // Find the existing #pillAtivo template element
    const pillAtivoTemplate = document.querySelector('#pillAtivo');
    if (!pillAtivoTemplate) {
      console.error('#pillAtivo template not found, falling back to custom structure');
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
    } else {
      console.error('Text block not found in #pillAtivo, asset name may not display correctly');
    }

    return assetElement;
  }

  /**
   * Fallback method to create asset element if #pillAtivo template is not found
   */
  private static createFallbackAssetElement(assetName: string): HTMLElement | null {
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
  }

  /**
   * Save new asset to localStorage for persistence
   */
  private static saveNewAssetToStorage(assetName: string): void {
    try {
      const existingAssets = this.getStoredAssets();

      // Check if asset with same name already exists
      const isDuplicate = existingAssets.some((asset) => asset.name === assetName);
      if (isDuplicate) {
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
    } catch (error) {
      console.error('Failed to save asset to localStorage:', error);
    }
  }

  /**
   * Get stored assets from localStorage
   */
  private static getStoredAssets(): Array<{
    id: string;
    name: string;
    type: string;
    createdAt: string;
  }> {
    try {
      const stored = localStorage.getItem('ativos_custom_assets');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load assets from localStorage:', error);
      return [];
    }
  }

  /**
   * Load persisted assets from localStorage and add them to source containers
   */
  private static loadPersistedAssets(): void {
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
    }, 50);
  }
}
