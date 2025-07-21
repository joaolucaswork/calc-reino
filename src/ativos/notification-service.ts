/**
 * Notification Service using Notyf
 * 
 * Provides centralized notification management for the Ativos system
 */

import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';

export class NotificationService {
  private static instance: Notyf | null = null;

  /**
   * Initialize the notification service with custom configuration
   */
  public static initialize(): void {
    if (this.instance) {
      return;
    }

    this.instance = new Notyf({
      duration: 4000,
      position: {
        x: 'center',
        y: 'bottom'
      },
      dismissible: true,
      types: [
        {
          type: 'success',
          background: '#10b981', // Pastel green
          icon: {
            className: 'notyf__icon--success',
            tagName: 'span',
            text: '✓'
          }
        },
        {
          type: 'error',
          background: '#f87171', // Pastel red
          icon: {
            className: 'notyf__icon--error',
            tagName: 'span',
            text: '✕'
          }
        }
      ]
    });

    // Add custom CSS for minimalist design
    this.addCustomStyles();
  }

  /**
   * Show success notification for asset creation
   */
  public static showAssetCreated(assetName: string): void {
    if (!this.instance) {
      this.initialize();
    }

    this.instance?.success(`Ativo "${assetName}" criado com sucesso!`);
  }

  /**
   * Show error notification for duplicate asset
   */
  public static showDuplicateAsset(assetName: string): void {
    if (!this.instance) {
      this.initialize();
    }

    this.instance?.error(`Ativo "${assetName}" já existe na lista!`);
  }

  /**
   * Show generic error notification
   */
  public static showError(message: string): void {
    if (!this.instance) {
      this.initialize();
    }

    this.instance?.error(message);
  }

  /**
   * Show generic success notification
   */
  public static showSuccess(message: string): void {
    if (!this.instance) {
      this.initialize();
    }

    this.instance?.success(message);
  }

  /**
   * Add custom CSS styles for minimalist design
   */
  private static addCustomStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Minimalist Notyf styling */
      .notyf__toast {
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        padding: 16px 20px;
        min-height: auto;
      }

      .notyf__message {
        margin: 0;
        line-height: 1.4;
      }

      .notyf__icon {
        margin-right: 12px;
        font-size: 16px;
        font-weight: bold;
      }

      .notyf__dismiss-btn {
        opacity: 0.7;
        transition: opacity 0.2s ease;
      }

      .notyf__dismiss-btn:hover {
        opacity: 1;
      }

      /* Success notification styling */
      .notyf__toast--success {
        background: #10b981;
        color: white;
      }

      /* Error notification styling */
      .notyf__toast--error {
        background: #f87171;
        color: white;
      }

      /* Container positioning */
      .notyf {
        z-index: 9999;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Get the Notyf instance (for advanced usage)
   */
  public static getInstance(): Notyf | null {
    return this.instance;
  }

  /**
   * Destroy the notification service
   */
  public static destroy(): void {
    if (this.instance) {
      this.instance = null;
    }
  }
}
