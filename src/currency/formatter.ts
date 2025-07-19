import currency from 'currency.js';

/**
 * Currency formatter for Webflow forms
 * Automatically detects and formats input fields with data-currency="true"
 * Formats values as Brazilian Real (BRL) with "R$" symbol
 */
export class CurrencyFormatter {
  private static instance: CurrencyFormatter;
  private initialized = false;
  private formattedInputs = new WeakMap<HTMLInputElement, boolean>();

  // Brazilian Real formatting configuration
  private readonly currencyConfig = {
    symbol: 'R$ ',
    decimal: ',',
    separator: '.',
    precision: 2,
    pattern: '# !',
    negativePattern: '- # !',
  };

  /**
   * Singleton pattern to ensure only one instance exists
   */
  static getInstance(): CurrencyFormatter {
    if (!CurrencyFormatter.instance) {
      CurrencyFormatter.instance = new CurrencyFormatter();
    }
    return CurrencyFormatter.instance;
  }

  /**
   * Initialize the currency formatter
   * Should be called after DOM is ready
   */
  public initialize(): void {
    if (this.initialized) return;

    this.setupInitialInputs();
    this.observeNewInputs();
    this.initialized = true;
  }

  /**
   * Format existing inputs on page load
   */
  private setupInitialInputs(): void {
    const currencyInputs = document.querySelectorAll<HTMLInputElement>(
      'input[data-currency="true"]'
    );

    currencyInputs.forEach((input) => {
      this.formatInput(input);
    });
  }

