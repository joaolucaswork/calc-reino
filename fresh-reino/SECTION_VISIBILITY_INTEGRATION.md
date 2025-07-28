# Section Visibility System Integration Guide

## Overview

The Section Visibility System provides conditional visibility for UI components based on section viewport visibility. It uses Framer Motion for smooth animations and intersection observer for precise viewport detection.

## Key Features

- **Viewport-based visibility** using Intersection Observer API
- **Smooth animations** powered by Framer Motion
- **Performance optimized** with proper state management
- **Accessibility support** with ARIA attributes
- **Event-driven architecture** for extensibility
- **Manual control** for programmatic usage

## Integration Steps

### 1. Add the JavaScript File

Add the following script tag to your `index.html` file, right before the closing `</body>` tag:

```html
<script src="js/section-visibility.js"></script>
```

**Important:** Place this AFTER the Framer Motion library script tag, as it depends on it.

### 2. HTML Structure Requirements

#### Section to Monitor (Already Present)

- Section with class `patrimonio-alocation`
- This is the section that triggers the visibility logic

#### Float Component (Required in Webflow)

- Div element with class `componente-alocao-float`
- This is the element that will show/hide based on section visibility
- Should be positioned as needed (fixed, absolute, etc.)

**HTML Structure Example:**

```html
<!-- Section 3 - Triggers visibility -->
<section class="patrimonio-alocation">
  <!-- Section content -->
</section>

<!-- Float component - Shows/hides based on section visibility -->
<div class="componente-alocao-float">
  <!-- Component content -->
</div>
```

### 3. Features Implemented

#### Intersection Observer Detection

- **Viewport monitoring**: Detects when section 3 enters/exits viewport
- **Configurable threshold**: Triggers at 10% section visibility (configurable)
- **Root margin**: Adjustable trigger area with -50px margins
- **Performance optimized**: Uses native browser API

#### Framer Motion Animations

- **Show animation**: Opacity 0→1, Scale 0.8→1, Y 20→0
- **Hide animation**: Opacity 1→0, Scale 1→0.8, Y 0→20
- **Duration**: 0.5 seconds with smooth easing curve
- **Animation prevention**: Blocks duplicate animations during transitions

#### Accessibility Features

- **ARIA attributes**: Proper `aria-hidden` state management
- **Pointer events**: Disabled when hidden for better UX
- **Screen reader support**: Hidden elements are properly excluded

#### State Management

- **Initialization tracking**: Prevents duplicate initialization
- **Animation state**: Tracks ongoing animations to prevent conflicts
- **Visibility state**: Maintains current visibility status
- **Clean state transitions**: Proper cleanup on page unload

### 4. API Methods

The system exposes a global `SectionVisibility` object with these methods:

```javascript
// Initialization
SectionVisibility.init();

// Status checking
SectionVisibility.isInitialized(); // Returns: boolean
SectionVisibility.isVisible(); // Returns: boolean
SectionVisibility.isAnimating(); // Returns: boolean

// Manual control
SectionVisibility.show(); // Show component manually
SectionVisibility.hide(); // Hide component manually

// Configuration
SectionVisibility.getConfig(); // Get current configuration
SectionVisibility.updateConfig({
    threshold: 0.2, // Change visibility threshold
    animationDuration: 0.3 // Change animation speed
});

// Cleanup
SectionVisibility.cleanup(); // Clean up observers and state
```

### 5. Events

The system dispatches custom events you can listen to:

```javascript
// System ready
document.addEventListener('sectionVisibilityReady', (e) => {
    console.log('System initialized:', e.detail);
});

// Visibility changed
document.addEventListener('sectionVisibilityChanged', (e) => {
    console.log('Visibility changed:', e.detail.isVisible);
    console.log('Section:', e.detail.section);
    console.log('Component:', e.detail.component);
});

// Component shown
document.addEventListener('floatComponentShown', (e) => {
    console.log('Component shown:', e.detail.component);
});

// Component hidden
document.addEventListener('floatComponentHidden', (e) => {
    console.log('Component hidden:', e.detail.component);
});
```

