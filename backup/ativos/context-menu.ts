/**
 * Context Menu Service for Asset Management
 *
 * Provides right-click context menu functionality for assets
 */

import { DropAreaPersistence } from './drop-area-persistence';
import { NotificationService } from './notification-service';

export class ContextMenuService {
  private static contextMenu: HTMLElement | null = null;
  private static currentTarget: HTMLElement | null = null;

  /**
   * Initialize context menu functionality
   */
  public static initialize(): void {
    this.createContextMenu();
    this.setupEventListeners();
  }

  /**
   * Create the context menu element
   */
  private static createContextMenu(): void {
    // Remove existing context menu if it exists
    if (this.contextMenu) {
      this.contextMenu.remove();
    }

    this.contextMenu = document.createElement('div');
    this.contextMenu.className = 'ativos-context-menu';
    this.contextMenu.innerHTML = `
      <div class="context-menu-item delete-item">
        <span class="context-menu-icon">🗑️</span>
        <span class="context-menu-text">Deletar</span>
      </div>
    `;

    // Add styles
    this.addContextMenuStyles();

    // Add to document
    document.body.appendChild(this.contextMenu);

    // Add click handler for delete option
    const deleteItem = this.contextMenu.querySelector('.delete-item');
    if (deleteItem) {
      deleteItem.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleDeleteItem();
      });
    }
  }

  /**
   * Setup event listeners for context menu
   */
  private static setupEventListeners(): void {
    // Listen for right-clicks on assets
    document.addEventListener('contextmenu', (e) => {
      const target = e.target as HTMLElement;
      const assetItem = target.closest('.w-dyn-item, [data-ativo-item]') as HTMLElement;

      if (assetItem && this.isCustomAsset(assetItem)) {
        e.preventDefault();
        this.showContextMenu(e, assetItem);
      }
    });

    // Hide context menu on click outside
    document.addEventListener('click', (e) => {
      if (this.contextMenu && !this.contextMenu.contains(e.target as Node)) {
        this.hideContextMenu();
      }
    });

    // Hide context menu on scroll
    document.addEventListener('scroll', () => {
      this.hideContextMenu();
    });

    // Hide context menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideContextMenu();
      }
    });
  }

  /**
   * Show context menu at cursor position
   */
  private static showContextMenu(event: MouseEvent, target: HTMLElement): void {
    if (!this.contextMenu) return;

    this.currentTarget = target;
    this.contextMenu.style.display = 'block';
    this.contextMenu.style.left = `${event.pageX}px`;
    this.contextMenu.style.top = `${event.pageY}px`;

    // Adjust position if menu would go off-screen
    const rect = this.contextMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (rect.right > viewportWidth) {
      this.contextMenu.style.left = `${event.pageX - rect.width}px`;
    }

    if (rect.bottom > viewportHeight) {
      this.contextMenu.style.top = `${event.pageY - rect.height}px`;
    }
  }

  /**
   * Hide context menu
   */
  private static hideContextMenu(): void {
    if (this.contextMenu) {
      this.contextMenu.style.display = 'none';
    }
    this.currentTarget = null;
  }

  /**
   * Check if an asset is a custom asset (can be deleted)
   */
  private static isCustomAsset(element: HTMLElement): boolean {
    return element.hasAttribute('data-new-asset') || element.hasAttribute('data-asset-name');
  }

  /**
   * Handle delete item action
   */
  private static handleDeleteItem(): void {
    if (!this.currentTarget) return;

    const itemName = this.extractItemName(this.currentTarget);

    if (!itemName) {
      NotificationService.showError('Erro ao identificar o ativo para deletar.');
      this.hideContextMenu();
      return;
    }

    // Remove from DOM
    this.currentTarget.remove();

    // Remove from localStorage (custom assets)
    this.removeFromStorage(itemName);

    // Update drop area persistence
    setTimeout(() => DropAreaPersistence.saveDropAreaItems(), 100);

    // Show success notification
    NotificationService.showSuccess(`Ativo "${itemName}" foi deletado.`);

    this.hideContextMenu();
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
   * Remove asset from localStorage
   */
  private static removeFromStorage(itemName: string): void {
    try {
      // Remove from custom assets storage
      const customAssetsKey = 'ativos_custom_assets';
      const stored = localStorage.getItem(customAssetsKey);

      if (stored) {
        const assets = JSON.parse(stored);
        const filteredAssets = assets.filter((asset: any) => asset.name !== itemName);
        localStorage.setItem(customAssetsKey, JSON.stringify(filteredAssets));
      }

      // Remove from drop area persistence
      DropAreaPersistence.removeItemFromStorage(itemName);
    } catch (error) {
      console.error('Error removing asset from storage:', error);
    }
  }

  /**
   * Add CSS styles for context menu
   */
  private static addContextMenuStyles(): void {
    const existingStyle = document.querySelector('#ativos-context-menu-styles');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'ativos-context-menu-styles';
    style.textContent = `
      .ativos-context-menu {
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        min-width: 120px;
        display: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .context-menu-item {
        padding: 8px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #333;
        transition: background-color 0.2s ease;
      }

      .context-menu-item:hover {
        background-color: #f5f5f5;
      }

      .context-menu-item:first-child {
        border-radius: 6px 6px 0 0;
      }

      .context-menu-item:last-child {
        border-radius: 0 0 6px 6px;
      }

      .context-menu-item:only-child {
        border-radius: 6px;
      }

      .delete-item {
        color: #dc3545;
      }

      .delete-item:hover {
        background-color: #f8d7da;
      }

      .context-menu-icon {
        font-size: 16px;
        width: 16px;
        text-align: center;
      }

      .context-menu-text {
        flex: 1;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Destroy context menu
   */
  public static destroy(): void {
    if (this.contextMenu) {
      this.contextMenu.remove();
      this.contextMenu = null;
    }

    const style = document.querySelector('#ativos-context-menu-styles');
    if (style) {
      style.remove();
    }

    this.currentTarget = null;
  }
}
