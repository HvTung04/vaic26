---
name: Lumina Path
colors:
  surface: "#f9f9ff"
  surface-dim: "#d8d9e3"
  surface-bright: "#f9f9ff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f2f3fd"
  surface-container: "#ecedf7"
  surface-container-high: "#e6e7f2"
  surface-container-highest: "#e1e2ec"
  on-surface: "#191b23"
  on-surface-variant: "#424754"
  inverse-surface: "#2e3038"
  inverse-on-surface: "#eff0fa"
  outline: "#727785"
  outline-variant: "#c2c6d6"
  surface-tint: "#005ac2"
  primary: "#0058be"
  on-primary: "#ffffff"
  primary-container: "#2170e4"
  on-primary-container: "#fefcff"
  inverse-primary: "#adc6ff"
  secondary: "#7b41b4"
  on-secondary: "#ffffff"
  secondary-container: "#c185fd"
  on-secondary-container: "#510c8a"
  tertiary: "#436600"
  on-tertiary: "#ffffff"
  tertiary-container: "#558100"
  on-tertiary-container: "#faffe9"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#d8e2ff"
  primary-fixed-dim: "#adc6ff"
  on-primary-fixed: "#001a42"
  on-primary-fixed-variant: "#004395"
  secondary-fixed: "#f0dbff"
  secondary-fixed-dim: "#ddb8ff"
  on-secondary-fixed: "#2c0051"
  on-secondary-fixed-variant: "#62259b"
  tertiary-fixed: "#b2f746"
  tertiary-fixed-dim: "#98da27"
  on-tertiary-fixed: "#121f00"
  on-tertiary-fixed-variant: "#334f00"
  background: "#f9f9ff"
  on-background: "#191b23"
  surface-variant: "#e1e2ec"
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: "800"
    lineHeight: "1.1"
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: "800"
    lineHeight: "1.2"
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: "700"
    lineHeight: "1.3"
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "400"
    lineHeight: "1.6"
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: "1.5"
  data-mono:
    fontFamily: Space Mono
    fontSize: 14px
    fontWeight: "500"
    lineHeight: "1.4"
    letterSpacing: 0.05em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "700"
    lineHeight: "1"
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  bento-gap: 20px
---

## Brand & Style

The design system for Lumina Path targets a K-12 demographic with an aesthetic that bridges the gap between academic rigor and GenZ digital culture. The brand personality is "Energetic Scientific"—fusing the precision of a laboratory with the vibrant, high-motion energy of modern social interfaces.

The design style is a hybrid of **Bento-Grid Neo-brutalism** and **Clean Tech**. It utilizes the structural integrity of thick borders and high-contrast layouts while softening the experience through expansive whitespace, large corner radii, and sophisticated blur effects. The goal is to evoke a sense of personalized progress, where every data point feels like an achievement rather than a chore.

## Colors

The palette is anchored by a soft cream base to reduce eye strain during long study sessions, contrasted against highly saturated "Logic" and "Action" colors.

- **Primary (Cobalt Blue):** Used for primary actions, progress bars, and focal navigation.
- **Secondary (Lavender):** Reserved for personalized paths, creative tasks, and gamification elements.
- **Tertiary/Success (Acid Lime):** Used for "Correct" states and high-energy progress indicators.
- **Alert (Orange):** Highlights "Streaks" and upcoming deadlines.
- **Critical (Coral):** Indicates areas needing review or errors.
- **Surface:** Surfaces use the Off-White base, with white cards to create a subtle layered effect.

## Typography

The typography system prioritizes immediate hierarchy. **Montserrat** provides a bold, confident voice for headers and achievement callouts. **Inter** handles the heavy lifting of educational content for maximum legibility. **Space Mono** is used specifically for telemetry—test scores, timestamps, and mathematical data—to provide a "scientific" layer to the UI.

Headers should always use tight tracking and heavy weights to lean into the Neo-brutalist aesthetic. Body text maintains generous line heights to ensure readability for younger users.

## Layout & Spacing

The layout philosophy is defined by the **Bento Grid**. Content is organized into modular "tiles" of varying sizes that snap to a 12-column grid on desktop and a 2-column grid on mobile.

- **Desktop:** Tiles usually span 3, 4, 6, or 12 columns.
- **Spacing Rhythm:** An 8px linear scale is used. Gaps between bento tiles are fixed at 20px or 24px to maintain a distinct, chunky separation.
- **Reflow:** On mobile, tiles stack vertically, but maintain their "card" appearance with full-width horizontal margins.

## Elevation & Depth

Depth in this design system is created through **Tactile Layering** rather than traditional realism.

- **Bento Tiles:** Use a white background (#FFFFFF) against the Off-White base (#F9F8F4).
- **Shadows:** Instead of deep shadows, use "Soft Glow" shadows: high blur (20px+), low opacity (8-12%), tinted with the Primary Cobalt or Secondary Lavender depending on the tile's context.
- **Borders:** All tiles and primary buttons feature a subtle 1px or 1.5px solid border in a darkened version of the background or a muted gray to reinforce the Neo-brutalist structure.
- **Backdrop:** Active modals and overlays use a heavy (20px) backdrop blur with a semi-transparent white tint.

## Shapes

The shape language is "Friendly-Structural." Large corner radii (up to 1.5rem for tiles) are used to make the dense grid feel approachable and safe for a K-12 audience.

- **Containers:** Default to `rounded-xl` (1.5rem / 24px).
- **Interactive Elements:** Buttons and inputs use `rounded-lg` (1rem / 16px).
- **Indicators:** Micro-elements like progress dots and notification pips are perfect circles.

## Components

Consistent styling across components reinforces the "Lumina" identity:

- **Bento Cards:** The foundational container. Must have a white background, 24px padding, and 1.5rem border radius. Hovering on a tile should trigger a subtle `scale(1.02)` and intensify the soft glow shadow.
- **Buttons:** Primary buttons are Cobalt Blue with white text, using `bold` weights. They should feel "pressable" with a 2px offset shadow that disappears on `active` state.
- **Chips & Badges:** Used for subject tags (Math, Science). High-contrast backgrounds (Acid Lime or Lavender) with black or deep-tinted text for readability.
- **Input Fields:** Thick 2px borders that turn Cobalt Blue on focus. Labels should use the `label-caps` typography style.
- **Micro-Indicators:** Use "Avatar Rings"—thin colored borders around user photos—to indicate current learning status (e.g., Green for "Active", Orange for "On a Streak").
- **Progress Bars:** Thick, rounded tracks with a dual-tone gradient or a solid Acid Lime fill to represent completion.
