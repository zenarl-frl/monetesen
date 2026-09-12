---
name: Modern Minimalist Financial System
colors:
  surface: '#fcf9f1'
  surface-dim: '#dcdad2'
  surface-bright: '#fcf9f1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f4eb'
  surface-container: '#f0eee6'
  surface-container-high: '#eae8e0'
  surface-container-highest: '#e4e2db'
  on-surface: '#1b1c17'
  on-surface-variant: '#5b403e'
  inverse-surface: '#30312c'
  inverse-on-surface: '#f3f1e9'
  outline: '#8f6f6d'
  outline-variant: '#e4beba'
  surface-tint: '#ba1724'
  primary: '#b71422'
  on-primary: '#ffffff'
  primary-container: '#db3237'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb3ae'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#5d5c56'
  on-tertiary: '#ffffff'
  tertiary-container: '#76756e'
  on-tertiary-container: '#fdffdc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#ffb3ae'
  on-primary-fixed: '#410004'
  on-primary-fixed-variant: '#930014'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e5e2db'
  tertiary-fixed-dim: '#c9c6bf'
  on-tertiary-fixed: '#1c1c17'
  on-tertiary-fixed-variant: '#474742'
  background: '#fcf9f1'
  on-background: '#1b1c17'
  surface-variant: '#e4e2db'
  canvas-cream: '#EBE9E1'
  surface-dark: '#191919'
  surface-taupe: '#B5B3AC'
  accent-coral: '#FF4D4D'
  text-primary: '#0F0F0F'
  text-secondary: '#7E7E7A'
  text-light: '#FFFFFF'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1.25rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.75rem
  space-2xl: 2.5rem
---

## Brand & Style

This design system delivers a tactile, high-contrast financial cockpit designed for modern asset management, portfolio tracking, and rapid personal wealth decision-making. Merging minimalist editorial restraint with tactile, neumorphic-lite card framing, it treats financial data not as a dry spreadsheet, but as a dynamic, living showcase.

The target audience spans digital-first investors, crypto-asset holders, and product-conscious individuals who value clarity, deliberate visual weight, and distraction-free usability. 

Key tenets of this design language:
- **High-Contrast Canvas Inversion:** A warm light cream primary canvas establishes a calm, human, and editorial environment, contrasted against deep charcoal and saturated coral cards to frame critical financial metrics.
- **Architectural Card Geometry:** Generous radii (20px–28px) paired with pill-shaped control caps provide physical containment for data points, creating a tangible, block-based mobile interface.
- **Subtle Tactile Edge:** Soft ambient diffusions and micro-inset highlights evoke tactile physical tokens without heavy faux-skeuomorphism.
- **Precision Data Hierarchy:** Numerical metrics demand immediate recognition through clear tabular numerals and targeted accent markers.

## Colors

The palette establishes an inverted dual-mode relationship within a single screen. Rather than traditional monochromatic light or dark modes, it leverages warm, low-glare cream as the ground plane, anchoring deep charcoal and taupe modules directly on top.

### Hierarchy & Functional Roles
- **Primary Accent (`#FF4D4D`):** Reserved for real-time focus states, live chart tracking nodes, progress radial strokes, positive interactive highlights, and urgent notification alerts. Used sparingly to preserve visual impact.
- **Dark Surface (`#191919`):** The primary container color for high-importance metrics, live interactive charts, and floating navigational chrome. Provides high-contrast separation against the light cream ground.
- **Secondary Neutral (`#B5B3AC`):** Mid-tone taupe/gray used for secondary metric cards, passive button backings, and structural dividers on the canvas.
- **Canvas (`#EBE9E1`):** The universal root layer. Softens eye fatigue while maintaining sharp contrast against deep surfaces.
- **Typography Contrast:** On `#EBE9E1` and light surfaces, use `#0F0F0F` for primary headlines and `#7E7E7A` for metadata. On `#191919` and `#FF4D4D`, use pure `#FFFFFF` for primary figures and semi-transparent white (`rgba(255, 255, 255, 0.7)`) for secondary subheads.

