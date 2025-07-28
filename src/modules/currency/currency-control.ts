/**
 * Currency Control
 * Handles smart increment/decrement buttons for currency inputs
 * Extracted from fresh-reino project
 */

import type { IncrementThreshold } from './types';

export class CurrencyControl {
  private mainInput: HTMLInputElement | null = null;
  private isInitialized = false;

  private readonly incrementThresholds: IncrementThreshold[] = [
    { max: 1000, increment: 100 },
    { max: 10000, increment: 1000 },
    { max: 100000, increment: 10000 },
    { max: 1000000, increment: 50000 },
    { max: Number.POSITIVE_INFINITY, increment: 100000 },
  ];

  /**
   * Initialize currency control system
   */
  public init(): void {
    if (this.isInitialized) return;

    this.mainInput = document.querySelector('[is-main="true"]');
    if (!this.mainInput) {
      console.error('Main currency input not found');
      return;
    }

    this.setupControlButtons();
    this.isInitialized = true;
  }

  /**
   * Setup increase/decrease control buttons
   */
  private setupControlButtons(): void {
    if (!this.mainInput) return;

    const decreaseButtons = document.querySelectorAll<HTMLButtonElement>(
      '[currency-control="decrease"]'
    );
    const increaseButtons = document.querySelectorAll<HTMLButtonElement>(
      '[currency-control="increase"]'
    );

    // Setup decrease buttons
    decreaseButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        this.handleDecrease();
      });
    });

    // Setup increase buttons
    increaseButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        this.handleIncrease();
      });
    });
  }

  /**
   * Handle decrease button click
   */
  private handleDecrease(): void {
    if (!this.mainInput) return;

    const current = this.getCurrentValue();
    const increment = this.getSmartIncrement(current);
    const newValue = Math.max(0, current - increment);

    this.updateValue(newValue);
  }

  /**
   * Handle increase button click
   */
  private handleIncrease(): void {
    if (!this.mainInput) return;

    const current = this.getCurrentValue();
    const increment = this.getSmartIncrement(current);
    const newValue = current + increment;

    this.updateValue(newValue);
  }

  /**
   * Get current value from main input
   */
  private getCurrentValue(): number {
    if (!this.mainInput) return 0;

    const cleanValue = this.mainInput.value.replace(/[^\d,]/g, '').replace(',', '.');

    return Number.parseFloat(cleanValue) || 0;
  }

  /**
   * Calculate smart increment based on current value
   */
  private getSmartIncrement(value: number): number {
    for (const threshold of this.incrementThresholds) {
      if (value < threshold.max) {
        return threshold.increment;
      }
    }
    return this.incrementThresholds[this.incrementThresholds.length - 1].increment;
  }

  /**
   * Update input value with formatting
   */
  private updateValue(newValue: number): void {
    if (!this.mainInput) return;

    // Format value using Brazilian Real formatting
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(newValue);

    this.mainInput.value = formatted;

    // Dispatch input event to trigger other systems
    this.mainInput.dispatchEvent(
      new Event('input', {
        bubbles: true,
      })
    );
  }

  /**
   * Get smart increment for external usage
   */
  public getSmartIncrementForValue(value: number): number {
    return this.getSmartIncrement(value);
  }

  /**
   * Manually update the main input value
   */
  public setValue(value: number): void {
    this.updateValue(value);
  }

  /**
   * Get current value for external usage
   */
  public getValue(): number {
    return this.getCurrentValue();
  }

  /**
   * Check if the control system is initialized
   */
  public getInitializationStatus(): boolean {
    return this.isInitialized;
  }
}
