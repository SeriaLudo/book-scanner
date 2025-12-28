# Style Strategy & Design System

## Overview

This document outlines the styling strategy for the Book Scanner application, focusing on creating a
cohesive, accessible, and modern design system using React Aria Components and Tailwind CSS with
proper dark mode support.

## Goals

1. **Consistency**: Unified design language across all components
2. **Accessibility**: WCAG 2.1 AA compliance using React Aria's built-in accessibility
3. **Dark Mode**: Seamless dark mode experience with proper contrast and theming
4. **Maintainability**: Scalable styling approach that's easy to update and extend
5. **Performance**: Minimal CSS bundle size with Tailwind's purging

## Technology Stack

### Core Technologies

- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **React Aria Components**: Accessible, unstyled React components with built-in ARIA support
- **CSS Variables**: For dynamic theming and dark mode support
- **PostCSS**: For Tailwind processing

### How CSS Variables Work with Tailwind

**Important**: Tailwind does NOT automatically use CSS variables. You must:

1. **Define CSS variables** in your CSS file (`index.css`):

   ```css
   :root {
     --color-background: #ffffff;
   }
   .dark {
     --color-background: #0f172a;
   }
   ```

2. **Reference them in Tailwind config** (`tailwind.config.js`):

   ```js
   theme: {
     extend: {
       colors: {
         background: 'var(--color-background)',
       },
     },
   },
   ```

3. **Use Tailwind utilities** that reference the mapped colors:
   ```tsx
   <div className="bg-background">...</div>
   ```

When you toggle the `dark` class on `<html>`, the CSS variable changes, and all Tailwind utilities
using that variable automatically update. This is why we use `darkMode: 'class'` in the Tailwind
config.

## Design System

### Color Palette

**Important**: CSS variables are defined in `index.css` and then referenced in Tailwind's config.
Tailwind doesn't automatically use CSS variables - you must configure the theme to reference them.

#### CSS Variables (in `index.css`)

```css
:root {
  --color-background: #ffffff;
  --color-surface: #f9fafb;
  --color-surface-elevated: #ffffff;
  --color-border: #e5e7eb;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-text-tertiary: #9ca3af;
  --color-accent: #3b82f6;
  --color-accent-hover: #2563eb;
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
}

.dark {
  --color-background: #0f172a;
  --color-surface: #1e293b;
  --color-surface-elevated: #334155;
  --color-border: #475569;
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #cbd5e1;
  --color-text-tertiary: #94a3b8;
  --color-accent: #60a5fa;
  --color-accent-hover: #3b82f6;
  --color-success: #34d399;
  --color-error: #f87171;
  --color-warning: #fbbf24;
}
```

#### Tailwind Config Mapping

These CSS variables are then mapped in `tailwind.config.js`:

```js
module.exports = {
  darkMode: 'class', // Use class-based dark mode
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        border: 'var(--color-border)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        success: 'var(--color-success)',
        error: 'var(--color-error)',
        warning: 'var(--color-warning)',
      },
    },
  },
};
```

This allows you to use classes like `bg-surface`, `text-primary`, `border-border`, etc., and they'll
automatically switch between light and dark modes when the `dark` class is toggled on the root
element.

### Typography

- **Font Family**: System font stack for performance
  - `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Font Sizes**:
  - `text-xs`: 0.75rem (12px)
  - `text-sm`: 0.875rem (14px)
  - `text-base`: 1rem (16px)
  - `text-lg`: 1.125rem (18px)
  - `text-xl`: 1.25rem (20px)
  - `text-2xl`: 1.5rem (24px)
  - `text-3xl`: 1.875rem (30px)
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- **Line Heights**: 1.5 for body, 1.25 for headings

### Spacing Scale

Using Tailwind's default spacing scale (4px base unit):

- `space-1`: 0.25rem (4px)
- `space-2`: 0.5rem (8px)
- `space-3`: 0.75rem (12px)
- `space-4`: 1rem (16px)
- `space-6`: 1.5rem (24px)
- `space-8`: 2rem (32px)
- `space-12`: 3rem (48px)

### Border Radius

- `rounded-sm`: 0.125rem (2px)
- `rounded`: 0.25rem (4px)
- `rounded-md`: 0.375rem (6px)
- `rounded-lg`: 0.5rem (8px)
- `rounded-xl`: 0.75rem (12px)
- `rounded-2xl`: 1rem (16px)

### Shadows

#### Light Mode

- `shadow-sm`: Subtle elevation
- `shadow`: Default card shadow
- `shadow-md`: Elevated surfaces
- `shadow-lg`: Modals and popovers

#### Dark Mode

- Reduced opacity shadows for subtle depth
- Focus on border-based elevation instead

### Responsive Design & Breakpoints

Tailwind uses a mobile-first approach. Styles are applied to mobile by default, then enhanced for
larger screens using breakpoint prefixes.

#### Breakpoint Strategy

```js
// Tailwind default breakpoints (can be customized in config)
sm: '640px',   // Small devices (landscape phones)
md: '768px',   // Medium devices (tablets)
lg: '1024px',  // Large devices (desktops)
xl: '1280px',  // Extra large devices (large desktops)
2xl: '1536px', // 2X large devices (larger desktops)
```

#### Mobile-First Pattern

Always design for mobile first, then enhance for larger screens:

```tsx
// Mobile: single column, full width
// Desktop: two columns, max-width container
<div className="w-full px-4 md:max-w-4xl md:mx-auto md:grid md:grid-cols-2 md:gap-6">
  <section className="space-y-4">{/* Mobile: stacked, Desktop: side-by-side */}</section>
