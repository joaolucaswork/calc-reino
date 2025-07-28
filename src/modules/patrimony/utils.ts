/**
 * Utility functions for patrimony system
 */

export class Utils {
  /**
   * Parse currency value from formatted string
   */
  public parseCurrencyValue(value: string): number {
    if (!value || typeof value !== 'string') return 0;
    const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    return Number.parseFloat(cleanValue) || 0;
  }

  /**
   * Format number to Brazilian currency
   */
  public formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Calculate percentage
   */
  public calculatePercentage(value: number, total: number): number {
    if (!total || total === 0) return 0;
    return (value / total) * 100;
  }

  /**
   * Format percentage display
   */
  public formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Debounce function for performance
   */
  public debounce<T extends (...args: unknown[]) => void>(func: T, wait: number): T {
    let timeout: number;
    return ((...args: Parameters<T>) => {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = window.setTimeout(later, wait);
    }) as T;
  }
}
