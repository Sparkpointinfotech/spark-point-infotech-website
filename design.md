---
version: 1.0.0
name: Aether Visual System
description: A premium futuristic interface design system focused on depth, motion, and digital craftsmanship.
colors:
  bgDark: "#020202"
  surfaceDark: "#0a0a0a"
  textDark: "#EAEAEA"
  textMuted: "#888888"
  accent: "#10B981"
  accentGlow: "#34D399"
  borderDark: "rgba(255, 255, 255, 0.06)"
  glassBg: "rgba(255, 255, 255, 0.03)"
typography:
  fontFamily: "Inter, sans-serif"
  h1:
    size: "5.5rem"
    weight: "600"
    tracking: "-0.05em"
  h2:
    size: "2.75rem"
    weight: "600"
    tracking: "-0.025em"
  body:
    size: "1.125rem"
    weight: "300"
    lineHeight: "1.6"
  label:
    size: "10px"
    weight: "700"
    tracking: "0.2em"
    transform: "uppercase"
spacing:
  xs: "4px"
  sm: "12px"
  md: "24px"
  lg: "40px"
  xl: "80px"
  section: "160px"
rounded:
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "22px"
  full: "999px"
components:
  nav:
    background: "rgba(2, 2, 2, 0.7)"
    blur: "24px"
    height: "56px"
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)"
  glassCard:
    background: "linear-gradient(180deg, rgba(20,20,20,0.65), rgba(8,8,8,0.75))"
    border: "1px solid rgba(255,255,255,0.12)"
    shadow: "0 25px 80px rgba(0,0,0,0.75)"
    backdropBlur: "18px"
  buttonPrimary:
    background: "#10B981"
    borderRadius: "999px"
    shadow: "0 0 30px rgba(16,185,129,0.25)"
  statusPill:
    background: "rgba(16, 185, 129, 0.05)"
    border: "1px solid rgba(16, 185, 129, 0.15)"
    text: "#10B981"
motion:
  duration: "1000ms"
  easing: "cubic-bezier(0.22, 1, 0.36, 1)"
  stagger: "100ms"
---
## Overview
Aether is a visual language that synthesizes high-end industrial design with digital fluidity. It utilizes dark mode as a primary state to emphasize glowing accents and 3D depth, creating a professional yet futuristic "Command Center" aesthetic.

## Colors
The palette is grounded in `bgDark` (#020202) for maximum contrast. The primary signal color is `accent` (#10B981), representing active systems and data flows. Secondary light-mode colors are provided for accessibility, but the system's identity is defined by its dark, low-alpha overlays.

## Typography
Built on the Inter typeface. Headings use tight letter-spacing and heavy weights to suggest authority. Body text utilizes light weights (300) for a modern, airy feel. Mono labels are used for technical metadata and metrics.

## Spacing
A modular spacing system with a focus on generous section padding (160px) to establish a premium sense of "void." Micro-spacing (4px-12px) is used within component clusters like node headers.

## Layout
The layout prioritizes a fixed hero center-piece with a deep Z-axis.
- **Z-Index 0**: Fixed Three.js atmospheric canvas.
- **Z-Index 10**: Hero content and interactive overlays.
- **Z-Index 20**: Main content sections that scroll over the background.
- **Z-Index 50**: Navigation and high-level notifications.

## Elevation & Depth
Depth is achieved through `backdrop-filter: blur()` and layered box shadows. Inner highlights (`inset 0 1px 0 rgba(255,255,255,0.06)`) on cards simulate physical top-lighting. Glows are used sparingly to highlight active interactive elements.

## Shapes
Rounded corners are significant (18px-22px) for cards and nodes, while buttons and status pills use a fully pill-shaped profile (999px). This softens the technical aesthetic.

## Components
- **Node System**: Glass-morphic containers with title chips and logic indicators.
- **Bento Grid**: Multi-column layouts with internal padding and spotlight hover effects.
- **Protocol Timeline**: A vertical rail component with a central "filling" progress line and scanning beams.
- **CTA Door**: A dual-panel split transition using backdrop-blur to reveal hidden layers.

## Motion
Motion is deterministic and physics-based.
- **Keyframes**: `beam` animations for data flow and `nodePulse` for status indicators.
- **ScrollTrigger**: Elements should morph or reveal based on viewport entry using a `cubic-bezier(0.22, 1, 0.36, 1)` curve.
- **Parallax**: 3D objects should respond to cursor position and scroll depth.

## Do's and Don'ts
### Do's
- Use emerald gradients for primary calls to action.
- Maintain 18px+ blur on all glass surfaces.
- Use mono fonts for all numeric data.
- Apply 30px+ vertical translations on enter-reveal animations.

### Don'ts
- Don't use solid black for cards; use surface-dark with subtle transparency.
- Don't use sharp 0px corners.
- Don't use saturated primary colors other than the emerald accent.
- Don't clutter the UI; preserve the "Void" between sections.

## Accessibility
- Every interactive element must have a focus ring (use `emerald-400/40`).
- High-contrast text must be maintained against dark backgrounds.
- Provide `prefers-reduced-motion` alternates for the Three.js and CTA Door animations.