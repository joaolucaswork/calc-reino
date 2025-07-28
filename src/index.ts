// Import and initialize modules
import '../backup/ativos';

import currencyModule from './modules/currency';
import sectionVisibility from './modules/section-visibility';

// Export modules for advanced usage
export { default as ButtonAnimationSystem } from './modules/button-animations';
export { default as CurrencyModule } from './modules/currency';
export { default as CurrencyControlSystem } from './modules/currency-controls';
export { ProductItem, ProductItemManager } from './modules/motion';
export { default as SectionVisibility } from './modules/section-visibility';

// Export the ativos module for advanced usage
export * from '../backup/ativos';

// The currency module will automatically initialize when this script loads
// Any input with data-currency="true" will be automatically formatted as Brazilian Real (BRL)

// The section visibility module will automatically initialize when this script loads
// It will handle conditional visibility for .componente-alocao-float based on ._3-section-patrimonio-alocation

// The motion module will automatically initialize when this script loads
// Elements with classes .patrimonio_interactive_item will become interactive with Motion.js animations

// The currency controls module will automatically initialize when this script loads
// Buttons with [currency-control="increase|decrease"] will control the main input [is-main="true"]

// The button animations module will automatically initialize when this script loads
// Currency control buttons will have hover, press and ripple effects with Motion.js

// The ativos drag and drop functionality will automatically initialize when this script loads
// Elements with classes .ativos_main-list will become sortable containers

// Auto-initialize all modules
currencyModule.init();
sectionVisibility.init();

// Motion, currency controls, and button animations modules auto-initialize via DOMContentLoaded in their own files