### 6. Configuration Options

Default configuration can be customized:

```javascript
const CONFIG = {
    sectionSelector: '.patrimonio-alocation',      // Section to monitor
    floatComponentSelector: '.componente-alocao-float', // Element to show/hide
    threshold: 0.1,                               // 10% visibility trigger
    rootMargin: '-50px 0px -50px 0px',           // Trigger area adjustment
    animationDuration: 0.5,                       // Animation duration (seconds)
    animationEasing: [0.25, 0.46, 0.45, 0.94]   // Smooth easing curve
};
```

### 7. CSS Classes Added

The system doesn't add CSS classes but manages these attributes:

- `aria-hidden="true/false"` - Screen reader accessibility
- `style.pointerEvents="none/auto"` - Interaction control

### 8. Browser Support

- Modern browsers with Intersection Observer API support
- ES6+ support required
- Framer Motion compatibility

### 9. Testing

A test suite is available to verify functionality:

```javascript
// Run tests manually in console
SectionVisibilityTests.run();

// Available test methods
SectionVisibilityTests.testInitialization();
SectionVisibilityTests.testElementDetection();
SectionVisibilityTests.testVisibilityAPI();
SectionVisibilityTests.testEventListeners();
SectionVisibilityTests.testManualControl();
```

### 10. Troubleshooting

If the system isn't working:

1. **Check console for errors**
2. **Verify Framer Motion is loaded**:

   ```javascript
   console.log(window.Motion); // Should not be undefined
   ```

3. **Verify elements exist**:

   ```javascript
   console.log(document.querySelector('.patrimonio-alocation'));
   console.log(document.querySelector('.componente-alocao-float'));
   ```

4. **Check initialization**:

   ```javascript
   console.log(window.SectionVisibility.isInitialized());
   ```

5. **Manual testing**:

   ```javascript
   SectionVisibility.show(); // Test manual show
   SectionVisibility.hide(); // Test manual hide
   ```

### 11. Performance Considerations

- **Intersection Observer**: Uses native browser API for optimal performance
- **Animation deduplication**: Prevents multiple simultaneous animations
- **State caching**: Minimizes DOM queries through element caching
- **Event debouncing**: Built into Intersection Observer
- **Memory cleanup**: Proper cleanup on page unload

### 12. Example Use Cases

#### Basic implementation

```javascript
// The system auto-initializes, but you can listen for ready state
document.addEventListener('sectionVisibilityReady', () => {
    console.log('Section visibility system is ready!');
});
```

#### Custom behavior on visibility change

```javascript
document.addEventListener('sectionVisibilityChanged', (e) => {
    if (e.detail.isVisible) {
        // Section 3 is visible, do something
        console.log('User is viewing the allocation section');
    } else {
        // Section 3 is not visible
        console.log('User left the allocation section');
    }
});
```

#### Manual control integration

```javascript
// Show component programmatically
function showAllocationHelper() {
    SectionVisibility.show();
}

// Hide component programmatically
function hideAllocationHelper() {
    SectionVisibility.hide();
}
```

## HTML Requirements for Webflow

To implement this system, you need to ensure these elements exist in your Webflow project:

### Required Elements

1. **Section 3 (patrimonio-alocation)**:
   - Class: `patrimonio-alocation`
   - This should be the section containing your patrimony allocation interface

2. **Float Component (componente-alocao-float)**:
   - Class: `componente-alocao-float`
   - Position: Fixed, Absolute, or any positioning that allows floating
   - Initial visibility: Can be visible or hidden (script will manage it)

### Recommended CSS for Float Component

```css
.componente-alocao-float {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    /* Add your styling here */
}
```

The JavaScript will handle all the visibility logic and animations automatically once these elements are in place.
