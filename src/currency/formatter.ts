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

    // Check if input is already handled by another currency system
    if (
      input.dataset.component === 'currency-input' ||
      input.classList.contains('currency-input-wrapper')
    ) {
      // Skip inputs already handled by other currency systems
      return;
    }

    this.formattedInputs.set(input, true);

    // Mark this input as handled by this formatter
    input.dataset.currencyFormatter = 'main';

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
   * Setup CSS styling - jQuery approach (simple, no pseudo-elements)
   */
  private setupInputStyling(input: HTMLInputElement): void {
    // Add a class for styling
    input.classList.add('currency-input');

    // Apply jQuery-style inline styles
    input.style.textAlign = 'right'; // Right-aligned like jQuery version
    input.style.fontWeight = '500';

    // Set placeholder to match jQuery version
    input.placeholder = 'R$ 0.000,000,00';

    // No pseudo-element CSS injection needed - symbol is in the value
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
   * Handle input events - simplified approach
   */
  private handleInput(input: HTMLInputElement): void {
    const cursorPosition = input.selectionStart || 0;
    const oldValue = input.value;
    const oldLength = oldValue.length;

    // Update the input value with formatting
    this.updateInputValue(input, input.value);

    // Restore cursor position with jQuery approach
    this.restoreCursorPosition(input, cursorPosition, oldLength);
  }

  /**
   * Handle focus events - jQuery approach (minimal interference)
   */
  private handleFocus(_input: HTMLInputElement): void {
    // jQuery version doesn't interfere with focus - let natural cursor positioning work
    // No special handling needed
  }

  /**
   * Handle blur events - jQuery approach
   */
  private handleBlur(input: HTMLInputElement): void {
    // jQuery approach: only format if R$ is missing
    const { value } = input;
    if (value && !value.includes('R$')) {
      this.updateInputValue(input, value);
    }
  }

  /**
   * Update input value with currency formatting
   */
  private updateInputValue(input: HTMLInputElement, value: string): void {
    try {
      // Clean the input value
      const cleanValue = this.cleanValue(value);

      // If completely empty (no input at all), clear the input
      if (cleanValue === '' && value.trim() === '') {
        input.value = '';
        this.setHiddenValue(input, '0');
        return;
      }

      // Format the value (handles zeros and empty values properly)
      const formattedValue = this.formatValue(cleanValue);

      // Update the input
      input.value = formattedValue;

      // Store the numeric value for form submission
      const numericValue = cleanValue === '' ? '0' : cleanValue;
      this.setHiddenValue(input, numericValue);
    } catch (error) {
      console.error('Currency formatting error:', error);
      // Fallback to original value if formatting fails
      input.value = value;
    }
  }

  /**
   * Clean the input value - jQuery approach (extract only digits)
   */
  private cleanValue(value: string): string {
    if (!value) return '';

    // jQuery approach: extract only digits, treat as cents
    // This ensures consistency with formatValue logic
    return value.replace(/[^\d]/g, '');
  }

  /**
   * Format value using currency.js - jQuery approach with symbol included
   */
  private formatValue(value: string): string {
    // Extract only numbers from input
    const numeros = String(value).replace(/[^\d]/g, '');

    // Handle empty input - return R$ 0,00
    if (!numeros) {
      return 'R$ 0,00';
    }

    // Handle single zero or all zeros - return R$ 0,00
    if (parseInt(numeros, 10) === 0) {
      return 'R$ 0,00';
    }

    // Convert to cents then to reais (like jQuery version)
    const centavos = parseInt(numeros, 10);
    const reais = centavos / 100;

    try {
      // Use currency.js with correct TypeScript configuration
      const currencyConfig = {
        symbol: 'R$ ',
        precision: 2,
        decimal: ',',
        separator: '.',
        pattern: '! #', // Symbol first, then value (R$ 123,45)
        negativePattern: '- ! #', // Negative: - R$ 123,45
      };

      return currency(reais, currencyConfig).format();
    } catch (error) {
      console.error('Currency.js error, using fallback:', error);
      // Fallback to native formatting
      return reais.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
    }
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
   * Restore cursor position after formatting - jQuery approach (simple and effective)
   */
  private restoreCursorPosition(
    input: HTMLInputElement,
    position: number,
    oldLength: number
  ): void {
    const newValue = input.value;
    const newLength = newValue.length;

    // Calculate new position based on length difference (jQuery approach)
    const lengthDiff = newLength - oldLength;
    let newPosition = position + lengthDiff;

    // Ensure cursor is after "R$ " (minimum position 3)
    if (newPosition < 3) newPosition = 3;

    // Ensure position is within bounds
    if (newPosition > newLength) newPosition = newLength;

    // Use setTimeout to ensure the DOM has updated (like jQuery version)
    setTimeout(() => {
      input.setSelectionRange(newPosition, newPosition);
    }, 0);
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
