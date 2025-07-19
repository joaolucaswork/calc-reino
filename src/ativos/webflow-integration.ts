/**
 * Webflow Integration for Ativos Module
 *
 * Handles Webflow-specific initialization and integration
 */

import { AtivosCounter } from './counter';
import { AtivosManager } from './sortable-manager';

declare global {
  interface Window {
    Webflow?: {
      push(callback: () => void): void;
    };
  }
}

export class WebflowAtivosInit {
  private static initialized = false;

  /**
   * Initialize the Ativos module for Webflow
   */
  public static initialize(): void {
    if (this.initialized) {
      return;
    }

    // Initialize immediately if DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.init();
      });
    } else {
      this.init();
    }

    // Also initialize on Webflow ready if available
    if (typeof window.Webflow !== 'undefined') {
      window.Webflow.push(() => {
        this.init();
      });
    }

    this.initialized = true;
  }

  /**
   * Internal initialization method
   */
  private static init(): void {
    // Initialize counter first
    AtivosCounter.initialize();

    // Then initialize sortable functionality
    AtivosManager.initialize();

    // Set up additional Webflow-specific features
    this.setupWebflowFeatures();

    // Dispatch custom ready event
    this.dispatchReadyEvent();
  }

  /**
   * Setup Webflow-specific features
   */
  private static setupWebflowFeatures(): void {
    // Handle Webflow's dynamic content loading
    this.setupDynamicContentHandling();

    // Handle Webflow's CMS collection changes
    this.setupCMSHandling();

    // Handle responsive design changes
    this.setupResponsiveHandling();
  }

  /**
   * Setup handling for Webflow's dynamic content
   */
  private static setupDynamicContentHandling(): void {
    // Listen for Webflow's dynamic content events
    const observer = new MutationObserver((mutations) => {
      let shouldReinitialize = false;

      mutations.forEach((mutation) => {
        // Check if new dynamic content was added
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // Check for CMS items or dynamic content
            if (
              element.classList.contains('w-dyn-item') ||
              element.classList.contains('w-dyn-list') ||
              element.querySelector('.w-dyn-item, .w-dyn-list')
            ) {
              shouldReinitialize = true;
            }
          }
        });
      });

      if (shouldReinitialize) {
        // Re-initialize sortable for new content
        setTimeout(() => {
          AtivosManager.initialize();
          AtivosCounter.updateCounter();
        }, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Setup CMS handling
   */
  private static setupCMSHandling(): void {
    // Listen for CMS collection changes
    document.addEventListener('cms:loaded', () => {
      setTimeout(() => {
        AtivosManager.initialize();
        AtivosCounter.updateCounter();
      }, 100);
    });

    // Handle filtering and sorting of CMS items
    document.addEventListener('cms:filtered', () => {
      setTimeout(() => {
        AtivosCounter.updateCounter();
      }, 50);
    });
  }

  /**
   * Setup responsive handling
   */
  private static setupResponsiveHandling(): void {
    // Handle window resize for responsive behavior
    let resizeTimeout: number;

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        // Trigger responsive updates if needed
        this.handleResponsiveChange();
      }, 250);
    });
  }

  /**
   * Handle responsive design changes
   */
  private static handleResponsiveChange(): void {
    // Re-calculate positions and update sortable options if needed
    const allSortables = AtivosManager.getAllSortables();

    allSortables.forEach((sortable) => {
      // Trigger a sortable update to recalculate positions
      sortable.option('disabled', false);
    });
  }

  /**
   * Dispatch ready event
   */
  private static dispatchReadyEvent(): void {
    const event = new CustomEvent('ativosReady', {
      detail: {
        timestamp: Date.now(),
        version: '1.0.0',
      },
      bubbles: true,
    });

    document.dispatchEvent(event);
  }

  /**
   * Manually reinitialize (useful for dynamic content)
   */
  public static reinitialize(): void {
    AtivosManager.destroyAll();
    this.init();
  }

  /**
   * Check if initialized
   */
  public static isInitialized(): boolean {
    return this.initialized;
  }
}
