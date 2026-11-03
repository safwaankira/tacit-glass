---
version: alpha
name: Tacit Glass
description: A live explorer for Tacit, set as a declassified audit file. What the chains make public is printed; what the protocol keeps private is redacted.
colors:
  primary: "#171717"
  paper: "#F4EEE3"
  paper-deep: "#EAE2D3"
  ink: "#171717"
  ink-soft: "#5E584F"
  rule: "#CFC5B4"
  redaction: "#171717"
  on-redaction: "#8A8276"
  accent: "#E07B00"
  on-accent: "#171717"
  verified: "#2F6B4F"
  on-verified: "#F4EEE3"
  bitcoin: "#B85F00"
  ethereum: "#4B4BC4"
  alert: "#A3301B"
typography:
  display:
    fontFamily: IBM Plex Serif
    fontSize: 30px
    fontWeight: "600"
    lineHeight: 36px
    letterSpacing: -0.01em
  section:
    fontFamily: IBM Plex Serif
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 26px
  figure:
    fontFamily: IBM Plex Mono
    fontSize: 24px
    fontWeight: "500"
    lineHeight: 30px
    fontFeature: '"tnum"'
  body:
    fontFamily: IBM Plex Mono
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 20px
  label:
    fontFamily: IBM Plex Mono
    fontSize: 10.5px
    fontWeight: "500"
    lineHeight: 14px
    letterSpacing: 0.1em
  stamp:
    fontFamily: IBM Plex Mono
    fontSize: 9.5px
    fontWeight: "600"
    lineHeight: 12px
    letterSpacing: 0.08em
rounded:
  none: 0px
  sm: 2px
spacing:
  hair: 4px
  sm: 8px
  md: 16px
  lg: 28px
  xl: 48px
components:
  page:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
  redaction-bar:
    backgroundColor: "{colors.redaction}"
    textColor: "{colors.on-redaction}"
    typography: "{typography.stamp}"
    rounded: "{rounded.none}"
    padding: 2px 6px
  stamp-verified:
    backgroundColor: "{colors.verified}"
    textColor: "{colors.on-verified}"
    typography: "{typography.stamp}"
    rounded: "{rounded.sm}"
  finding-banner:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    padding: 14px 18px
  live-mark:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    size: 8px
  exhibit:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: 16px
  source-note:
    textColor: "{colors.ink-soft}"
    typography: "{typography.stamp}"
  chain-rule-bitcoin:
    backgroundColor: "{colors.bitcoin}"
    height: 3px
  chain-rule-ethereum:
    backgroundColor: "{colors.ethereum}"
    height: 3px
  error-line:
    textColor: "{colors.alert}"
    typography: "{typography.body}"
  table-rule:
    backgroundColor: "{colors.rule}"
    height: 1px
---

## Overview

A declassified audit file on Tacit, produced live. Think of a released government audit: typed figures on cream stock, numbered sections, hairline ruled tables, and black redaction bars wherever the protocol withholds something. The reader is a protocol engineer or a judge checking whether the numbers are real and whether the privacy claims are honest. The file's job is to be checked, not admired.

The central idea is that **privacy is shown as redaction**. Every amount, owner and input-to-output link the protocol hides appears in the exact place it would sit, as a black bar. What is public is printed plainly beside it. A reader sees the shape of what's hidden without being told.

It belongs to Tacit's own visual family: the cream, ink and orange of Tacit's dapp, the monospace of its data.

## Colors

A paper-and-ink system with one live accent.

- **Paper** {colors.paper} is the stock. **Paper deep** {colors.paper-deep} marks an exhibit, a block quoted out of the chain (the lookup result, the finding).
- **Ink** {colors.ink} carries every figure, rule and redaction. Redaction bars are the same ink as the text: hidden things are as solid as public ones.
- **Ink soft** {colors.ink-soft} is for labels, units and source notes. Never for figures.
- **Accent** {colors.accent} is Tacit orange, and it means *live or actionable*: links, the live dot, the one emphasised number in the finding. Nothing decorative is orange.
- **Verified** {colors.verified} appears only as the stamp that says the chain and the indexer agree.
- **Bitcoin** {colors.bitcoin} and **Ethereum** {colors.ethereum} are used only as 3px rules that head each chain's column, so the eye learns which side it is on. Never as fills or text.
- **Alert** {colors.alert} is for a failed read or a disagreement. If the page is healthy, there is no red on it.

## Typography

Two families from one superfamily, the way a typed report has a typeset title page.

- **IBM Plex Serif** for the document title and the numbered section heads only (`display`, `section`). It gives the file a spine.
- **IBM Plex Mono** for everything else: figures, tables, labels, prose. Figures use tabular numerals so columns line up like a ledger.
- `figure` is for the four headline heights at the top and nowhere else.
- `label` is uppercase with wide tracking; `stamp` is the smallest size and is reserved for source notes and redaction labels.
- Bold is for the one number a sentence is about. Not for labels.

## Layout

- One centred column, 1120px max, 16px gutters on phones.
- Sections are numbered like a report: §1 Pulse, §2 Bitcoin, §3 Ethereum · Base · Robinhood, §4 Bridge, §5 Privacy, §6 Look up. Each starts with a full-width hairline and its serif heading.
- Within a section, two columns at desktop, one on phones. Columns are separated by space and hairlines, not by boxes.
- Tables are ruled with hairlines {colors.rule} between rows, never zebra-striped.
- The finding banner sits directly under the four pulse figures. It is the only full-bleed ink block on the page.

## Elevation & Depth

None. The page is paper. No shadows, no raised cards, no glass. Depth comes from rules and from the deeper paper tone of an exhibit.

## Shapes

Square. Redaction bars and exhibits have no rounding. The verified stamp may take {rounded.sm}, like an inked stamp's soft edge. No pills.

## Components

- **Redaction bar** (`redaction-bar`): a solid ink block sized roughly to what it hides, with a tiny label in `on-redaction` (`amount`, `owner`, `link`). On hover, a title explains what the commitment is. This replaces every "hidden" badge.
- **Source note** (`source-note`): plain small text after a figure, like a footnote marker: `chain`, `indexer`, `btc`. No border, no box. When chain and indexer agree it becomes the **verified stamp** (`stamp-verified`): `✓ chain = indexer`.
- **Finding banner** (`finding-banner`): one or two sentences, ink background, the key numbers in accent. Links down to the evidence.
- **Live mark** (`live-mark`): an 8px orange square before "live" in the header, pulsing at most once every 2 seconds; still under reduced motion.
- **Exhibit** (`exhibit`): a deeper-paper block with a small `EXHIBIT` label, used for lookup results.
- **Chain rule**: the 3px coloured top rule on each chain's column.
- **Error line** (`error-line`): one sentence in alert, saying what couldn't be read and that it retries.

## Do's and Don'ts

- **Do** put each redaction bar exactly where the hidden value would sit in the row. The layout of the table itself should show what's missing.
- **Do** keep every figure traceable: each one carries a source note.
- **Do** let a row be one line on desktop and on phones where it fits. Dense is correct.
- **Don't** use cards with borders and rounded corners for every block. This is a document, not a dashboard of tiles.
- **Don't** use pills, gradients, glows, shadows or emoji.
- **Don't** colour a number to make it look exciting. Orange marks what is live or clickable, red marks what failed, nothing else.
- **Don't** repeat the same explanatory sentence on every row. Explain once in a legend; let the redaction bars carry it after that.
- **Don't** invent a redaction for something that is actually public. Honesty about what is visible matters more than drama.
