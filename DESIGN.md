---
version: alpha
name: Tacit Glass
description: |
  A live explorer for Tacit, built on the PostHog design system from VoltAgent/awesome-design-md (MIT): warm cream canvas,
  white hairline cards, IBM Plex Sans, olive inks, one yellow action, pastel callouts. PostHog's mascots, wordmark and
  marketing patterns are left out; Tacit-specific pieces (withheld chips, source notes, chain rules) are added.

colors:
  primary: "#f7a501"
  primary-pressed: "#dd9001"
  on-primary: "#23251d"
  ink: "#23251d"
  body: "#4d4f46"
  mute: "#6c6e63"
  hairline: "#bfc1b7"
  hairline-soft: "#dcdfd2"
  on-dark: "#ffffff"
  canvas: "#eeefe9"
  surface-soft: "#e5e7e0"
  surface-card: "#ffffff"
  surface-dark: "#23251d"
  on-dark-mute: "#b6b7af"
  link-teal: "#1078a3"
  accent-red: "#cd4239"
  accent-red-soft: "#f7d6d3"
  accent-green: "#2c8c66"
  accent-green-soft: "#d9eddf"
  accent-green-ink: "#1d6a4b"
  accent-blue-soft: "#dceaf6"
  bitcoin: "#c66a00"
  ethereum: "#5b5bd6"

typography:
  display-xl:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.5px
  display-lg:
    fontFamily: IBM Plex Sans
    fontSize: 22px
    fontWeight: 700
    lineHeight: 1.33
    letterSpacing: -0.5px
  heading-md:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.4
  figure:
    fontFamily: IBM Plex Sans
    fontSize: 26px
    fontWeight: 700
    lineHeight: 1.2
    fontFeature: '"tnum"'
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
  body-xs:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.43
  caption-sm:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.5
  utility-xs:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.33
    letterSpacing: 0.04em
  button-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.5
  code-xs:
    fontFamily: IBM Plex Mono
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.43

rounded:
  none: 0px
  xs: 2px
  sm: 4px
  md: 6px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  section: 56px

components:
  page:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.body-md}"
  card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 20px
  stat-tile:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.figure}"
    rounded: "{rounded.md}"
    padding: 16px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: 8px 16px
    height: 40px
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
  search-input:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: 40px
  sub-nav-strip:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.body}"
    typography: "{typography.body-xs}"
    height: 40px
  inline-code:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.code-xs}"
    rounded: "{rounded.xs}"
    padding: 1px 6px
  withheld-chip:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark-mute}"
    typography: "{typography.utility-xs}"
    rounded: "{rounded.xs}"
    padding: 1px 6px
  finding-banner:
    backgroundColor: "{colors.accent-red-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 16px 20px
  finding-mark:
    textColor: "{colors.accent-red}"
  live-dot:
    backgroundColor: "{colors.accent-green}"
    size: 8px
  verified-badge:
    backgroundColor: "{colors.accent-green-soft}"
    textColor: "{colors.accent-green-ink}"
    typography: "{typography.utility-xs}"
    rounded: "{rounded.full}"
    padding: 1px 8px
  source-note:
    textColor: "{colors.mute}"
    typography: "{typography.utility-xs}"
  info-banner:
    backgroundColor: "{colors.accent-blue-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  chain-rule-bitcoin:
    backgroundColor: "{colors.bitcoin}"
    height: 3px
  chain-rule-ethereum:
    backgroundColor: "{colors.ethereum}"
    height: 3px
  table-rule:
    backgroundColor: "{colors.hairline-soft}"
    height: 1px
  card-border:
    backgroundColor: "{colors.hairline}"
    height: 1px
  link-inline:
    textColor: "{colors.link-teal}"
  dark-panel:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.md}"
---

## Overview

Tacit Glass is a product-analytics page for a privacy protocol, so it borrows its chrome from a product-analytics company: **PostHog's design system** (taken from VoltAgent/awesome-design-md, MIT). A warm cream canvas, white cards with thin olive borders, IBM Plex Sans at tight weights, olive-charcoal ink, and exactly one loud colour: the yellow action button. It reads like a friendly engineering dashboard, not a somber dark-tech terminal.

