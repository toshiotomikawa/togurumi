---
version: v6
name: Togurumi
description: Warm atelier storefront for handmade crochet amigurumi. Cream paper grounds, chocolate ink, olive primary actions, and brick accents.
colors:
  primary: "#5f6b3a"
  olive-dark: "#4f5b33"
  olive-soft: "#e7e8d3"
  on-olive: "#fbf6ec"
  cream: "#faf4ea"
  cream-2: "#f3e9da"
  card: "#fffcf7"
  choc: "#5b3a22"
  choc-2: "#7a5a40"
  body: "#6a5545"
  leaf: "#8f9a62"
  brick: "#c4642c"
  badge-bg: "#a8501f"
  badge-text: "#ffffff"
  line: "#e6d8c4"
  line-strong: "#c9b293"
  gold: "#b48a5a"
  footer-bg: "#56643c"
  cta-wood: "#6e4c2f"
  error: "#922c39"
typography:
  display:
    fontFamily: Fraunces
    fontWeight: 400
    fontSize: 64px
    lineHeight: 1.05
    letterSpacing: -0.01em
  title:
    fontFamily: Fraunces
    fontWeight: 500
    fontSize: 34px
    lineHeight: 1.18
    letterSpacing: -0.01em
  price:
    fontFamily: Fraunces
    fontWeight: 500
    fontSize: 28px
    lineHeight: 1.2
    letterSpacing: 0em
  body:
    fontFamily: Nunito Sans
    fontWeight: 400
    fontSize: 16px
    lineHeight: 1.6
    letterSpacing: 0em
  label:
    fontFamily: Nunito Sans
    fontWeight: 700
    fontSize: 15px
    lineHeight: 1.4
    letterSpacing: 0.08em
  kana:
    fontFamily: Noto Sans JP
    fontWeight: 400
    fontSize: 15px
    lineHeight: 1.4
    letterSpacing: 0.18em
rounded:
  qty: 4px
  chip: 6px
  quote: 8px
  card: 10px
  panel: 12px
  band: 14px
  feature: 16px
  squircle: 26px
  pill: 999px
spacing:
  xs: 6px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 40px
components:
  page:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.body}"
  header:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.choc}"
  brand-mark:
    backgroundColor: "{colors.brick}"
  nav-active:
    textColor: "{colors.primary}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-olive}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: 10px 30px
    height: 48px
  button-primary-hover:
    backgroundColor: "{colors.olive-dark}"
    textColor: "{colors.on-olive}"
  button-outline:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.choc}"
    rounded: "{rounded.pill}"
  product-cta:
    backgroundColor: "{colors.cta-wood}"
    textColor: "{colors.on-olive}"
    rounded: "{rounded.qty}"
    height: 52px
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.choc}"
    rounded: "{rounded.card}"
  benefits-strip:
    backgroundColor: "{colors.cream-2}"
    textColor: "{colors.choc-2}"
    rounded: "{rounded.band}"
  last-pieces-band:
    backgroundColor: "{colors.olive-soft}"
    textColor: "{colors.choc}"
    rounded: "{rounded.feature}"
  badge:
    backgroundColor: "{colors.badge-bg}"
    textColor: "{colors.badge-text}"
    rounded: "{rounded.pill}"
  favorite-active:
    textColor: "{colors.brick}"
  ornament-rule:
    textColor: "{colors.gold}"
  ornament-leaf:
    textColor: "{colors.leaf}"
  divider:
    backgroundColor: "{colors.line}"
  divider-strong:
    backgroundColor: "{colors.line-strong}"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.choc}"
    rounded: "{rounded.panel}"
  alert-error:
    backgroundColor: "{colors.cream-2}"
    textColor: "{colors.error}"
  footer:
    backgroundColor: "{colors.footer-bg}"
    textColor: "{colors.on-olive}"
---

## Overview

Togurumi is an online storefront and journal for handmade crochet amigurumi. The interface uses warm paper grounds, serif display headings, botanical ornaments, and soft photography so the shop reads like a quiet craft studio rather than a generic catalog.

## Colors

Light mode ("day") pairs cream (`#faf4ea`) and warm parchment (`#f3e9da`) grounds with chocolate brown ink (`#5b3a22`) and muted brown body text (`#6a5545`). Olive (`#5f6b3a`, primary) marks main buttons, active navigation underlines, and rating stars. Brick (`#c4642c`) colors the yarn-ball mark, ornament rules, and active favorite hearts; a deeper brick (`#a8501f`) backs small badges with white text for 4.5:1 contrast.

Night mode (`[data-theme="night"]`, or `[data-theme="system"]` under dark color scheme) shifts grounds to deep umber (`#1e1813`, `#2a211a`, `#2b231c`), lightens ink to warm cream (`#f2e1cb`, `#d8c6b2`), brightens olive to `#b5c486` with dark `#1b2013` text, and shifts brick to `#e58c55`.

## Typography

Two preloaded local variable fonts and one Japanese webfont carry all copy:

- **Fraunces** (300 to 700) for headings, product titles (42px to 64px), prices (28px), and italic studio quotes.
- **Nunito Sans** (400, 600, 700, 800) for 16px body copy at 1.6 line height, navigation links, card titles (15px bold), and buttons.
- **Noto Sans JP** (300, 400) for Japanese kana eyebrows and product subtitles with 0.14em to 0.18em letter spacing.

## Layout

Page width caps at 1440px with horizontal gutters of 40px on desktop, 20px at 900px and below, and 16px at 600px and below. The home page flows from a sticky translucent header to a split hero with blended photo tiles, a four-column benefits strip, an eight-column featured grid (four columns at 1280px, two at 600px), a low-stock band, three category tiles, a studio story with video card, three journal cards, reviews, FAQ, and an olive footer. Product pages use a two-column split with a thin text footer.

## Elevation & Depth

Surfaces rely on hairline borders (`#e6d8c4`) and a single soft brown drop shadow (`0 10px 28px -18px` from `#5b3a22` at 40% opacity) on product cards, journal cards, FAQ panels, and cart items. Buttons stay flat except for a subtle olive shadow on pill CTAs.

## Shapes

Action pills use `999px` radii. Cards use `10px`, content panels and inputs `12px`, benefit strips `14px`, and feature bands `16px`. Quantity steppers and product add-to-cart buttons use crisp `4px` corners. Product gallery frames use `16px` fallback radii upgraded to `26px` with CSS `corner-shape: squircle` where supported.

## Do's and Don'ts

- Do keep light and dark tokens paired through the `--v6-*` custom properties and respect `prefers-reduced-motion` by disabling image zoom and underline transitions.
- Do use `#a8501f` with `#ffffff` text for small counters and stock badges instead of `#c4642c` so contrast stays legible.
- Don't mix pure black `#000000` or cool gray neutrals into surfaces or text; keep neutrals grounded in warm brown and cream.
- Don't override `Fraunces` on display headings or switch pill CTAs to sharp rectangles outside the product detail quantity row.
