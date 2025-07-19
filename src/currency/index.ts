/**
 * Currency Module
 *
 * Comprehensive currency formatting solution for Webflow forms
 * Automatically formats Brazilian Real (BRL) currency inputs
 */

// Import styles
import './styles/currency.css';

// Import core functionality
import { currencyFormatter } from './formatter';
import { WebflowCurrencyInit } from './webflow-integration';

// Import configuration and types
export * from './config';
export * from './types';

// Auto-initialize for Webflow
WebflowCurrencyInit.initialize();

// Export public API
export { currencyFormatter, WebflowCurrencyInit };
export { CurrencyFormatter } from './formatter';

// Export utilities for advanced usage
export const currencyUtils = {
  /**
   * Format a number as Brazilian Real currency
   */
  formatCurrency: (value: number): string => {
    return currencyFormatter.formatCurrency(value);
  },

  /**
   * Parse a formatted currency string to number
   */
  parseCurrency: (value: string): number => {
    return currencyFormatter.parseCurrency(value);
  },

  /**
   * Get all currency inputs on the page
   */
  getAllCurrencyInputs: (): NodeListOf<HTMLInputElement> => {
    return document.querySelectorAll('input[data-currency="true"]');
  },

  /**
   * Manually trigger formatting on all currency inputs
   */
  refreshAllInputs: (): void => {
    currencyFormatter.initialize();
  },
};

// Default export for convenience
export default {
  currencyFormatter,
  WebflowCurrencyInit,
  currencyUtils,
};
