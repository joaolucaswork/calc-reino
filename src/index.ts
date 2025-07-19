// Import and initialize modules
import './ativos';
import './currency';

// Export the currency module for advanced usage
export * from './currency';

// Export the ativos module for advanced usage
export * from './ativos';

// Export currency utilities
export * from './utils/currency';

// The currency formatter will automatically initialize when this script loads
// Any input with data-currency="true" will be automatically formatted as Brazilian Real (BRL)

// The ativos drag and drop functionality will automatically initialize when this script loads
// Elements with classes .ativos_main-list will become sortable containers
