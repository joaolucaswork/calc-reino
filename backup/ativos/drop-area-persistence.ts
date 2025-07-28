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
        return;
      }

      const items = Array.from(dropArea.querySelectorAll('.w-dyn-item, [data-ativo-item]'));
      const dropAreaItems: DropAreaItem[] = [];

      items.forEach((item, index) => {
        const element = item as HTMLElement;
        const name = this.extractItemName(element);
        const isCustomAsset = element.hasAttribute('data-new-asset');

        // MELHORADA: Lógica mais robusta para originalId
        let originalId =
          element.getAttribute('data-original-id') ||
          element.getAttribute('data-id') ||
          element.getAttribute('data-ativo-item');

        // Se não tem ID e não é custom asset, criar um baseado no nome e posição
        if (!originalId && !isCustomAsset && name) {
          originalId = `original-${name.toLowerCase().replace(/\s+/g, '-')}-${index}-${Date.now()}`;
          element.setAttribute('data-original-id', originalId);
        }

        if (name) {
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

            // Hide corresponding source item for ALL types (original AND custom)
            // This ensures that items loaded from cache only appear in the drop area
            this.hideSourceItem(itemData.originalId || '', itemData.name);
          }
        }
      });

      // Additional step: Update container states after loading to ensure UI consistency
      setTimeout(() => {
        // Import and call updateContainerStates if available
        const event = new CustomEvent('ativos-update-containers');
        document.dispatchEvent(event);
      }, 50);
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

        // MELHORADA: Lógica de correspondência mais robusta
        const matchById = originalId && elementId && elementId === originalId;
        const matchByName =
          itemName &&
          elementName &&
          elementName.toLowerCase().trim() === itemName.toLowerCase().trim();

        // For custom assets, also check data-asset-name attribute
        const matchByAssetName = itemName && element.getAttribute('data-asset-name') === itemName;

        // Evitar ocultar itens já ocultos ou botões especiais
        const isAlreadyHidden =
          element.style.display === 'none' || element.hasAttribute('data-original-hidden');
        const isSpecialButton =
          element.id === 'adicionarAtivo' || element.classList.contains('add_ativo_manual');

        const shouldHide =
          (matchById || matchByName || matchByAssetName) && !isAlreadyHidden && !isSpecialButton;

        if (shouldHide) {
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
    // Strategy 1: Try different selectors to find the text content
    const textSelectors = [
      '[class*="text"]',
      '.text-block',
      'span:not(:empty)',
      'div:not(:has(*))', // div with no child elements
      '*:not(script):not(style):not(svg):not(path)',
    ];

    for (const selector of textSelectors) {
      try {
        const textElement = element.querySelector(selector);
        if (textElement && textElement.textContent?.trim()) {
          return textElement.textContent.trim();
        }
      } catch {
        // Silently continue to next selector
      }
    }

    // Strategy 2: If no child elements work, use the element's direct textContent
    const directText = element.textContent?.trim() || '';
    if (directText) {
      return directText;
    }

    // Strategy 3: Fallback - look for any non-empty text node
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        return node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });

    const textNode = walker.nextNode();
    if (textNode && textNode.textContent?.trim()) {
      return textNode.textContent.trim();
    }

    return '';
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
