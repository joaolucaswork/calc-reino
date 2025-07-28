/**
 * Currency Types
 * Type definitions for the currency module
 */

export type Operation = 'add' | 'subtract' | 'multiply' | 'divide';

export interface CurrencyInstance {
  value: number;
  add: (value: number | CurrencyInstance) => CurrencyInstance;
  subtract: (value: number | CurrencyInstance) => CurrencyInstance;
  multiply: (value: number | CurrencyInstance) => CurrencyInstance;
  divide: (value: number | CurrencyInstance) => CurrencyInstance;
}

export interface CurrencyValue {
  value: number;
  formatted: string;
  currencyValue: CurrencyInstance;
}

export interface CurrencyInputConfig {
  selector: string;
  autoFormat: boolean;
  allowNegative: boolean;
  maxValue?: number;
  minValue?: number;
}

export interface CurrencyControlConfig {
  increaseSelector: string;
  decreaseSelector: string;
  mainInputSelector: string;
  enableSmartIncrement: boolean;
}

export interface IncrementThreshold {
  max: number;
  increment: number;
}

export interface CurrencyEvent extends CustomEvent {
  detail: CurrencyValue;
}

// Global type declarations for external libraries
declare global {
  interface Window {
    currency: (value: number | string) => CurrencyInstance;
    calculateCurrency?: (value1: number, value2: number, operation?: Operation) => CurrencyInstance;
    formatCurrency?: (value: number) => string;
  }
}
