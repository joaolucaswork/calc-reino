import { currencyFormatter } from './formatter';

// Type definition for Webflow global
declare global {
  interface Window {
    Webflow?: {
      push: (callback: () => void) => void;
    };
  }
}

/**
 * Webflow-specific initialization for currency formatting
 * Ensures proper integration with Webflow's lifecycle events
 */
export class WebflowCurrencyInit {
  private static initialized = false;

  /**
   * Initialize currency formatting for Webflow
   * Handles both initial page load and dynamic content
   */
  static initialize(): void {
    if (WebflowCurrencyInit.initialized) return;

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        WebflowCurrencyInit.setupCurrencyFormatting();
      });
    } else {
      WebflowCurrencyInit.setupCurrencyFormatting();
    }

    // Also initialize on Webflow ready event if available
    if (typeof window !== 'undefined' && window.Webflow) {
      window.Webflow.push(() => {
        WebflowCurrencyInit.setupCurrencyFormatting();
      });
    }

    WebflowCurrencyInit.initialized = true;
  }

  /**
   * Setup currency formatting
   */
  private static setupCurrencyFormatting(): void {
    // Initialize the currency formatter
    currencyFormatter.initialize();

    // Handle Webflow form interactions
    WebflowCurrencyInit.handleWebflowForms();

    // Handle Webflow CMS dynamic content
    WebflowCurrencyInit.handleDynamicContent();
  }

  /**
   * Handle Webflow form-specific features
   */
  private static handleWebflowForms(): void {
    // Listen for form submissions to ensure numeric values are included
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      if (!form || form.tagName !== 'FORM') return;

      const currencyInputs = form.querySelectorAll<HTMLInputElement>('input[data-currency="true"]');

      currencyInputs.forEach((input) => {
        // Ensure the numeric value is available for form submission
        const numericValue = currencyFormatter.getNumericValue(input);

        // Create a hidden input with the numeric value for form processing
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = input.name ? `${input.name}_numeric` : 'currency_numeric';
        hiddenInput.value = numericValue.toString();

        // Remove any existing hidden input with the same name
        const existingHidden = form.querySelector(`input[name="${hiddenInput.name}"]`);
        if (existingHidden) {
          existingHidden.remove();
        }

        form.appendChild(hiddenInput);
      });
    });
  }

  /**
   * Handle Webflow CMS dynamic content and interactions
   */
  private static handleDynamicContent(): void {
    // Watch for Webflow interactions that might reveal new forms
    const observer = new MutationObserver((mutations) => {
      let hasNewContent = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;

              // Check if new currency inputs were added
              if (
                element.matches('input[data-currency="true"]') ||
                element.querySelectorAll('input[data-currency="true"]').length > 0
              ) {
                hasNewContent = true;
              }
            }
          });
        }
      });

      // Re-initialize currency formatting if new content was added
      if (hasNewContent) {
        setTimeout(() => {
          currencyFormatter.initialize();
        }, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Get formatted currency value from an input
   */
  static getFormattedValue(input: HTMLInputElement): string {
    return input.value;
  }

  /**
   * Get numeric value from a currency input
   */
  static getNumericValue(input: HTMLInputElement): number {
    return currencyFormatter.getNumericValue(input);
  }

  /**
   * Set value for a currency input
   */
  static setValue(input: HTMLInputElement, value: number): void {
    currencyFormatter.setValue(input, value);
  }

  /**
   * Manually format a specific input (useful for dynamic content)
   */
  static formatInput(selector: string): void {
    const input = document.querySelector(selector) as HTMLInputElement;
    if (input && input.matches('input[data-currency="true"]')) {
      currencyFormatter.initialize();
    }
  }

  /**
   * Clean up and destroy the currency formatter
   */
  static destroy(): void {
    currencyFormatter.destroy();
    WebflowCurrencyInit.initialized = false;
  }
}

// Auto-initialize when script loads
WebflowCurrencyInit.initialize();

// Export for manual control if needed
export { currencyFormatter };
