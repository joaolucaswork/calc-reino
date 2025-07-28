/**
 * Notification Service using Notyf
 *
 * Provides centralized notification management for the Ativos system
 */

import 'notyf/notyf.min.css';

import { Notyf } from 'notyf';

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
        y: 'bottom',
      },
      dismissible: true,
      types: [
        {
          type: 'success',
          background: '#FFFFFF', // White for new asset additions
          className: 'custom-success-toast',
          icon: false, // Remove icons
        },
        {
          type: 'error',
          background: '#FFE6E6', // Pastel red for errors/removals
          className: 'custom-error-toast',
          icon: false, // Remove icons
        },
      ],
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
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 400;
        padding: 8px 12px;
        min-height: auto;
        height: auto;
        max-width: 350px;
        border: none;
        position: relative;
      }

      .notyf__message {
        margin: 0;
        line-height: 1.2;
        padding-right: 0;
        color: #333333;
        font-weight: 500;
      }

      /* Remove all icon spacing and display */
      .notyf__icon {
        display: none !important;
      }

      /* Dismiss button styling - seamless integration */
      .notyf__dismiss-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 20px;
        height: 20px;
        opacity: 1;
        transition: opacity 0.2s ease;
        background: none;
        border: none;
        font-size: 18px;
        color: #000000;
        cursor: pointer;
        border-radius: 0;
        padding: 0;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .notyf__dismiss-btn:hover {
        opacity: 0.7;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
      }

      .notyf__dismiss-btn:before {
        content: '×';
        font-size: 18px;
        font-weight: 400;
      }

      /* Success notification styling */
      .notyf__toast--success,
      .custom-success-toast {
        background: #FFFFFF !important;
        color: #333333 !important;
        border: 1px solid rgba(0, 0, 0, 0.1);
      }

      .notyf__toast--success .notyf__message,
      .custom-success-toast .notyf__message {
        color: #333333 !important;
      }

      .notyf__toast--success .notyf__dismiss-btn,
      .custom-success-toast .notyf__dismiss-btn {
        color: #000000 !important;
      }

      /* Error notification styling */
      .notyf__toast--error,
      .custom-error-toast {
        background: #FFE6E6 !important;
        color: #333333 !important;
        border: 1px solid rgba(0, 0, 0, 0.05);
      }

      .notyf__toast--error .notyf__message,
      .custom-error-toast .notyf__message {
        color: #333333 !important;
      }

      .notyf__toast--error .notyf__dismiss-btn,
      .custom-error-toast .notyf__dismiss-btn {
        color: #000000 !important;
      }

      /* Container positioning */
      .notyf {
        z-index: 9999;
      }

      /* Ensure consistent compact styling across all states */
      .notyf__toast.notyf__toast--disappear,
      .notyf__toast.notyf__toast--upper,
      .notyf__toast.notyf__toast--lower {
        padding: 8px 12px;
        min-height: auto;
        height: auto;
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