</div>
```

#### Responsive Typography

```tsx
// Smaller on mobile, larger on desktop
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Book Scanner</h1>
```

#### Touch Targets

- **Minimum size**: 44x44px (iOS) / 48x48px (Material Design)
- Use `min-h-[44px]` or `min-h-[48px]` for interactive elements
- Increase padding on mobile: `px-3 py-2 md:px-4 md:py-2`

#### Layout Patterns

**Mobile (< 768px)**:

- Single column layouts
- Full-width components
- Stacked navigation
- Bottom-aligned action buttons
- Larger touch targets
- Reduced padding/margins

**Tablet (768px - 1024px)**:

- Two-column grids where appropriate
- Side-by-side forms
- Horizontal navigation
- Medium padding

**Desktop (> 1024px)**:

- Multi-column layouts
- Max-width containers (e.g., `max-w-6xl mx-auto`)
- Sidebar navigation
- Generous whitespace
- Hover states become important

#### Component-Specific Considerations

**Scanner Component**:

- Mobile: Full-width video, portrait orientation
- Desktop: Constrained width, landscape orientation
- Camera controls: Larger buttons on mobile

**Book List**:

- Mobile: Stacked cards, full-width actions
- Desktop: Grid layout, inline actions

**Forms**:

- Mobile: Stacked inputs, full-width
- Desktop: Side-by-side where logical, constrained width

**Navigation**:

- Mobile: Hamburger menu or bottom nav
- Desktop: Horizontal top nav or sidebar

#### Viewport Meta Tag

Ensure proper viewport configuration in `index.html`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

#### Testing Strategy

- Test on actual devices when possible
- Use browser DevTools responsive mode
- Test at breakpoint boundaries (639px, 767px, 1023px, etc.)
- Verify touch targets are accessible
- Check text readability at all sizes
- Ensure no horizontal scrolling on mobile

## Implementation Plan

### Phase 1: Setup & Configuration

1. **Install Dependencies**

   ```bash
   npm install @react-aria/components @react-aria/button @react-aria/form @react-aria/dialog @react-aria/select @react-aria/listbox tailwindcss postcss autoprefixer
   ```

2. **Configure Tailwind CSS**
   - Create `tailwind.config.js` with `darkMode: 'class'` strategy
   - Configure content paths for purging
   - Extend theme to map CSS variables to Tailwind color utilities
   - Example: `background: 'var(--color-background)'` → use as `bg-background`

3. **Update CSS**
   - Replace `index.css` with Tailwind directives (`@tailwind base`, etc.)
   - Define CSS custom properties in `:root` (light mode)
   - Define CSS custom properties in `.dark` (dark mode)
   - Add base styles for typography and layout
   - **Important**: CSS variables must be defined in CSS, then referenced in Tailwind config

4. **Dark Mode Provider**
   - Create `ThemeProvider` component
   - Implement system preference detection
   - Add manual toggle functionality
   - Persist preference in localStorage

### Phase 2: Component Migration

#### Priority Order:

1. **Buttons** → React Aria Button
2. **Forms** → React Aria TextField, TextArea, Checkbox
3. **Selects** → React Aria Select
4. **Dialogs** → React Aria Dialog
5. **Lists** → React Aria ListBox
6. **Navigation** → React Aria Tabs, Menu

#### Migration Pattern:

```tsx
// Before (Tailwind only)
<button className="px-4 py-2 bg-blue-500 text-white rounded">Click me</button>;

// After (React Aria + Tailwind)
import {Button} from '@react-aria/components';

<Button className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">
  Click me
