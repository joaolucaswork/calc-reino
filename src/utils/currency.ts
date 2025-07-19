/**
 * Currency Utilities
 *
 * Helper functions for currency handling and formatting
 */

/**
 * Brazilian Real currency configuration
 */
export const BRL_CONFIG = {
  symbol: 'R$ ',
  decimal: ',',
  separator: '.',
  precision: 2,
  pattern: '# !',
  negativePattern: '- # !',
};

/**
 * Format number as Brazilian Real currency string
 */
export const formatBRL = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Parse Brazilian Real currency string to number
 */
export const parseBRL = (value: string): number => {
  if (!value) return 0;

  // Remove currency symbols and spaces
  let cleaned = value.replace(/[^\d,.-]/g, '');

  // Handle Brazilian decimal format (comma as decimal separator)
  cleaned = cleaned.replace(',', '.');

  // Remove extra dots, keeping only the last one
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
  }

  const numericValue = parseFloat(cleaned);
  return isNaN(numericValue) ? 0 : numericValue;
};

/**
 * Validate if a string is a valid currency format
 */
export const isValidCurrency = (value: string): boolean => {
  const parsed = parseBRL(value);
  return !isNaN(parsed) && parsed >= 0;
};

/**
 * Get currency symbol for Brazilian Real
 */
export const getCurrencySymbol = (): string => {
  return BRL_CONFIG.symbol;
};

/**
 * Clean currency input value
 */
export const cleanCurrencyValue = (value: string): string => {
  if (!value) return '';

  // Remove currency symbols, spaces, and non-numeric characters except decimal separators
  let cleaned = value.replace(/[^\d,.-]/g, '');

  // Handle Brazilian decimal format (comma as decimal separator)
  cleaned = cleaned.replace(',', '.');

  // Remove extra dots, keeping only the last one
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
  }

  return cleaned;
};

/**
 * Format currency for display (without symbol)
 */
export const formatCurrencyDisplay = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Check if element is a currency input
 */
export const isCurrencyInput = (element: Element): element is HTMLInputElement => {
  return element.matches('input[data-currency="true"]');
};

/**
 * Get all currency inputs in a container
 */
export const getCurrencyInputs = (
  container: Element | Document = document
): NodeListOf<HTMLInputElement> => {
  return container.querySelectorAll('input[data-currency="true"]');
};