## Typography

Typography balances geometric legibility with structured utility. Plus Jakarta Sans conveys a clean, premium character across display headings and balance figures, while Inter provides systematic neutrality for transactional line items, numeric tracking, and micro-labels.

- **Tabular Numerals:** Apply `font-feature-settings: "tnum" 1` across all balance values, transactional counts, and data point tooltips to eliminate jitter during active updates.
- **Hierarchy Pairing:** Section titles leverage `title-md` (16px Semi-Bold) in high-contrast black or white depending on the container, accompanied by `label-md` or `label-sm` in uppercase for status markers.
- **Line Length & Rhythm:** Maintain body copy line lengths within 45–65 characters. Numerical balance items strictly avoid line wraps; long values step down to `headline-lg-mobile` via responsive fluid clamping.

## Layout & Spacing

The layout is built around a mobile-first responsive grid system, optimized for vertical card stacking on handheld devices and multi-column dashboards on desktop PWA viewports.

### Grid Rhythm & Viewports
- **Mobile (< 768px):** 4-column fluid layout with `margin: 1.25rem` (20px) and `gutter: 1rem` (16px). Screen edges feature ample breathing room, maintaining card internal padding at 16px to 20px.
- **Tablet (768px – 1024px):** 8-column layout. Metric modules arrange into symmetric 2x2 or 4x1 layouts. The floating bottom navigation docks in the center bottom with a maximum width of 480px.
- **Desktop / PWA (> 1024px):** 12-column fixed or max-width fluid container (maximum 1280px) with `margin: 2.5rem` and `gutter: 1.5rem`. The bottom navigation shell transitions into a fixed left-rail sidebar (width: 260px), while the central canvas hosts 2-column or 3-column asymmetric card arrangements.

### Component Spacing Rhythm
Vertical stacked sections maintain a `space-xl` (28px) separation. Inner elements within cards (labels to values, values to auxiliary change badges) rely on strict multiples of `space-xs` (4px) and `space-sm` (8px).

## Elevation & Depth

This system utilizes a "neumorphic-lite" depth model, avoiding over-extruded skeletal skeuomorphism in favor of crisp boundaries, tinted ambient drop-shadows, and micro inner-glow surfaces.

- **Level 0 (Canvas):** Pure `#EBE9E1`. Zero elevation.
- **Level 1 (Secondary Cards - Taupe `#B5B3AC`):** Light, soft-drop ambient shadow: `0 8px 24px -4px rgba(25, 25, 25, 0.08)`. Border is a hairline semi-transparent white stroke (`border: 1px solid rgba(255, 255, 255, 0.35)`).
- **Level 2 (Deep Charcoal Cards - `#191919`):** Deep ambient diffusion: `0 16px 36px -8px rgba(0, 0, 0, 0.22)`. Contains a soft 1px inset rim: `box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1)`.
- **Level 3 (Floating Nav & Coral Action Cards):** Elevated floating layers carry an interactive shadow: `0 20px 40px -6px rgba(25, 25, 25, 0.28)`. For `#FF4D4D` components, shadows adopt an ambient chromatic tint: `0 12px 28px -4px rgba(255, 77, 77, 0.35)`.
- **Interactive Tooltips:** Floating chart tooltips use `#FF4D4D` with a crisp 2px offset drop shadow and negative blur spread to hover cleanly over dark chart canvases.

## Shapes

The shape language combines broad architectural curvatures for structural containers with strict pill geometries for interactive elements.

