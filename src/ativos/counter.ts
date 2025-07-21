/**
 * Ativos Counter
 *
 * Manages the dynamic counter for assets
 */

import { DEFAULT_SELECTORS } from './config';
import type { CounterUpdateEvent } from './types';

export class AtivosCounter {
  private static counterElement: HTMLElement | null = null;
  private static currentCount = 0;

  /**
   * Initialize the counter
   */
  public static initialize(): void {
    this.counterElement = document.querySelector(DEFAULT_SELECTORS.COUNTER);
    this.updateCounter();
  }

  /**
   * Get the current count of assets
   */
  public static getCount(): number {
    // Count ONLY items physically present in main drop area
    const mainDropArea = document.querySelector('.ativos_main_drop_area');
    let totalCount = 0;

    if (mainDropArea) {
      // Only count direct children of main drop area
      const items = mainDropArea.querySelectorAll(
        ':scope > .w-dyn-item, :scope > [data-ativo-item]'
      );
      totalCount = items.length;
    }

    this.currentCount = totalCount;
    return totalCount;
  }

  /**
   * Update the counter display
   */
  public static updateCounter(count?: number): void {
    if (!this.counterElement) {
      this.initialize();
    }

    const actualCount = count ?? this.getCount();
    this.currentCount = actualCount;

    if (this.counterElement) {
      this.counterElement.textContent = `(${actualCount})`;

      // Trigger custom event
      const event: CounterUpdateEvent = {
        count: actualCount,
        container: this.counterElement,
      };

      this.counterElement.dispatchEvent(
        new CustomEvent('counterUpdate', {
          detail: event,
          bubbles: true,
        })
      );
    }

    // Update container state classes
    this.updateContainerStates(actualCount);
  }

  /**
   * Update container state classes based on count
   * Note: Visual state management is now handled by the text-info_wrapper toggle system
   * This method is kept for any future container-specific logic
   */
  private static updateContainerStates(count: number): void {
    const mainDropArea = document.querySelector('.ativos_main_drop_area');

    // Only keep the ativos-has-items class for potential CSS styling needs
    if (mainDropArea) {
      if (count === 0) {
        mainDropArea.classList.remove('ativos-has-items');
      } else {
        mainDropArea.classList.add('ativos-has-items');
      }
    }
  }

  /**
   * Increment the counter
   */
  public static increment(): void {
    this.updateCounter(this.currentCount + 1);
  }

  /**
   * Decrement the counter
   */
  public static decrement(): void {
    const newCount = Math.max(0, this.currentCount - 1);
    this.updateCounter(newCount);
  }

  /**
   * Reset the counter
   */
  public static reset(): void {
    this.updateCounter(0);
  }
}
