import { expect, test } from '@playwright/test';

test.describe('Currency Formatter', () => {
  test.beforeEach(async ({ page }) => {
    // Create a test HTML page with currency inputs
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Currency Formatter Test</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .form-group { margin-bottom: 20px; }
          label { display: block; margin-bottom: 5px; font-weight: bold; }
          input { padding: 10px; width: 200px; font-size: 16px; }
          .currency-input { padding-left: 45px !important; }
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
        </style>
      </head>
      <body>
        <h1>Currency Formatter Test</h1>
        <form id="test-form">
          <div class="form-group">
            <label for="price">Price:</label>
            <input type="text" id="price" name="price" data-currency="true" placeholder="0,00">
          </div>
          <div class="form-group">
            <label for="min-price">Min Price:</label>
            <input type="text" id="min-price" name="min_price" data-currency="true" placeholder="Preço mínimo">
          </div>
          <div class="form-group">
            <label for="max-price">Max Price:</label>
            <input type="text" id="max-price" name="max_price" data-currency="true" placeholder="Preço máximo">
          </div>
          <div class="form-group">
            <label for="regular-input">Regular Input (no formatting):</label>
            <input type="text" id="regular-input" name="regular_input" placeholder="Regular input">
          </div>
          <button type="submit">Submit</button>
        </form>
        <script src="/dist/currency/index.js"></script>
      </body>
      </html>
    `);
  });

  test('should format currency input correctly', async ({ page }) => {
    const priceInput = page.locator('#price');

    // Type a number
    await priceInput.fill('1234.56');

    // Wait for formatting to apply
    await page.waitForTimeout(100);

    // Check if the value is formatted correctly
    const value = await priceInput.inputValue();
    expect(value).toBe('1.234,56');
  });

  test('should handle decimal input correctly', async ({ page }) => {
    const priceInput = page.locator('#price');

    // Type a decimal number
    await priceInput.fill('1234,56');

    // Wait for formatting to apply
    await page.waitForTimeout(100);

    // Check if the value is formatted correctly
    const value = await priceInput.inputValue();
    expect(value).toBe('1.234,56');
  });

  test('should handle large numbers correctly', async ({ page }) => {
    const priceInput = page.locator('#price');

    // Type a large number
    await priceInput.fill('1234567.89');

    // Wait for formatting to apply
    await page.waitForTimeout(100);

    // Check if the value is formatted correctly
    const value = await priceInput.inputValue();
    expect(value).toBe('1.234.567,89');
  });

  test('should create hidden input with numeric value', async ({ page }) => {
    const priceInput = page.locator('#price');

    // Type a formatted number
    await priceInput.fill('1234.56');

    // Wait for formatting to apply
    await page.waitForTimeout(100);

    // Check if hidden input is created with numeric value
    const hiddenInput = page.locator('input[name="price_numeric"]');
    await expect(hiddenInput).toHaveValue('1234.56');
  });

  test('should handle empty input correctly', async ({ page }) => {
    const priceInput = page.locator('#price');

    // Clear the input
    await priceInput.fill('');

    // Wait for formatting to apply
    await page.waitForTimeout(100);

    // Check if the value is empty
    const value = await priceInput.inputValue();
    expect(value).toBe('');
  });

  test('should handle zero correctly', async ({ page }) => {
    const priceInput = page.locator('#price');

    // Type zero
    await priceInput.fill('0');

    // Wait for formatting to apply
    await page.waitForTimeout(100);

    // Check if the value is empty (zero is treated as empty)
    const value = await priceInput.inputValue();
    expect(value).toBe('');
  });

  test('should not format regular inputs', async ({ page }) => {
    const regularInput = page.locator('#regular-input');

    // Type a number in regular input
    await regularInput.fill('1234.56');

    // Wait for any potential formatting
    await page.waitForTimeout(100);

    // Check if the value remains unchanged
    const value = await regularInput.inputValue();
    expect(value).toBe('1234.56');
  });

  test('should handle form submission correctly', async ({ page }) => {
    const priceInput = page.locator('#price');
    const form = page.locator('#test-form');

    // Type a formatted number
    await priceInput.fill('1234.56');

    // Wait for formatting to apply
    await page.waitForTimeout(100);

    // Listen for form submission
    await page.evaluate(() => {
      const form = document.getElementById('test-form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        (window as any).submittedData = Object.fromEntries(formData);
      });
    });

    // Submit the form
    await form.click();
    await page.locator('button[type="submit"]').click();

    // Check if numeric value is submitted
    const submittedData = await page.evaluate(() => (window as any).submittedData);
    expect(submittedData.price_numeric).toBe('1234.56');
  });

  test('should handle multiple currency inputs', async ({ page }) => {
    const minPriceInput = page.locator('#min-price');
    const maxPriceInput = page.locator('#max-price');

    // Type values in both inputs
    await minPriceInput.fill('100');
    await maxPriceInput.fill('500.75');

    // Wait for formatting to apply
    await page.waitForTimeout(100);

    // Check if both values are formatted correctly
    const minValue = await minPriceInput.inputValue();
    const maxValue = await maxPriceInput.inputValue();

    expect(minValue).toBe('100,00');
    expect(maxValue).toBe('500,75');
  });

  test('should handle pasting values', async ({ page }) => {
    const priceInput = page.locator('#price');

    // Paste a value
    await priceInput.fill('');
    await page.evaluate(() => {
      const input = document.getElementById('price') as HTMLInputElement;
      input.focus();

      // Simulate paste event
      const clipboardEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer(),
      });
      clipboardEvent.clipboardData.setData('text/plain', '9876.54');
      input.dispatchEvent(clipboardEvent);

      // Set the value (simulating what paste would do)
      input.value = '9876.54';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Wait for formatting to apply
    await page.waitForTimeout(100);

    // Check if the pasted value is formatted correctly
    const value = await priceInput.inputValue();
    expect(value).toBe('9.876,54');
  });
});
