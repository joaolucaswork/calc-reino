/**
 * Currency Module
 * Complete Brazilian Real (BRL) currency formatting and control system
 * Extracted and modularized from fresh-reino project
 */

import { CurrencyControl } from './currency-control';
import { CurrencyFormatter } from './currency-formatter';
import type { CurrencyInstance, Operation } from './types';

export class CurrencyModule {
  private control: CurrencyControl;
  private formatter: CurrencyFormatter;
  private isInitialized = false;

  constructor() {
    this.control = new CurrencyControl();
    this.formatter = new CurrencyFormatter();
  }

  /**
   * Initialize the currency system
   */
  public init(): void {
    if (this.isInitialized) {
      return;
    }

    // Wait for DOM and dependencies
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }

  private initialize(): void {
    // Wait for Webflow and Currency.js
    this.waitForDependencies().then(() => {
      this.formatter.init();
      this.control.init();
      this.isInitialized = true;

      // Dispatch ready event
      document.dispatchEvent(
        new CustomEvent('currencyModuleReady', {
          detail: { module: this },
        })
      );
    });
  }

  private async waitForDependencies(): Promise<void> {
    return new Promise((resolve) => {
      const checkDependencies = () => {
        if (window.currency && (window.Webflow || document.readyState === 'complete')) {
          resolve();
        } else {
          setTimeout(checkDependencies, 50);
        }
      };
      checkDependencies();
    });
  }

  /**
   * Get formatted currency value
   */
  public formatCurrency(value: number): string {
    return this.formatter.formatBRL(value);
  }

  /**
   * Parse currency string to number
   */
  public parseCurrency(value: string): number {
    return this.formatter.getCurrencyValue(value);
  }

  /**
   * Calculate with Currency.js precision
   */
  public calculate(value1: number, value2: number, operation: Operation = 'add'): CurrencyInstance {
    return this.formatter.calculateCurrency(value1, value2, operation);
  }

  /**
   * Get initialization status
   */
  public getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  /**
   * Re-initialize currency inputs (useful for dynamic content)
   */
  public refresh(): void {
    if (this.isInitialized) {
      this.formatter.initializeCurrencyInputs();
    }
  }
}

// Export components
export { CurrencyControl } from './currency-control';
export { CurrencyFormatter } from './currency-formatter';
export * from './types';

// Create global instance
const currencyModule = new CurrencyModule();

// Auto-initialize
currencyModule.init();

// Export for external usage
export default currencyModule;

// Make available globally for backward compatibility
declare global {
  interface Window {
    CurrencyModule: CurrencyModule;
  }
}

window.CurrencyModule = currencyModule;
