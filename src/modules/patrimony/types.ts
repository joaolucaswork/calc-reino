/**
 * Patrimony Types
 * Type definitions for the patrimony allocation system
 */

export interface AllocationItem {
  container: HTMLElement;
  activeItem: HTMLElement;
  disabledItem: HTMLElement;
  input: HTMLInputElement;
  slider: HTMLInputElement;
  percentageDisplay: HTMLElement | null;
  valorProduto: HTMLElement | null;
  percentageDisabled: HTMLElement | null;
  backgroundItemAcao: HTMLElement | null;
  index: number;
  value: number;
  percentage: number;
  maxAllowed: number;
}

export interface AllocationStatus {
  mainValue: number;
  totalAllocated: number;
  remaining: number;
  isFullyAllocated: boolean;
  isOverAllocated: boolean;
  percentageAllocated: number;
}

export interface AllocationChange {
  index: number;
  value: number;
  percentage: number;
  formatted: string;
  remaining: number;
}

export interface CacheManager {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  remove(key: string): void;
}

export interface PatrimonyConfig {
  mainInputSelector: string;
  allocationItemSelector: string;
  cacheKey: string;
  allocationsCacheKey: string;
  updateDelay: number;
  animationDuration: number;
}

export interface Utils {
  parseCurrencyValue(value: string): number;
  formatCurrency(value: number): string;
  calculatePercentage(value: number, total: number): number;
  formatPercentage(value: number): string;
  debounce<T extends (...args: unknown[]) => void>(func: T, wait: number): T;
}

export interface MainInputSync {
  input: HTMLInputElement | null;
  init(): void;
  getValue(): number;
  setValue(value: number): void;
  handleValueChange(value: number): void;
}

export interface AllocationSync {
  items: AllocationItem[];
  init(): void;
  updateAllAllocations(): void;
  validateAllAllocations(): void;
  getTotalAllocated(): number;
  getRemainingValue(): number;
}