  /**
   * Observe for new inputs added dynamically
   */
  private observeNewInputs(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // Check if the added element is a currency input
            if (element.matches('input[data-currency="true"]')) {
              this.formatInput(element as HTMLInputElement);
            }

            // Check for currency inputs within the added element
            const childInputs = element.querySelectorAll<HTMLInputElement>(
              'input[data-currency="true"]'
            );
            childInputs.forEach((input) => {
              this.formatInput(input);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Format a single input element
   */
  private formatInput(input: HTMLInputElement): void {
    if (this.formattedInputs.has(input)) return;

    this.formattedInputs.set(input, true);

    // Set up the input styling for fixed currency symbol
    this.setupInputStyling(input);

    // Set initial value if exists
    if (input.value) {
      this.updateInputValue(input, input.value);
    }

    // Add event listeners
    this.addEventListeners(input);
  }

  /**
   * Setup CSS styling for fixed currency symbol
   */
  private setupInputStyling(input: HTMLInputElement): void {
    // Add a class for styling
    input.classList.add('currency-input');

    // Apply inline styles for immediate effect
    input.style.paddingLeft = '45px';
    input.style.textAlign = 'left';

    // Create or update the pseudo-element style
    this.injectCurrencyStyles();

    // Set placeholder if not already set
    if (!input.placeholder) {
      input.placeholder = '0,00';
    }
  }

  /**
   * Inject CSS styles for currency inputs
   */
  private injectCurrencyStyles(): void {
    const styleId = 'currency-formatter-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `
      .currency-input {
        position: relative;
        padding-left: 45px !important;
        text-align: left !important;
      }
      
      .currency-input::before {
        content: "R$ ";
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #666;
        font-weight: 500;
        pointer-events: none;
        z-index: 1;
      }
      
      .currency-input-container {
        position: relative;
        display: inline-block;
        width: 100%;
      }
      
      .currency-symbol {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #666;
        font-weight: 500;
        pointer-events: none;
        z-index: 2;
      }
      
      /* Responsive adjustments */
      @media (max-width: 479px) {
        .currency-input {
          padding-left: 40px !important;
        }
        
        .currency-input::before,
        .currency-symbol {
          left: 10px;
          font-size: 14px;
        }
      }
    `;
  }

  /**
   * Add event listeners to handle user input
   */
  private addEventListeners(input: HTMLInputElement): void {
    // Handle input events
    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.handleInput(target);
    });

    // Handle paste events
    input.addEventListener('paste', (e) => {
      setTimeout(() => {
        const target = e.target as HTMLInputElement;
        this.handleInput(target);
      }, 0);
    });

    // Handle focus events
    input.addEventListener('focus', (e) => {
      const target = e.target as HTMLInputElement;
      this.handleFocus(target);
    });

    // Handle blur events
    input.addEventListener('blur', (e) => {
      const target = e.target as HTMLInputElement;
      this.handleBlur(target);
    });
  }

  /**
   * Handle input events
   */
  private handleInput(input: HTMLInputElement): void {
    const cursorPosition = input.selectionStart || 0;
    const oldValue = input.value;

    this.updateInputValue(input, input.value);

    // Restore cursor position
    this.restoreCursorPosition(input, cursorPosition, oldValue);
  }

  /**
   * Handle focus events
   */
  private handleFocus(input: HTMLInputElement): void {
    // Select all text except the currency symbol area
    setTimeout(() => {
      if (input.value && input.value.length > 0) {
        input.setSelectionRange(0, input.value.length);
      }
    }, 0);
  }

  /**
   * Handle blur events
   */
  private handleBlur(input: HTMLInputElement): void {
    // Ensure proper formatting on blur
    if (input.value) {
      this.updateInputValue(input, input.value);
    }
  }

  /**
   * Update input value with currency formatting
   */
  private updateInputValue(input: HTMLInputElement, value: string): void {
    try {
      // Clean the input value
      const cleanValue = this.cleanValue(value);

      // If empty, clear the input
      if (cleanValue === '' || cleanValue === '0') {
        input.value = '';
        this.setHiddenValue(input, '0');
        return;
      }

      // Format the value
      const formattedValue = this.formatValue(cleanValue);

      // Update the input
      input.value = formattedValue;

      // Store the numeric value for form submission
      this.setHiddenValue(input, cleanValue);
    } catch (error) {
      console.error('Currency formatting error:', error);
      // Fallback to original value if formatting fails
      input.value = value;
    }
  }

  /**
   * Clean the input value by removing non-numeric characters
   */
  private cleanValue(value: string): string {
    if (!value) return '';

    // Remove currency symbols, spaces, and non-numeric characters except decimal separators
    let cleaned = value.replace(/[^\d,.-]/g, '');

    // Handle Brazilian decimal format (comma as decimal separator)
    // Convert comma to dot for processing
    cleaned = cleaned.replace(',', '.');

    // Remove extra dots, keeping only the last one
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
    }

    // Ensure valid number format
    const numericValue = parseFloat(cleaned);
    return isNaN(numericValue) ? '' : numericValue.toString();
  }

  /**
   * Format value using currency.js
   */
  private formatValue(value: string): string {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return '';

    const formatted = currency(numericValue, this.currencyConfig);

    // Remove the symbol since we display it separately
    return formatted.format().replace('R$ ', '');
  }

  /**
   * Set hidden value for form submission
   */
  private setHiddenValue(input: HTMLInputElement, value: string): void {
    const hiddenInputName = input.name ? `${input.name}_numeric` : 'currency_numeric';
    let hiddenInput = document.querySelector(
      `input[name="${hiddenInputName}"]`
    ) as HTMLInputElement;

    if (!hiddenInput) {
      hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = hiddenInputName;
      input.form?.appendChild(hiddenInput);
    }

    hiddenInput.value = value;

    // Also set data attribute for easy access
    input.dataset.numericValue = value;
  }

  /**
   * Restore cursor position after formatting
   */
  private restoreCursorPosition(input: HTMLInputElement, position: number, oldValue: string): void {
    const newValue = input.value;

    // If the value didn't change, keep the same position
    if (oldValue === newValue) {
      input.setSelectionRange(position, position);
      return;
    }

    // Calculate new position based on the difference in length
    const lengthDiff = newValue.length - oldValue.length;
    const newPosition = Math.max(0, Math.min(position + lengthDiff, newValue.length));

    input.setSelectionRange(newPosition, newPosition);
  }

  /**
   * Get the numeric value from a formatted input
   */
  public getNumericValue(input: HTMLInputElement): number {
    const { numericValue } = input.dataset;
    return numericValue ? parseFloat(numericValue) : 0;
  }

  /**
   * Set the value of a currency input programmatically
   */
  public setValue(input: HTMLInputElement, value: number): void {
    this.updateInputValue(input, value.toString());
  }

  /**
   * Format a numeric value as currency (public method)
   */
  public formatCurrency(value: number): string {
    return this.formatValue(value.toString());
  }

  /**
   * Parse a formatted currency string to number (public method)
   */
  public parseCurrency(value: string): number {
    const cleaned = this.cleanValue(value);
    return parseFloat(cleaned) || 0;
  }

  /**
   * Destroy the formatter and clean up event listeners
   */
  public destroy(): void {
    const styleElement = document.getElementById('currency-formatter-styles');
    if (styleElement) {
      styleElement.remove();
    }

    this.formattedInputs = new WeakMap();
    this.initialized = false;
  }
}

// Export the singleton instance
export const currencyFormatter = CurrencyFormatter.getInstance();
