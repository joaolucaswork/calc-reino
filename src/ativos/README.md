# Ativos Module - Drag & Drop Functionality

A comprehensive drag and drop solution for Webflow applications with advanced asset management capabilities.

## ✅ Features Implemented

- **Source List Draggable Items**: Only items in `.ativos_main-list` are draggable
- **Active Drop Area**: Items dropped in `.drop_ativos_area-wrapper` automatically move to `.ativos_main_drop_area`
- **Accurate Counter**: Counts only items physically present in the main drop area (using :scope selector)
- **Source Item Removal**: Items disappear from source when successfully dropped
- **Icon Visibility**: Drag icons appear on hover and during drag operations
- **Header Protection**: Header elements (`.drop_header_are-wrapper`) are not draggable
- **Clean Button**: Reset all items to original positions with smooth animations
- **Webflow CMS Integration**: Works seamlessly with Webflow's dynamic content

## How It Works

### Element Structure

1. **`.ativos_main-list`** - Source container for draggable items
   - Contains items that can be dragged
   - Items here are draggable (with clone behavior)
   - Functions as an "asset source"

2. **`.ativos_main_drop_area`** - Main organization area
   - Where items are organized after being dragged
   - Items here are NOT draggable (fixed position)
   - Final destination for assets

3. **`.drop_ativos_area-wrapper`** - Drop zone wrapper
   - Accepts items when dragged
   - Automatically redirects to `.ativos_main_drop_area`
   - Functions as visual drop zone

### Workflow

```
.ativos_main-list (source)
        ↓ (drag with clone)
.drop_ativos_area-wrapper (drop zone)
        ↓ (automatic redirection)
.ativos_main_drop_area (final destination)
```

## Webflow Setup

### Required HTML Structure

```html
<!-- Source Container (editable in Webflow) -->
<div class="ativos_main-list w-dyn-list">
  <div class="w-dyn-items">
    <div class="w-dyn-item">
      <!-- Your asset content -->
      <div class="icon-draggable">🔃</div>
    </div>
    <!-- More items... -->
  </div>
</div>

<!-- Drop Area (editable in Webflow) -->
<div class="drop_ativos_area-wrapper">
  <!-- Header and controls (NOT draggable) -->
  <div class="drop_header_are-wrapper">
    <div class="ativos_counter-wrapper">
      <div class="text-size-xmedium-rem text-weight-medium">Seus ativos</div>
      <div class="counter_ativos">(0)</div>
    </div>
    <a href="#" class="ativos_clean-button w-button">Limpar tudo</a>
  </div>
  
  <!-- Main drop area -->
  <div class="ativos_main_drop_area"></div>
</div>
```

### Required CSS Classes

- `.ativos_main-list` - Source items container
- `.ativos_main_drop_area` - Main organization area
- `.drop_ativos_area-wrapper` - Drop zone wrapper
- `.drop_header_are-wrapper` - Header area (excluded from dragging)
- `.counter_ativos` - Counter element
- `.ativos_clean-button` - Clean button
- `.icon-draggable` - Drag icon element
- `.w-dyn-item` - Individual items

### JavaScript Integration

#### In Webflow `<head>`

```html
<link rel="stylesheet" href="YOUR_CSS_URL/ativos.css">
```

#### Before `</body>` in Webflow

```html
<script src="YOUR_JS_URL/index.js"></script>
```

## JavaScript API

### Available Utilities

```javascript
// Get current asset count (only items in main drop area)
const count = window.ativosUtils.getAtivosCount();

// Get active assets (in drop area)
const activeAssets = window.ativosUtils.getActiveAtivos();

// Get source assets (draggable items)
const sourceAssets = window.ativosUtils.getSourceAtivos();

// Clean all items (return to source)
window.ativosUtils.cleanAllItems();

// Hide source item (Webflow CMS integration)
window.ativosUtils.hideSourceItem(item);

// Show all source items
window.ativosUtils.showAllSourceItems();
```

### Custom Events

```javascript
// When an asset is moved to main area
document.addEventListener('ativosMovedToMain', (event) => {
  console.log('Asset moved:', event.detail.item);
});

// When counter is updated
document.addEventListener('counterUpdate', (event) => {
  console.log('New count:', event.detail.count);
});

// When system is ready
document.addEventListener('ativosReady', (event) => {
  console.log('Assets system ready!');
});

// When item is moved
window.ativosUtils.onItemMoved((item) => {
  console.log('Item moved to main area:', item);
});

// When counter updates
window.ativosUtils.onCounterUpdate((count) => {
  console.log('Counter updated:', count);
});
```

## Customization

### CSS Customization

Override CSS classes to customize appearance:

```css
/* Custom ghost state */
.ativos-ghost {
  opacity: 0.3;
  border: 3px dashed #your-color;
}

/* Custom dragging item */
.ativos-chosen {
  transform: scale(1.05);
  box-shadow: 0 12px 40px rgba(0,0,0,0.3);
}

/* Custom active drop area */
body.ativos-sorting .ativos_main_drop_area {
  background: #your-active-color;
}

/* Icon visibility */
.icon-draggable {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.w-dyn-item:hover .icon-draggable,
.ativos-dragging .icon-draggable {
  opacity: 1;
}
```

### Advanced Configuration

```javascript
// Custom configuration
window.AtivosManager.initialize({
  sortableConfig: {
    animation: 300,
    ghostClass: 'my-ghost-class',
    chosenClass: 'my-chosen-class'
  },
  onSort: (event) => {
    console.log('Item sorted:', event);
  }
});
```

## Responsive Design

The module includes responsive styles for:

- **Desktop**: ≥992px
- **Tablet**: 768px-991px  
- **Mobile**: <768px

## Accessibility

- Supports `prefers-reduced-motion`
- Supports `prefers-contrast: high`
- Keyboard navigation (when supported by SortableJS)

## Troubleshooting

### Items don't appear as draggable

- Check if items are inside `.ativos_main-list`
- Verify SortableJS is loaded
- Check for JavaScript errors in console

### Counter doesn't update

- Verify `.counter_ativos` element exists
- Check if items are direct children of `.ativos_main_drop_area`
- Use `:scope` selector for accurate counting

### Drag and drop doesn't work

- Verify SortableJS is loaded
- Check browser console for errors
- Ensure proper HTML structure
- Ensure proper HTML structure
- Confirm CSS classes are applied correctly

### Headers are draggable

- Verify headers have `.drop_header_are-wrapper` class
- Check filter configuration excludes headers
- Ensure headers are not direct children of draggable containers

### Icons not visible

- Check if `.icon-draggable` elements exist in items
- Verify CSS transitions are enabled
- Test hover and drag states

### Clean button not working

- Verify button has `.ativos_clean-button` class
- Check if original items data is stored
- Ensure event listeners are attached

## Performance Tips

- Items are cloned, not moved, for better UX
- Original items remain in source for repeated use
- Counter uses efficient `:scope` selector
- Event delegation minimizes memory usage
- Smooth animations with `transform` properties

## Browser Support

- Modern browsers (ES2017+)
- Webflow's supported browsers
- Mobile touch devices
- Desktop drag & drop

## Dependencies

- SortableJS: ^1.15.0
- Modern browser with ES2017+ support

---

For advanced usage and TypeScript definitions, refer to the source code files.