- **Cards & Data Modules:** Radii scale between 20px (metric cards, sub-panels) and 28px (main chart cards, token bonus hero containers).
- **Interactive Controls & Badges:** Strictly pill-shaped (`border-radius: 999px`). Applies universally to primary buttons, timeframe filters (`1D`, `1W`, `1M`), floating navigation shells, and active indicator pills.
- **Icon Containers & Media:** Nested square icons use smooth squircle geometry (`12px` to `16px` radius), matching the continuous curvature of the parent card.
- **Circular Indicators:** Profile avatars, status indicators, and floating circular action buttons maintain full 50% circular geometries.

## Components

### Buttons
- **Primary Pill:** Background `#FF4D4D`, text `#FFFFFF`, radius `999px`, height `48px`. Padding: `0 24px`. Hover state: brightness scale (95%) with a coral glow elevation.
- **Secondary Dark Pill:** Background `#191919`, text `#FFFFFF`, radius `999px`, height `44px`. Border: `1px solid rgba(255, 255, 255, 0.15)`.
- **Timeframe Filters / Segmented Pills:** Grouped horizontal pill selector. Inactive items use transparent backgrounds with `#7E7E7A` or `rgba(255, 255, 255, 0.6)` text. Active items use `#FFFFFF` fill with `#191919` text inside dark cards, or `#FF4D4D` fill with white text on canvas.

### Cards & Data Panels
- **Chart Card (Primary Dark):** Canvas `#191919`, radius `24px` or `28px`, padding `20px`. Contains white vector curve chart lines (`stroke-width: 2.5px`), coral glowing data nodes (`8px` diameter with `4px` white ring), and an embedded time-range pill row along the bottom edge.
- **Metric Cards (2-Column Grid):** Canvas `#B5B3AC`, radius `20px`, padding `16px`. Title in `12px` medium `#7E7E7A`, value in `20px` bold `#0F0F0F`, accompanied by a right-aligned navigation chevron (`>`).
- **Hero Token / Bonus Card:** High-impact `#FF4D4D` solid background with pure `#FFFFFF` typography. Pair alongside dark cards incorporating circular radial progress meters (`stroke: #FF4D4D`, track: `rgba(255, 255, 255, 0.15)`).

### Transaction History List
- **Container:** Borderless transparent stack resting on `#EBE9E1`.
- **Row Anatomy:** Flexible row with `12px` gap. Left: `48px x 48px` squircle container (`#191919`) housing a white vector icon. Center: Vertical pair featuring transaction title (`title-md`) stacked over category label (`body-sm`, `#7E7E7A`). Right: Tabular amount right-aligned (`title-md`), green or white for deposits (`+$460.00`), `#0F0F0F` or `#FF4D4D` for deductions (`-$40.99`).

### Horizontal Recipients Stack
- Circular avatar row (`48px` diameter) with `2px` border matching the background canvas.
- Active state indicated via a `10px` coral or emerald dot anchored bottom-right.
- Overflow avatar: Solid `#191919` fill containing centered bold text (e.g., `+3`) in `#FFFFFF`.

### Floating Navigation Shell
- **Mobile Dock:** Floating pill bar centered `16px` above the bottom screen edge. Background `#191919`, height `64px`, radius `999px`, inner padding `6px`.
- **Active Navigation Indicator:** Pill-shaped solid `#FFFFFF` container wrapping the active icon and label in `#191919`. Inactive icons rest at `50%` opacity white.
- **Floating Action Button (FAB):** Standalone circular button (`56px` diameter) in `#191919` or `#FF4D4D` positioned adjacent to or integrated within the pill shell, containing a bold `+` icon.

### Inputs & Form Elements
- **Input Fields:** Rounded pill (`999px`) or `16px` soft container. Background `rgba(25, 25, 25, 0.05)`, border `1px solid rgba(25, 25, 25, 0.1)`. Focus state: Border transitions to `#FF4D4D` with `0 0 0 3px rgba(255, 77, 77, 0.2)`.
- **Selection Controls:** Custom circular radios and check boxes utilizing `#FF4D4D` fill with white checkmarks. Inactive states show a `1.5px` border in `#B5B3AC`.