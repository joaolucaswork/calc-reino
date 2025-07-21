# Webflow Currency Formatter

A comprehensive currency formatting solution for Webflow forms that automatically formats Brazilian Real (BRL) currency inputs in real-time.

## Features

- **Automatic Detection**: Automatically detects and formats any input field with `data-currency="true"`
- **Brazilian Real Format**: Formats values as "R$ 1.234,56" with proper thousands separators and decimal comma
- **Fixed Symbol Position**: The "R$" symbol remains visually fixed on the left side, regardless of value length
- **Real-time Formatting**: Formats values as users type for immediate feedback
- **Form-ready**: Preserves numeric values for proper form submission
- **Responsive Design**: Works across all Webflow breakpoints (Desktop, Tablet, Mobile)
- **Zero Configuration**: Works with any form added to Webflow without additional setup

## Installation

### 1. Build the Project

```bash
# Install dependencies
pnpm install

# Build for production
pnpm run build
```

This will generate the compiled JavaScript file in the `dist/` directory.

### 2. Add to Webflow

#### Option A: Host the files externally and import

1. Upload the generated `dist/index.js` file to your hosting service
2. Upload the `src/currency-formatter.css` file to your hosting service
3. In your Webflow project, go to **Project Settings** → **Custom Code**
4. Add the CSS file in the **Head Code** section:

```html
<link rel="stylesheet" href="https://your-domain.com/path/to/currency-formatter.css">
```

5. Add the JavaScript file in the **Footer Code** section:

```html
<script src="https://your-domain.com/path/to/index.js"></script>
```

#### Option B: Embed directly in Webflow

1. Copy the contents of `dist/index.js`
2. In your Webflow project, go to **Project Settings** → **Custom Code**
3. Add the CSS in the **Head Code** section:

```html
<style>
/* Copy the contents of src/currency-formatter.css here */
</style>
```

4. Add the JavaScript in the **Footer Code** section:

```html
<script>
// Copy the contents of dist/index.js here
</script>
```

### 3. Configure Your Form Inputs

Simply add the `data-currency="true"` attribute to any input field you want to format as currency:

```html
<input type="text" data-currency="true" name="price" placeholder="0,00">
```

## Usage

### Basic Usage

1. Add the `data-currency="true"` attribute to any input field
2. The formatter will automatically detect and format the input
3. Users can type normally, and the value will be formatted in real-time

### Advanced Usage

The formatter exposes additional JavaScript methods for programmatic control:

```javascript
// Get the numeric value from a currency input
const input = document.querySelector('input[data-currency="true"]');
const numericValue = WebflowCurrencyInit.getNumericValue(input);

// Set a value programmatically
WebflowCurrencyInit.setValue(input, 1500.50); // Will display as "1.500,50"

// Get the formatted display value
const formattedValue = WebflowCurrencyInit.getFormattedValue(input);

// Manually format a specific input (useful for dynamic content)
WebflowCurrencyInit.formatInput('input[name="dynamic-price"]');
```

## How It Works

### Input Processing

1. **Detection**: The formatter scans for inputs with `data-currency="true"`
2. **Real-time Formatting**: As users type, values are formatted using Brazilian Real conventions
3. **Value Storage**: Both formatted (for display) and numeric (for processing) values are maintained
4. **Form Submission**: Hidden inputs are created with numeric values for proper form processing

### Currency Format

- **Symbol**: "R$ " (fixed position on the left)
- **Thousands Separator**: "." (dot)
- **Decimal Separator**: "," (comma)
- **Decimal Places**: 2
- **Example**: R$ 1.234,56

### Form Integration

When a form is submitted, the formatter automatically creates hidden inputs with numeric values:

- Original input: `price="1.234,56"` (formatted display)
- Hidden input: `price_numeric="1234.56"` (numeric value for processing)

## Webflow Integration Details

### Compatibility

- ✅ Works with all Webflow form elements
- ✅ Compatible with Webflow CMS dynamic content
- ✅ Responsive across all breakpoints
- ✅ Works with Webflow interactions and animations
- ✅ Compatible with custom form styling

### Webflow-Specific Features

- **Auto-initialization**: Automatically initializes on both `DOMContentLoaded` and `Webflow.ready()`
- **Dynamic Content**: Handles CMS-generated forms and dynamic content
- **Interaction Support**: Works with Webflow's show/hide interactions
- **Form Validation**: Maintains compatibility with Webflow's form validation

### CSS Integration

The formatter includes comprehensive CSS that:

- Maintains the fixed "R$" symbol position
- Respects Webflow's responsive breakpoints
- Works with Webflow's form styling classes
- Supports dark mode and high contrast
- Provides smooth transitions and animations

## Examples

### Basic Form Input

```html
<form>
  <input type="text" data-currency="true" name="price" placeholder="0,00" required>
  <input type="submit" value="Submit">
</form>
```

### Multiple Currency Inputs

```html
<form>
  <input type="text" data-currency="true" name="min_price" placeholder="Preço mínimo">
  <input type="text" data-currency="true" name="max_price" placeholder="Preço máximo">
  <input type="submit" value="Buscar">
</form>
```

### Dynamic Content (CMS)

```html
<!-- This will work automatically when the CMS content loads -->
<div class="w-dyn-items">
  <div class="w-dyn-item">
    <input type="text" data-currency="true" name="product_price" placeholder="Preço do produto">
  </div>
</div>
```

## Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Common Issues

1. **Currency symbol not showing**: Ensure the CSS file is properly loaded
2. **Formatting not working**: Check that the JavaScript file is loaded after the DOM
3. **Form submission issues**: Verify that hidden inputs are being created (check network tab)

### Debug Mode

Enable debug mode by adding this to your console:

```javascript
// Check if currency formatter is initialized
console.log('Currency formatter initialized:', WebflowCurrencyInit);

// Check all currency inputs
const inputs = document.querySelectorAll('input[data-currency="true"]');
console.log('Currency inputs found:', inputs.length);

// Check numeric values
inputs.forEach(input => {
  console.log('Input value:', WebflowCurrencyInit.getNumericValue(input));
});
```

## Development

### Building

```bash
# Development mode with live reload
pnpm run dev

# Production build
pnpm run build

# Run tests
pnpm run test
```

### Testing

The project includes comprehensive tests that can be run with:

```bash
pnpm run test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the ISC License.
