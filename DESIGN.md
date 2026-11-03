---
version: alpha
name: Tacit Glass
description: |
  A live explorer for Tacit, built on the Linear design system from VoltAgent/awesome-design-md (MIT): a near-black canvas,
  a four-step charcoal surface ladder with hairline borders, one lavender accent, Inter at 400–600. Dark is the default;
  a light theme maps the same roles onto Linear's inverse tokens. Linear's wordmark and marketing patterns are not used.

colors:
  primary: "#5e6ad2"
  on-primary: "#ffffff"
  primary-hover: "#828fff"
  primary-focus: "#5e69d1"
  ink: "#f7f8f8"
  ink-muted: "#d0d6e0"
  ink-subtle: "#8a8f98"
  ink-tertiary: "#62666d"
  canvas: "#010102"
  surface-1: "#0f1011"
  surface-2: "#141516"
  surface-3: "#18191a"
  hairline: "#23252a"
  hairline-strong: "#34343a"
  redaction: "#2b2d33"
  semantic-success: "#27a644"
  success-ink: "#4cc76a"
  semantic-warning: "#f2994a"
  warning-surface: "#211912"
  bitcoin: "#f2994a"
  ethereum: "#7a7fad"
  inverse-canvas: "#ffffff"
  inverse-surface-1: "#f5f6f6"
  inverse-ink: "#000000"

typography:
  page-title:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -1.0px
  section:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.4px
  card-title:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.1px
  figure:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.6px
    fontFeature: '"tnum"'
  body:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  eyebrow:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0.4px
  button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.2
  mono:
    fontFamily: JetBrains Mono
    fontSize: 12.5px
    fontWeight: 400
    lineHeight: 1.5

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  pill: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  section: 64px

components:
  page:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 20px
  stat-tile:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.figure}"
    rounded: "{rounded.lg}"
    padding: 18px
  sub-nav:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.ink-subtle}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.canvas}"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  text-input:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 8px 12px
  focus-ring:
    backgroundColor: "{colors.primary-focus}"
    size: 2px
  card-border:
    backgroundColor: "{colors.hairline}"
    height: 1px
  card-border-strong:
    backgroundColor: "{colors.hairline-strong}"
    height: 1px
  status-badge:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 2px 8px
  verified-badge:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.success-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 2px 8px
  live-dot:
    backgroundColor: "{colors.semantic-success}"
    size: 8px
  withheld-chip:
    backgroundColor: "{colors.redaction}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.xs}"
    padding: 1px 6px
  finding-panel:
    backgroundColor: "{colors.warning-surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 16px 20px
  finding-badge:
    backgroundColor: "{colors.warning-surface}"
    textColor: "{colors.semantic-warning}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.pill}"
  inline-id:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.mono}"
    rounded: "{rounded.xs}"
    padding: 1px 6px
  footnote:
    textColor: "{colors.ink-tertiary}"
    typography: "{typography.caption}"
  chain-rule-bitcoin:
    backgroundColor: "{colors.bitcoin}"
    height: 2px
  chain-rule-ethereum:
    backgroundColor: "{colors.ethereum}"
    height: 2px
  light-page:
    backgroundColor: "{colors.inverse-canvas}"
    textColor: "{colors.inverse-ink}"
  light-card:
    backgroundColor: "{colors.inverse-surface-1}"
    textColor: "{colors.inverse-ink}"
---

## Overview

Tacit Glass is a product dashboard for a privacy protocol, so it takes its chrome from **Linear's design system** (VoltAgent/awesome-design-md, MIT): software-craft documentation, dense and technical and quietly luxurious. A near-black canvas with a faint blue tint, data in charcoal panels lifted one step at a time, hairline borders, and a single lavender accent used only where something can be acted on.

Dark is the default. A light theme exists for daylight reading and printing; it maps the same roles onto Linear's inverse tokens and is chosen with a toggle in the header.

Tacit's own additions: everything the protocol keeps private appears as a **withheld chip** in the exact cell where the value would be, and every figure carries a quiet **footnote** saying where it was read. Linear's wordmark, product screenshots and marketing CTAs are not used; this page must never pass for Linear's.

## Colors

- **Canvas** {colors.canvas} is the page. Hierarchy comes from the surface ladder: **surface-1** {colors.surface-1} for cards and stat tiles, **surface-2** {colors.surface-2} for badges and inline ids, **surface-3** {colors.surface-3} for the sub-nav. Never skip a step.
- **Hairline** {colors.hairline} borders every card; **hairline strong** {colors.hairline-strong} marks table headers and the input.
- Text runs **ink** {colors.ink} (figures, headings) → **ink muted** {colors.ink-muted} (table text, prose) → **ink subtle** {colors.ink-subtle} (labels) → **ink tertiary** {colors.ink-tertiary} (footnotes).
- **Primary** {colors.primary}, lavender, is the Look up button, links and the focus ring. Nothing decorative is lavender.
- **Semantic success** {colors.semantic-success} is the live dot; **success ink** {colors.success-ink} is the text of the verified badge (chain and indexer agree).
- **Semantic warning** {colors.semantic-warning} on **warning surface** {colors.warning-surface} is reserved for the one privacy finding. Linear's marketing palette has no warning colour; this one is added and kept to that single panel.
- **Redaction** {colors.redaction} is the withheld chip.
- **Bitcoin** {colors.bitcoin} and **Ethereum** {colors.ethereum} appear only as 2px top rules on the cards that belong to each chain.

## Typography

Linear's custom faces aren't public, so the file's recommended substitutes are used: **Inter** at 400 / 500 / 600 (never 700+) and **JetBrains Mono** 400 for hashes, addresses and ids. Display sizes take negative tracking (-1px at 32px); the eyebrow takes +0.4px. Figures use tabular numerals. Mono only inside {component.inline-id}.

## Layout

- 1200px max content, 24px gutters (16px on phones); {spacing.section} between sections.
- Sticky sub-nav pill bar on surface-3 under the header.
- Stat tiles 4-up (2-up on phones); cards 2-up with 16px gutters (1-up on phones); activity tables full width so each row is one line.
- Inside cards, rows separate with hairlines; no zebra stripes.

## Elevation & Depth

The surface ladder plus hairlines, as Linear does it. No shadows, no gradients, no glows. A faint 1px top highlight on lifted cards.

## Shapes

12px on cards and tiles, 8px on buttons and the input, 4px on chips, pills for badges.

## Components

- **Stat tile**: eyebrow label, figure, one-line sub-note.
- **Finding panel**: warning surface, a pill badge "Privacy finding", one or two sentences with the key numbers in ink at 600.
- **Withheld chip**: small, uppercase, on redaction grey, placed where the value would sit.
- **Verified badge**: pill, success-green text on surface-2. Other footnotes are plain ink-tertiary captions.
- **Button primary**: Look up, lavender with white text. On hover it lightens to {colors.primary-hover} and the text turns {colors.canvas}: Linear's white-on-hover-lavender is 2.9:1, below WCAG AA.
- **Theme toggle**: a secondary button in the header, Dark / Light.

## Do's and Don'ts

- **Do** keep lavender to the Look up button, links and focus.
- **Do** lift with the surface ladder, one step at a time.
- **Do** keep tables to one line per row on desktop.
- **Don't** use Linear's wordmark, logo, product names or marketing copy.
- **Don't** add drop shadows, gradients, spotlight cards or glows.
- **Don't** use weights above 600.
- **Don't** let the warning colour leave the finding panel, or green leave the live dot and verified badge.
- **Don't** repeat an explanation on every row; explain once in a legend.
