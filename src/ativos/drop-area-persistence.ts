/**
 * Drop Area Persistence Service
 *
 * Manages saving and loading of items in the drop area to localStorage
 */

export interface DropAreaItem {
  id: string;
  name: string;
  type: 'original' | 'custom';
  position: number;
  createdAt: string;
  originalId?: string; // For tracking original source items
}

export class DropAreaPersistence {
  private static readonly STORAGE_KEY = 'ativos_drop_area_items';

  /**
   * Save current drop area items to localStorage
   */
  public static saveDropAreaItems(): void {
    try {
      const dropArea = document.querySelector('.ativos_main_drop_area');
      if (!dropArea) {
        console.error('DEBUG: Drop area not found for saving');
        return;
      }

      const items = Array.from(dropArea.querySelectorAll('.w-dyn-item, [data-ativo-item]'));
      const dropAreaItems: DropAreaItem[] = [];

      items.forEach((item, index) => {
        const element = item as HTMLElement;
        const name = this.extractItemName(element);
        const isCustomAsset = element.hasAttribute('data-new-asset');
        const originalId =
          element.getAttribute('data-original-id') ||
          element.getAttribute('data-id') ||
          element.getAttribute('data-ativo-item');

        if (name) {
          // Generate a unique ID for items that don't have one
          const itemId =
            originalId || `item-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

          dropAreaItems.push({
            id: itemId,
            name: name,
            type: isCustomAsset ? 'custom' : 'original',
            position: index,
            createdAt: element.getAttribute('data-created-at') || new Date().toISOString(),
            originalId: originalId || itemId,
          });
        }
      });

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dropAreaItems));
    } catch (error) {
      console.error('Error saving drop area items:', error);
    }
  }

  /**
   * Load drop area items from localStorage
   */
  public static loadDropAreaItems(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return;
      }

      const dropAreaItems: DropAreaItem[] = JSON.parse(stored);
      const dropArea = document.querySelector('.ativos_main_drop_area');

      if (!dropArea) {
        return;
      }

      // Clear current drop area (but keep any items that might be there)
      const existingItems = Array.from(dropArea.querySelectorAll('.w-dyn-item, [data-ativo-item]'));

      // Sort items by position
      dropAreaItems.sort((a, b) => a.position - b.position);

      dropAreaItems.forEach((itemData) => {
        // Check if item already exists in drop area
        const existingItem = existingItems.find((item) => {
          const element = item as HTMLElement;
          const existingName = this.extractItemName(element);
          return existingName === itemData.name;
        });

        if (!existingItem) {
          // Create the item element
          const itemElement = this.createDropAreaItemElement(itemData);
          if (itemElement) {
            dropArea.appendChild(itemElement);

            // Hide corresponding source item if it's an original item
            if (itemData.type === 'original' && itemData.originalId) {
              this.hideSourceItem(itemData.originalId, itemData.name);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error loading drop area items:', error);
    }
  }

  /**
   * Create a drop area item element from stored data
   */
  private static createDropAreaItemElement(itemData: DropAreaItem): HTMLElement | null {
    // Try to find the template or an existing item to clone
    const template =
      document.querySelector('#pillAtivo') ||
      document.querySelector('.ativos_main-list .w-dyn-item');

    if (!template) {
      return null;
    }

    const itemElement = template.cloneNode(true) as HTMLElement;

    // Remove ID and set up attributes
    itemElement.removeAttribute('id');
    itemElement.classList.add('w-dyn-item');
    itemElement.setAttribute('data-ativo-item', 'true');
    itemElement.setAttribute('data-created-at', itemData.createdAt);

    if (itemData.type === 'custom') {
      itemElement.setAttribute('data-new-asset', 'true');
      itemElement.setAttribute('data-asset-name', itemData.name);
    }

    if (itemData.originalId) {
      itemElement.setAttribute('data-original-id', itemData.originalId);
    }

    // Update the text content
    const textElement = itemElement.querySelector('[class*="text"], .text-block, span, div');
    if (textElement) {
      textElement.textContent = itemData.name;
    }

    // Make sure it's visible
    itemElement.style.display = '';

    return itemElement;
  }

  /**
   * Hide source item when it's in the drop area
   */
  private static hideSourceItem(originalId: string, itemName: string): void {
    const sourceContainers = document.querySelectorAll('.ativos_main-list');

    sourceContainers.forEach((container) => {
      const items = container.querySelectorAll('.w-dyn-item, [data-ativo-item]');

      items.forEach((item) => {
        const element = item as HTMLElement;
        const elementId =
          element.getAttribute('data-id') || element.getAttribute('data-original-id');
        const elementName = this.extractItemName(element);

        // Match by ID or name
        if ((originalId && elementId === originalId) || (!originalId && elementName === itemName)) {
          element.style.display = 'none';
          element.setAttribute('data-original-hidden', 'true');
        }
      });
    });
  }

  /**
   * Extract item name from element
   */
  private static extractItemName(element: HTMLElement): string {
    // Try different selectors to find the text content
    const textElement =
      element.querySelector('[class*="text"], .text-block, span, div') ||
      element.querySelector('*:not(script):not(style)');

    if (textElement) {
      return textElement.textContent?.trim() || '';
    }

    return element.textContent?.trim() || '';
  }

  /**
   * Clear stored drop area items
   */
  public static clearStoredItems(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get stored drop area items
   */
  public static getStoredItems(): DropAreaItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting stored drop area items:', error);
      return [];
    }
  }

  /**
   * Remove specific item from storage
   */
  public static removeItemFromStorage(itemName: string): void {
    try {
      const items = this.getStoredItems();
      const filteredItems = items.filter((item) => item.name !== itemName);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredItems));
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  }
}
