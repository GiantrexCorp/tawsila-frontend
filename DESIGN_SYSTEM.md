# Tawsila Design System

Design specifications for mobile development consistency.

---

## Fonts

### English
- **Font Family:** Inter (Google Fonts)
- **URL:** https://fonts.google.com/specimen/Inter
- **Subsets:** Latin

### Arabic
- **Font Family:** Cairo (Google Fonts)
- **URL:** https://fonts.google.com/specimen/Cairo
- **Subsets:** Arabic, Latin

### Usage
- English content: Use **Inter**
- Arabic content: Use **Cairo**
- The font switches based on locale (RTL for Arabic, LTR for English)

---

## Color Schema

All colors use the **OKLCH** color space. Converted to HEX/RGB for mobile compatibility.

### Light Mode

| Token | OKLCH | HEX | RGB | Usage |
|-------|-------|-----|-----|-------|
| **background** | `oklch(1 0 0)` | `#FFFFFF` | `rgb(255, 255, 255)` | Main background |
| **foreground** | `oklch(0.145 0 0)` | `#171717` | `rgb(23, 23, 23)` | Main text color |
| **card** | `oklch(1 0 0)` | `#FFFFFF` | `rgb(255, 255, 255)` | Card background |
| **card-foreground** | `oklch(0.145 0 0)` | `#171717` | `rgb(23, 23, 23)` | Card text |
| **primary** | `oklch(0.58 0.14 209)` | `#0891B2` | `rgb(8, 145, 178)` | Primary brand color (Teal/Cyan) |
| **primary-foreground** | `oklch(0.985 0 0)` | `#FAFAFA` | `rgb(250, 250, 250)` | Text on primary |
| **secondary** | `oklch(0.97 0 0)` | `#F5F5F5` | `rgb(245, 245, 245)` | Secondary background |
| **secondary-foreground** | `oklch(0.205 0 0)` | `#262626` | `rgb(38, 38, 38)` | Secondary text |
| **muted** | `oklch(0.97 0 0)` | `#F5F5F5` | `rgb(245, 245, 245)` | Muted background |
| **muted-foreground** | `oklch(0.556 0 0)` | `#737373` | `rgb(115, 115, 115)` | Muted text |
| **accent** | `oklch(0.97 0 0)` | `#F5F5F5` | `rgb(245, 245, 245)` | Accent background |
| **accent-foreground** | `oklch(0.205 0 0)` | `#262626` | `rgb(38, 38, 38)` | Accent text |
| **destructive** | `oklch(0.577 0.245 27.325)` | `#DC2626` | `rgb(220, 38, 38)` | Error/Delete actions |
| **border** | `oklch(0.922 0 0)` | `#E5E5E5` | `rgb(229, 229, 229)` | Borders |
| **input** | `oklch(0.922 0 0)` | `#E5E5E5` | `rgb(229, 229, 229)` | Input borders |
| **ring** | `oklch(0.708 0 0)` | `#A3A3A3` | `rgb(163, 163, 163)` | Focus ring |

### Dark Mode

| Token | OKLCH | HEX | RGB | Usage |
|-------|-------|-----|-----|-------|
| **background** | `oklch(0.145 0 0)` | `#171717` | `rgb(23, 23, 23)` | Main background |
| **foreground** | `oklch(0.985 0 0)` | `#FAFAFA` | `rgb(250, 250, 250)` | Main text color |
| **card** | `oklch(0.205 0 0)` | `#262626` | `rgb(38, 38, 38)` | Card background |
| **card-foreground** | `oklch(0.985 0 0)` | `#FAFAFA` | `rgb(250, 250, 250)` | Card text |
| **primary** | `oklch(0.65 0.15 209)` | `#22D3EE` | `rgb(34, 211, 238)` | Primary brand color (Lighter Teal) |
| **primary-foreground** | `oklch(0.985 0 0)` | `#FAFAFA` | `rgb(250, 250, 250)` | Text on primary |
| **secondary** | `oklch(0.269 0 0)` | `#404040` | `rgb(64, 64, 64)` | Secondary background |
| **secondary-foreground** | `oklch(0.985 0 0)` | `#FAFAFA` | `rgb(250, 250, 250)` | Secondary text |
| **muted** | `oklch(0.269 0 0)` | `#404040` | `rgb(64, 64, 64)` | Muted background |
| **muted-foreground** | `oklch(0.708 0 0)` | `#A3A3A3` | `rgb(163, 163, 163)` | Muted text |
| **accent** | `oklch(0.269 0 0)` | `#404040` | `rgb(64, 64, 64)` | Accent background |
| **accent-foreground** | `oklch(0.985 0 0)` | `#FAFAFA` | `rgb(250, 250, 250)` | Accent text |
| **destructive** | `oklch(0.704 0.191 22.216)` | `#EF4444` | `rgb(239, 68, 68)` | Error/Delete actions |
| **border** | `oklch(1 0 0 / 10%)` | `#FFFFFF1A` | `rgba(255, 255, 255, 0.1)` | Borders |
| **input** | `oklch(1 0 0 / 15%)` | `#FFFFFF26` | `rgba(255, 255, 255, 0.15)` | Input borders |
| **ring** | `oklch(0.556 0 0)` | `#737373` | `rgb(115, 115, 115)` | Focus ring |

---

## Semantic Colors

### Status Colors

| Status | Light Mode HEX | Dark Mode HEX | Usage |
|--------|---------------|---------------|-------|
| **Success** | `#22C55E` | `#4ADE80` | Success states, active status |
| **Warning** | `#F59E0B` | `#FBBF24` | Warning states, pending |
| **Error** | `#DC2626` | `#EF4444` | Error states, destructive |
| **Info** | `#0891B2` | `#22D3EE` | Information, primary actions |

