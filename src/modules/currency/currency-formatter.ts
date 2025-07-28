/**
 * Currency Formatter
 * Handles Brazilian Real (BRL) formatting with Currency.js integration
 * Extracted from fresh-reino project
 */

import type { CurrencyInstance, CurrencyValue, Operation } from './types';

export class CurrencyFormatter {
  private isInitialized = false;

  /**
   * Initialize currency formatting system
   */
  public init(): void {
    if (this.isInitialized) return;

    // Wait for Webflow to load completely
    if (window.Webflow) {
      window.Webflow.push(() => {
        this.initializeCurrencySystem();
      });
    }

    // Fallback if Webflow is not available
    setTimeout(() => this.initializeCurrencySystem(), 100);
  }

  /**
   * Initialize currency system for all inputs
   */
  public initializeCurrencySystem(): void {
    this.initializeCurrencyInputs();
    this.setupGlobalFunctions();
    this.setupDynamicObserver();
    this.isInitialized = true;
  }

  /**
   * Initialize all currency inputs
   */
  public initializeCurrencyInputs(): void {
    const currencyInputs = document.querySelectorAll<HTMLInputElement>('[data-currency="true"]');

    currencyInputs.forEach((input) => {
      if (!input) return;

      // Remove existing listeners to avoid duplication
      this.removeExistingListeners(input);

      // Add new listeners
      input.addEventListener('input', this.handleCurrencyInput.bind(this));
      input.addEventListener('focus', this.handleCurrencyFocus.bind(this));
      input.addEventListener('blur', this.handleCurrencyBlur.bind(this));

      // Apply initial formatting if value exists
      if (input.value && input.value !== input.placeholder) {
        this.formatCurrencyInput(input);
      }
    });
  }

  /**
   * Format currency input while typing
   */
  public formatCurrencyInput(input: HTMLInputElement): number {
    const value = input.value.replace(/\D/g, '');

    if (value === '') {
      input.value = '';
      return 0;
    }

    // Convert cents to reais
    const numericValue = Number.parseInt(value, 10) / 100;

    // Format using Intl.NumberFormat
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);

    input.value = formatted;
    return numericValue;
  }

  /**
   * Get numeric value from formatted currency string
   */
  public getCurrencyValue(input: HTMLInputElement | string): number {
    const value = typeof input === 'string' ? input : input.value;
    const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    return Number.parseFloat(cleanValue) || 0;
  }

  /**
   * Format number to Brazilian Real currency
   */
  public formatBRL(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  /**
   * Calculate with Currency.js precision
   */
  public calculateCurrency(
    value1: number,
    value2: number,
    operation: Operation = 'add'
  ): CurrencyInstance {
    if (!window.currency) {
      throw new Error('Currency.js library not loaded');
    }

    const curr1 = window.currency(value1);
    const curr2 = window.currency(value2);

    switch (operation) {
      case 'add':
        return curr1.add(curr2);
      case 'subtract':
        return curr1.subtract(curr2);
      case 'multiply':
        return curr1.multiply(curr2);
      case 'divide':
        return curr1.divide(curr2);
      default:
        return curr1;
    }
  }

  /**
   * Handle currency input changes
   */
  private handleCurrencyInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const numericValue = this.formatCurrencyInput(input);

    // Dispatch custom event for other scripts
    input.dispatchEvent(
      new CustomEvent<CurrencyValue>('currencyChange', {
        detail: {
          value: numericValue,
          currencyValue: window.currency(numericValue),
          formatted: this.formatBRL(numericValue),
        },
      })
    );
  }

  /**
   * Handle currency input focus
   */
  private handleCurrencyFocus(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = this.getCurrencyValue(input);

    if (value > 0) {
      input.value = value.toFixed(2).replace('.', ',');
    }
  }

  /**
   * Handle currency input blur
   */
  private handleCurrencyBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.formatCurrencyInput(input);
  }

  /**
   * Remove existing event listeners
   */
  private removeExistingListeners(input: HTMLInputElement): void {
    // Clone node to remove all listeners
    const newInput = input.cloneNode(true) as HTMLInputElement;
    if (input.parentNode) {
      input.parentNode.replaceChild(newInput, input);
    }
  }

  /**
   * Setup global utility functions
   */
  private setupGlobalFunctions(): void {
    // Make calculate function globally available
    window.calculateCurrency = this.calculateCurrency.bind(this);
    window.formatCurrency = this.formatBRL.bind(this);
  }

  /**
   * Setup DOM mutation observer for dynamic content
   */
  private setupDynamicObserver(): void {
    if (!window.Webflow) return;

    window.Webflow.push(() => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) {
            setTimeout(() => this.initializeCurrencyInputs(), 50);
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }
}