What it adds for Tacit: everything the protocol keeps private is shown as a small dark **withheld chip** in the exact cell where the value would sit, so the tables themselves show the shape of what's hidden. Every figure carries a quiet **source note** saying where it was read.

PostHog's hedgehog mascots, wordmark, pricing patterns and marketing CTAs are deliberately not used. This page must never look like it is PostHog's.

## Colors

- **Canvas** {colors.canvas} end to end; never pure white as the page.
- **Surface card** {colors.surface-card} for every card and stat tile, with a 1px {colors.hairline} border.
- **Surface soft** {colors.surface-soft} for the sub-nav strip, inline code chips and secondary buttons.
- **Ink** {colors.ink} for figures and headings; **Body** {colors.body} for prose and table text; **Mute** {colors.mute} for labels and source notes.
- **Primary** {colors.primary}, the yellow, is the Look up button. Nothing else.
- **Accent green** {colors.accent-green} is the live dot in the header.
- **Accent red soft** {colors.accent-red-soft} is the finding banner (a privacy warning), with key numbers in {colors.accent-red}. **Accent green soft** {colors.accent-green-soft} is the verified badge (chain and indexer agree), its text in {colors.accent-green-ink}: PostHog's {colors.accent-green} is too light for small text on that tint (3.4:1), so it is darkened to pass WCAG AA. **Accent blue soft** {colors.accent-blue-soft} is the info banner (method notes).
- **Bitcoin** {colors.bitcoin} and **Ethereum** {colors.ethereum} appear only as 3px top rules on the cards that belong to each chain.
- **Link teal** {colors.link-teal} for links.

## Typography

IBM Plex Sans for every text role, hierarchy from weight more than size: 700 for headings and figures, 500–600 for labels, 400 for prose. Figures use tabular numerals. IBM Plex Mono only for hashes, addresses and ids inside {component.inline-code} chips. Uppercase (set in CSS, since the token format has no case property) only for eyebrows in {typography.utility-xs} and the withheld chip.

## Layout

- 1200px max content, 24px gutters (16px on phones), sections every {spacing.section}.
- A sticky {component.sub-nav-strip} with section anchors under the header.
- Stat tiles in a 4-up grid (2-up on phones). Cards in a 2-up grid with 16px gutters (1-up on phones).
- Inside cards, rows are separated by {colors.hairline-soft} rules; no zebra stripes.

## Elevation & Depth

Flat. No shadows. Depth is the white card on cream with a hairline border, and the one dark panel (the relay trust note), PostHog's inverted code-block idea.

## Shapes

6px corners on cards, tiles, banners, inputs and buttons. 2px on inline chips. Fully round only for the verified badge.

## Components

- **Stat tile**: eyebrow label, a big figure, a one-line sub-note.
- **Finding banner**: a red-soft callout opening with ⚠️ and a bold label, stating the linkability check's most telling fact.
- **Withheld chip**: dark, tiny, uppercase `withheld`, sized like a value, placed where the value would be.
- **Verified badge**: green-soft pill `✓ chain = indexer`. Plain source notes are small uppercase mute text.
- **Button primary**: the Look up button, yellow with olive text.
- **Inline code**: hashes and addresses, Plex Mono on surface-soft.
- **Info banner**: blue-soft, used once for the method note.

## Do's and Don'ts

- **Do** keep yellow to the single Look up action.
- **Do** put every card on white with a hairline border, on cream.
- **Do** keep tables dense: one line per row where it fits.
- **Don't** use PostHog's hedgehogs, logo, wordmark, product names or marketing copy.
- **Don't** add shadows, gradients or a dark hero band.
- **Don't** use the pastel callout colours as card backgrounds; they are for the one finding, the verified badge and the method note.
- **Don't** colour figures to make them exciting; red is only the privacy finding, green only verification.
- **Don't** repeat an explanation on every row; explain once in a legend.