### Order Phase Colors

| Phase | Background | Text | Border | Usage |
|-------|------------|------|--------|-------|
| **Phase 1 (At Vendor)** | `#FEF3C7` | `#92400E` | `#F59E0B` | Order at vendor location |
| **Phase 2 (At Inventory)** | `#DBEAFE` | `#1E40AF` | `#3B82F6` | Order at inventory |

### Badge/Status Colors

| Status | Background | Text |
|--------|------------|------|
| **Active/Success** | `rgba(34, 197, 94, 0.2)` | `#16A34A` (light) / `#4ADE80` (dark) |
| **Pending/Warning** | `rgba(245, 158, 11, 0.2)` | `#D97706` (light) / `#FBBF24` (dark) |
| **Inactive/Neutral** | `rgba(113, 113, 122, 0.2)` | `#52525B` (light) / `#A1A1AA` (dark) |
| **Error/Rejected** | `rgba(220, 38, 38, 0.2)` | `#DC2626` (light) / `#EF4444` (dark) |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| **radius** | `10px` (0.625rem) | Base radius |
| **radius-sm** | `6px` | Small elements (badges, chips) |
| **radius-md** | `8px` | Medium elements (inputs, buttons) |
| **radius-lg** | `10px` | Large elements (cards) |
| **radius-xl** | `14px` | Extra large (modals, sheets) |

---

## Spacing Scale

Based on 4px grid system:

| Token | Value |
|-------|-------|
| **0** | 0px |
| **1** | 4px |
| **2** | 8px |
| **3** | 12px |
| **4** | 16px |
| **5** | 20px |
| **6** | 24px |
| **8** | 32px |
| **10** | 40px |
| **12** | 48px |
| **16** | 64px |

---

## Typography Scale

### Font Sizes

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| **xs** | 12px | 16px | Captions, labels |
| **sm** | 14px | 20px | Secondary text, badges |
| **base** | 16px | 24px | Body text |
| **lg** | 18px | 28px | Subtitles |
| **xl** | 20px | 28px | Section headers |
| **2xl** | 24px | 32px | Page titles |
| **3xl** | 30px | 36px | Large headings |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| **normal** | 400 | Body text |
| **medium** | 500 | Emphasized text |
| **semibold** | 600 | Subheadings |
| **bold** | 700 | Headings, important |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| **sm** | `0 1px 2px rgba(0, 0, 0, 0.05)` | Subtle elevation |
| **md** | `0 4px 6px -1px rgba(0, 0, 0, 0.1)` | Cards, dropdowns |
| **lg** | `0 10px 15px -3px rgba(0, 0, 0, 0.1)` | Modals, popovers |
| **xl** | `0 20px 25px -5px rgba(0, 0, 0, 0.1)` | Dialogs |

---

## Chart Colors

For data visualization consistency:

### Light Mode
| Chart | HEX |
|-------|-----|
| **chart-1** | `#EA580C` (Orange) |
| **chart-2** | `#0D9488` (Teal) |
| **chart-3** | `#334155` (Slate) |
| **chart-4** | `#EAB308` (Yellow) |
| **chart-5** | `#F97316` (Amber) |

### Dark Mode
| Chart | HEX |
|-------|-----|
| **chart-1** | `#22D3EE` (Cyan) |
| **chart-2** | `#2DD4BF` (Teal) |
| **chart-3** | `#FBBF24` (Amber) |
| **chart-4** | `#A855F7` (Purple) |
| **chart-5** | `#F43F5E` (Rose) |

---

## RTL Support

- Arabic locale uses `dir="rtl"`
- English locale uses `dir="ltr"`
- Icons that indicate direction should be mirrored in RTL
- Padding/margins should be logical (start/end instead of left/right)

---

## Component Specifications

### Buttons

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| **Primary** | Primary color | Primary foreground | None |
| **Secondary** | Secondary color | Secondary foreground | None |
| **Outline** | Transparent | Foreground | Border color |
| **Ghost** | Transparent | Foreground | None |
| **Destructive** | Destructive color | White | None |

### Button Sizes

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| **sm** | 32px | 12px | 14px |
| **default** | 40px | 16px | 14px |
| **lg** | 44px | 24px | 16px |
| **icon** | 40px | 0 | - |

### Input Fields

- Height: 40px (default), 44px (lg)
- Border: 1px solid input color
- Border radius: radius-md (8px)
- Focus: 2px ring with primary color at 20% opacity

### Cards

- Background: card color
- Border: 1px solid border color (40% opacity)
- Border radius: radius-lg to radius-xl (10-14px)
- Padding: 16-24px

---

## Animation

| Property | Duration | Easing |
|----------|----------|--------|
| **Default** | 200ms | ease-out |
| **Hover** | 150ms | ease-in-out |
| **Modal** | 300ms | ease-out |
| **Page transition** | 200ms | ease-in-out |

---

## Quick Reference - Primary Brand Colors

```
Primary (Light): #0891B2 - rgb(8, 145, 178)
Primary (Dark):  #22D3EE - rgb(34, 211, 238)

This is a Teal/Cyan color (Hue: 209 in OKLCH)
```

---

## Notes for Mobile Developer

1. **Theme Support**: App should support both light and dark modes
2. **Font Loading**: Use Google Fonts for Inter and Cairo
3. **RTL**: Full RTL support required for Arabic
4. **Status Bar**: Match with background color based on theme
5. **Safe Areas**: Respect device safe areas for notched devices
6. **Haptics**: Use subtle haptic feedback for button presses
