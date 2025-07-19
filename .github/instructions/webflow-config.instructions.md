---
applyTo: '**'
---

When generating code for this project, always consider that this is a Webflow development environment with the following specific requirements and constraints:

**CRITICAL RESTRICTION:**

- **NEVER create HTML files** - All HTML structure is exclusively managed by Webflow's visual designer. Only generate JavaScript (.js/.ts) and CSS files.

**Webflow-Specific Implementation Guidelines:**

1. **DOM Manipulation**:

   - Use Webflow's class-based approach rather than direct HTML modifications
   - Target elements using Webflow's generated class names and data attributes
   - Use `document.querySelector()` and `document.querySelectorAll()` with stable selectors
   - Never use `innerHTML` to create new HTML structure - only modify existing elements

2. **CSS Considerations**:

   - Avoid inline styles that conflict with Webflow's visual editor
   - Use CSS custom properties (CSS variables) for dynamic styling
   - Respect Webflow's responsive breakpoint system (Desktop: 992px+, Tablet: 768px-991px, Mobile Landscape: 480px-767px, Mobile Portrait: <480px)
   - Prefer adding/removing CSS classes over direct style manipulation
   - When creating CSS files, ensure they complement rather than override Webflow's existing styles

3. **JavaScript Integration**:

   - Ensure code works with Webflow's published environment
   - Use `DOMContentLoaded` or Webflow's `Webflow.ready()` for initialization
   - Account for Webflow's lazy loading and dynamic content
   - Test compatibility with Webflow's interactions and animations
   - Wrap all code in IIFE or modules to avoid global namespace pollution

4. **Element Selection**:

   - Use stable selectors like `data-*` attributes or specific class names assigned in Webflow
   - Avoid relying on Webflow's auto-generated class names (e.g., `w-dyn-item`, `w-node-*`) that may change
   - Consider Webflow's CMS dynamic content structure when applicable
   - Prefer semantic selectors over positional selectors

5. **Performance**:

   - Minimize impact on Webflow's page load performance
   - Use efficient event delegation for dynamic content
   - Consider Webflow's asset loading order and defer scripts when possible
   - Optimize for Webflow's built-in lazy loading mechanisms

6. **File Structure & Deployment**:

   - Only generate `.js`, `.ts`, and `.css` files that will be hosted externally and imported into Webflow
   - Ensure code works in both Webflow's designer preview and published sites
   - Account for Webflow's CDN and caching behavior
   - Test across Webflow's responsive breakpoints
   - Follow the project's build system using esbuild as configured in `bin/build.js`

7. **Integration Instructions**:
   - Always provide clear instructions on how to add the generated files to Webflow (via custom code sections or external hosting)
   - Specify which Webflow elements need specific class names or data attributes
   - Include setup requirements within the Webflow designer
   - Provide testing steps for both designer preview and published site

**File Output Restrictions:**

- ✅ Generate: `.js`, `.ts`, `.css` files only
- ❌ Never generate: `.html`, `.htm`, or any markup files
- ❌ Never provide HTML snippets for insertion into Webflow
