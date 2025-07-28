/**
 * Calculator Module - Main Entry Point
 * Exports all calculator-related functionality in a modular structure
 */

export { PatrimonySync } from './core/PatrimonySync';
export { AllocationManager } from './core/AllocationManager';
export { CurrencyFormatter } from './utils/CurrencyFormatter';
export { ValidationEngine } from './core/ValidationEngine';
export { CacheManager } from './utils/CacheManager';

// Types
export type {
  PatrimonyState,
  AllocationItem,
  AssetCategory,
  ValidationResult,
  CurrencyValue,
} from './types';

// Hooks for React integration
export { usePatrimonySync } from './hooks/usePatrimonySync';
export { useAllocationValidation } from './hooks/useAllocationValidation';
export { useCurrencyInput } from './hooks/useCurrencyInput';

// Components for React
export { PatrimonyInput } from './components/PatrimonyInput';
export { AllocationSlider } from './components/AllocationSlider';
export { AssetAllocationGrid } from './components/AssetAllocationGrid';
export { ProgressIndicator } from './components/ProgressIndicator';