</Button>;
```

### Phase 3: Design Tokens & Utilities

1. **Create Design Token System**
   - Define semantic color tokens (background, surface, text, accent)
   - Create utility classes for common patterns
   - Build component variants using Tailwind's variant system

2. **Component Variants**

   ```tsx
   // Example: Button variants
   const buttonVariants = {
     primary: 'bg-accent text-white hover:bg-accent-hover',
     secondary: 'bg-surface border border-border hover:bg-surface-elevated',
     ghost: 'bg-transparent hover:bg-surface',
     danger: 'bg-error text-white hover:bg-error/90',
   };
   ```

3. **Layout Components**
   - Container component with max-width constraints
   - Card component with consistent padding and elevation
   - Stack component for vertical spacing
   - Grid component for responsive layouts

### Phase 4: Dark Mode Implementation

1. **Theme Toggle Component**
   - Icon-based toggle (sun/moon)
   - Smooth transitions between themes
   - Accessible keyboard navigation

2. **Theme-Aware Utilities**
   - Custom Tailwind utilities that respect dark mode
   - Automatic color inversion where appropriate
   - Proper contrast ratios in both modes

3. **Testing**
   - Visual regression testing
   - Contrast ratio validation
   - Accessibility audit

## Component Styling Guidelines

### React Aria Components

React Aria Components are unstyled by default, giving us full control:

```tsx
import {Button} from '@react-aria/components';

<Button
  className={`
    px-4 py-2 rounded-lg font-medium
    bg-accent text-white
    hover:bg-accent-hover
    focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-150
  `}
>
  Submit
</Button>;
```

### Form Components

```tsx
import {TextField, Label, Input, FieldError} from '@react-aria/components';

<TextField isRequired>
  <Label className="block text-sm font-medium text-text-primary mb-1">Email</Label>
  <Input
    type="email"
    className={`
      w-full px-3 py-2 rounded-md border border-border
      bg-surface text-text-primary
      focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
      placeholder:text-text-tertiary
    `}
  />
  <FieldError className="mt-1 text-sm text-error" />
</TextField>;
```

### Card Components

```tsx
<div
  className={`
  rounded-xl border border-border
  bg-surface-elevated
  p-4 md:p-6
  shadow-sm
  dark:shadow-none dark:border-border
`}
>
  {/* Card content */}
</div>
```

### Responsive Component Examples

**Responsive Grid Layout**:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {/* Cards stack on mobile, 2 columns on tablet, 3 on desktop */}
</div>
```

**Responsive Typography**:

```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>
<p className="text-sm md:text-base text-text-secondary">
  Responsive body text
</p>
```

**Responsive Spacing**:

```tsx
<div className="px-4 py-2 md:px-6 md:py-4 lg:px-8 lg:py-6">
  {/* More padding on larger screens */}
</div>
```

**Responsive Button Sizes**:

```tsx
<Button
  className={`
    px-3 py-2 md:px-4 md:py-2.5
    text-sm md:text-base
    min-h-[44px] md:min-h-[40px]
  `}
>
  Responsive Button
</Button>
```

## Accessibility Considerations

### React Aria Benefits

- Built-in ARIA attributes
- Keyboard navigation
- Focus management
- Screen reader support
- RTL support

### Additional Requirements

- Minimum contrast ratio of 4.5:1 for text
- Focus indicators on all interactive elements
- Semantic HTML structure
- Proper heading hierarchy
- Alt text for images
- Form labels and error messages

## File Structure

```
src/
├── styles/
│   ├── index.css          # Tailwind directives + CSS variables
│   └── tokens.css         # Design tokens (optional)
├── components/
│   ├── ui/                # Styled React Aria components
│   │   ├── Button.tsx
│   │   ├── TextField.tsx
│   │   ├── Select.tsx
│   │   └── Card.tsx
│   └── ThemeProvider.tsx  # Dark mode provider
└── hooks/
    └── useTheme.ts        # Theme hook
```

## Migration Checklist

- [ ] Install React Aria Components
- [ ] Configure Tailwind with dark mode
- [ ] Set up CSS variables for theming
- [ ] Create ThemeProvider component
- [ ] Migrate Button components
- [ ] Migrate Form components
- [ ] Migrate Select/Dropdown components
- [ ] Migrate Dialog/Modal components
- [ ] Add theme toggle UI
- [ ] Test dark mode across all components
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Documentation

## Best Practices

1. **Use Semantic Colors**: Always use semantic tokens (`bg-surface`, `text-primary`) instead of raw
   colors
2. **Consistent Spacing**: Use the spacing scale consistently
3. **Focus States**: Always include visible focus indicators
4. **Responsive Design**:
   - Mobile-first approach: design for mobile, enhance for desktop
   - Use Tailwind breakpoints (`sm:`, `md:`, `lg:`, etc.)
   - Test at breakpoint boundaries
   - Ensure touch targets are at least 44x44px on mobile
5. **Component Composition**: Build reusable styled components from React Aria primitives
6. **Performance**: Use Tailwind's JIT mode for optimal bundle size
7. **Testing**:
   - Test components in both light and dark modes
   - Test on multiple screen sizes (mobile, tablet, desktop)
   - Verify touch interactions on mobile devices
   - Check accessibility with keyboard navigation

## Resources

- [React Aria Components Documentation](https://react-spectrum.adobe.com/react-aria/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Dark Mode Best Practices](https://web.dev/prefers-color-scheme/)

## Next Steps

1. Review and approve this strategy
2. Begin Phase 1 implementation
3. Create initial component library
4. Migrate existing components incrementally
5. Gather feedback and iterate
