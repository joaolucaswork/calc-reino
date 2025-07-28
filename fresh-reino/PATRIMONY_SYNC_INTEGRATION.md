# Patrimony Sync System Integration Guide

## Overview
The Patrimony Sync System provides real-time synchronization between the main currency input and section 3 allocation inputs, with automatic percentage calculations, browser cache persistence, and validation to prevent over-allocation.

## Key Features
- **Main input synchronization** with global cache
- **Section 3 allocation synchronization** with bidirectional updates
- **Real-time validation** preventing total allocations from exceeding main value
- **Automatic synchronization** of `valor-produto` and `porcentagem-calculadora` elements
- **Visual progress bar** showing allocation status
- **Warning messages** when allocation limits are reached

## Integration Steps

### 1. Add the JavaScript File
Add the following script tag to your `index.html` file, right before the closing `</body>` tag:

```html
<script src="js/patrimony-sync.js"></script>
```

**Important:** Place this AFTER the Currency.js library script tag, as it depends on it.

### 2. HTML Structure Requirements
The system automatically detects elements based on these attributes and classes:

#### Main Input (Already Present)
- Input with attribute `is-main="true"`
- Example: `<input id="currency" is-main="true" ...>`

#### Section 3 Inputs (Already Present)
- Inputs with attribute `input-settings="receive"`
- Must be within `.active-produto-item` containers
- Example: `<input input-settings="receive" class="currency-input individual" ...>`

#### Range Sliders (Already Present)
- `<range-slider>` elements within the same `.active-produto-item` container
- Example: `<range-slider min="0" max="1" value="0" step="0.00000001" class="slider">`

#### Percentage Displays (Already Present)
- Elements with class `porcentagem-calculadora`
- Example: `<p class="porcentagem-calculadora">0%</p>`

#### Valor Produto Elements (Already Present)
- Elements with class `valor-produto`
- Should be within `.patrimonio-page_produto-item` containers
- Example: `<div class="valor-produto">R$ 0,00</div>`

### 3. Features Implemented

#### Global Variable & Cache System
- Main input value is stored in `localStorage` with key `patrimony_main_value`
- Allocations are stored with key `patrimony_allocations`
- Values persist across browser sessions

#### Section 3 Synchronization
- All inputs with `input-settings="receive"` are automatically synchronized
- Bidirectional updates between inputs and sliders
- Real-time percentage calculations
- `valor-produto` elements update automatically with allocated values

#### Allocation Validation
- **Prevents over-allocation**: Sum of all allocations cannot exceed main value
- **Real-time validation**: Values are capped as user types
- **Automatic adjustment**: If main value decreases, allocations are proportionally reduced
- **Individual limits**: Each input shows its maximum allowed value

#### Range Slider Integration
- Slider position updates when currency input changes
- Currency input updates when slider is moved
- Proportional calculations based on main input value
- Sliders are capped to prevent over-allocation

#### Visual Feedback
- **Progress bar**: Shows total allocation status (bottom-right corner)
- **Warning messages**: Appear when allocation limits are reached
- **Input highlighting**: Red border when limit is reached
- **Smooth animations**: All updates include visual transitions

### 4. API Methods

The system exposes a global `PatrimonySync` object with these methods:

```javascript
// Get the main input value
PatrimonySync.getMainValue();

// Set the main input value programmatically
PatrimonySync.setMainValue(1000000);

// Get total allocated across all inputs
PatrimonySync.getTotalAllocated();

// Get remaining unallocated value
PatrimonySync.getRemainingValue();

// Get all current allocations with their limits
PatrimonySync.getAllocations();
// Returns: [{index, value, percentage, formatted, maxAllowed}, ...]

// Clear all cached values
PatrimonySync.clearCache();

// Reset everything to zero
PatrimonySync.reset();
```

### 5. Events

The system dispatches custom events you can listen to:

```javascript
// Main value changed
document.addEventListener('patrimonyMainValueChanged', (e) => {
    console.log('New value:', e.detail.value);
    console.log('Formatted:', e.detail.formatted);
});

// Individual allocation changed
document.addEventListener('allocationChanged', (e) => {
    console.log('Index:', e.detail.index);
    console.log('Value:', e.detail.value);
    console.log('Percentage:', e.detail.percentage);
    console.log('Remaining:', e.detail.remaining);
});

// Allocation status changed (total allocation tracking)
document.addEventListener('allocationStatusChanged', (e) => {
    console.log('Main value:', e.detail.mainValue);
    console.log('Total allocated:', e.detail.totalAllocated);
    console.log('Remaining:', e.detail.remaining);
    console.log('Is fully allocated:', e.detail.isFullyAllocated);
    console.log('Percentage allocated:', e.detail.percentageAllocated);
});

// System ready
document.addEventListener('patrimonySyncReady', (e) => {
    console.log('System initialized with:', e.detail);
});
```

### 6. Validation Behavior

#### When entering values in allocation inputs:
1. System calculates maximum allowed value (main value - other allocations)
2. If entered value exceeds limit, it's automatically capped
3. Warning message appears showing maximum allowed
4. Input briefly highlights in red

#### When main value is reduced:
1. If total allocations exceed new main value
2. All allocations are proportionally reduced
3. Maintains relative distribution

#### Visual indicators:
- **Progress bar**: Shows percentage of patrimony allocated
- **Green fill**: Normal allocation (< 100%)
- **Red fill**: Full allocation (100%)
- **Warning tooltip**: Appears on inputs when limit reached

### 7. CSS Classes Added

The system adds these CSS classes for visual feedback:
- `.input-focused` - When an allocation input is focused
- `.updating` - During percentage update animations
- `.valor-updating` - When valor-produto is updating
- `.dragging` - While dragging a range slider
- `.allocation-limit-reached` - Input has reached its limit
- `.limit-reached` - Progress bar at 100% allocation

### 8. Browser Support

- Modern browsers with ES6 support
- localStorage API support
- Intl.NumberFormat support (for currency formatting)

### 9. Testing the Validation

To test the allocation validation:

1. **Basic validation test**:
   - Enter R$ 1.000.000,00 in main input
   - Try to allocate R$ 600.000,00 in first item
   - Try to allocate R$ 600.000,00 in second item
   - Second input should cap at R$ 400.000,00

2. **Slider validation test**:
   - With multiple items allocated
   - Drag a slider to maximum
   - It should stop at the remaining available amount

3. **Main value reduction test**:
   - Allocate R$ 500.000,00 each to two items (total R$ 1.000.000,00)
   - Reduce main value to R$ 800.000,00
   - Both allocations should reduce to R$ 400.000,00

4. **Progress bar test**:
   - Allocate values progressively
   - Watch progress bar update in real-time
   - At 100%, bar turns red

### 10. Troubleshooting

If validation isn't working:

1. **Check console for errors**
2. **Verify element structure**:
   - `valor-produto` elements exist
   - They're within proper parent containers
3. **Check calculations**:
   - Open console and run `PatrimonySync.getAllocations()`
   - Verify `maxAllowed` values are correct
4. **Clear cache if needed**:
   - Run `PatrimonySync.clearCache()` in console
   - Refresh page

### 11. Performance Considerations

- Input changes are debounced (300ms) to prevent excessive updates
- Visual updates use CSS transitions for smooth animations
- Cache writes are optimized to reduce localStorage access
- Validation calculations are efficient O(n) operations

### 12. Example Use Cases

#### Prevent accidental over-allocation:
```javascript
// User has R$ 1.000.000,00 patrimony
// Already allocated R$ 700.000,00
// Tries to allocate R$ 500.000,00 more
// System automatically caps at R$ 300.000,00
```

#### Proportional reduction:
```javascript
// User reduces main patrimony from R$ 2.000.000,00 to R$ 1.000.000,00
// Previous allocations: R$ 800.000,00 and R$ 1.200.000,00
// New allocations: R$ 400.000,00 and R$ 600.000,00 (same proportions)
```

#### Real-time feedback:
```javascript
// As user types "1000000" in an allocation field
// System shows warning at "800000" if that's the limit
// Input value is capped and formatted
// Progress bar updates immediately
```
