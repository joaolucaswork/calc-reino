/**
 * Currency Module Types
 *
 * TypeScript type definitions for the currency module
 */

export interface CurrencyFormatterInterface {
  initialize(): void;
  getNumericValue(input: HTMLInputElement): number;
  setValue(input: HTMLInputElement, value: number): void;
  formatCurrency(value: number): string;
  parseCurrency(value: string): number;
  destroy(): void;
}

export interface WebflowCurrencyInterface {
  initialize(): void;
  getFormattedValue(input: HTMLInputElement): string;
  getNumericValue(input: HTMLInputElement): number;
  setValue(input: HTMLInputElement, value: number): void;
  formatInput(selector: string): void;
  destroy(): void;
}

export interface CurrencyUtils {
  formatCurrency(value: number): string;
  parseCurrency(value: string): number;
  getAllCurrencyInputs(): NodeListOf<HTMLInputElement>;
  refreshAllInputs(): void;
}

export type CurrencyInputEvent = 'input' | 'paste' | 'focus' | 'blur';
export type CurrencyFormEvent = 'submit';

export interface CurrencyEventHandlers {
  onInput?: (input: HTMLInputElement, value: string) => void;
  onFocus?: (input: HTMLInputElement) => void;
  onBlur?: (input: HTMLInputElement) => void;
  onPaste?: (input: HTMLInputElement, value: string) => void;
}

export interface CurrencyFormatOptions {
  showSymbol?: boolean;
  precision?: number;
  locale?: string;
}

export interface CurrencyValidationResult {
  isValid: boolean;
  error?: string;
  numericValue?: number;
}
