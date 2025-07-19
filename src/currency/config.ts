/**
 * Currency Module Configuration
 *
 * Configuration options for the currency formatter
 */

export interface CurrencyConfig {
  symbol: string;
  decimal: string;
  separator: string;
  precision: number;
  pattern: string;
  negativePattern: string;
}

export const DEFAULT_BRL_CONFIG: CurrencyConfig = {
  symbol: 'R$ ',
  decimal: ',',
  separator: '.',
  precision: 2,
  pattern: '# !',
  negativePattern: '- # !',
};

export const CURRENCY_SELECTORS = {
  currencyInput: 'input[data-currency="true"]',
  currencyForm: 'form:has(input[data-currency="true"])',
  currencyContainer: '.currency-input-container',
} as const;

export const CURRENCY_CLASSES = {
  currencyInput: 'currency-input',
  currencySymbol: 'currency-symbol',
  currencyContainer: 'currency-input-container',
} as const;

export const CURRENCY_STYLES = {
  styleId: 'currency-formatter-styles',
  symbolLeftPadding: '45px',
  symbolLeftPaddingMobile: '40px',
  symbolPosition: '12px',
  symbolPositionMobile: '10px',
} as const;

export const CURRENCY_EVENTS = {
  input: 'input',
  paste: 'paste',
  focus: 'focus',
  blur: 'blur',
  submit: 'submit',
} as const;

export const WEBFLOW_CLASSES = {
  input: 'w-input',
  form: 'w-form',
  dynItem: 'w-dyn-item',
  dynItems: 'w-dyn-items',
} as const;

export const RESPONSIVE_BREAKPOINTS = {
  mobile: 479,
  tablet: 767,
  desktop: 992,
} as const;
