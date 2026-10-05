---
name: Syneva
description: An integrated review environment (IRE) — a local browser desk where a human judges an agent's diff and hands back a verdict.
source: packages/design-system (StyleX tokens, shared with the public site); this file describes their use on the desk.
colors:
  paper: "#f6f6f0"
  white: "#ffffff"
  field: "#eef0e7"
  grid: "#e4e7dc"
  line: "#dcdfd4"
  line-strong: "#a8afa1"
  ink: "#191b18"
  muted: "#60635c"
  accent: "#0e6582"
  accent-deep: "#0b506a"
  accent-line: "#8eb5bf"
  wash: "#dcedf4"
  wash-tint: "#eff7fa"
  green: "#35633f"
  green-line: "#a9c6a5"
  mint: "#e0eddf"
  amber: "#875a0e"
  amber-line: "#d8bd86"
  amber-tint: "#f6ecd6"
  red: "#a8322d"
  red-line: "#e2aea6"
  red-tint: "#f8e7e3"
night:
  paper: "#101210"
  white: "#171a17"
  field: "#1d211d"
  line: "#272b27"
  line-strong: "#3c423c"
  ink: "#e4e6de"
  muted: "#9ca196"
  accent: "#62b2cd"
  wash: "#132830"
  green: "#80c48c"
  amber: "#d9a650"
  red: "#e9827a"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "17px (22–26px for a page-like headline: the overview, a cover)"
    fontWeight: 500
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Geist Mono', ui-monospace, monospace"
    fontSize: "10–11px"
    letterSpacing: "0.08em"
    textTransform: uppercase
  mono:
    fontFamily: "'Geist Mono', ui-monospace, monospace"
    fontSize: "11.5–13px"
rounded:
  all: "0"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.white}"
    height: "28px"
  button-outlined:
    backgroundColor: "{colors.white}"
    borderColor: "{colors.line-strong}"
    textColor: "{colors.ink}"
  button-keep:
    backgroundColor: "{colors.green}"
    textColor: "{colors.white}"
  field:
    backgroundColor: "{colors.white}"
    borderColor: "{colors.line-strong}"
    focus: "{colors.accent} rule + 3px {colors.wash} halo"
---

# Design System: Syneva (the desk)

## Overview

**Creative North Star: "The review circuit, at the desk"**

The desk is the public site's light, ruled field put to work. Chrome sits on paper, the code and every card sit on white, and everything is separated by 1px rules, never by shadows or rounding. Large plain typography stays on the site; the desk speaks the same two voices at an application's density: Geist for the chrome, Geist Mono for anything that is code, a path, a count or a label. The record outlives the session, so nothing on the desk shouts: color marks a verdict, a question or a state, and everything else stays ink on paper.

The palette, the type families, the easing and the breakpoints belong to `@syneva/design-system` (`packages/design-system`), the package the public site (`apps/landing`, see its `DESIGN.md`) and the hub dashboard use too. The StyleX tokens there are the source of truth; this document describes how the desk uses them and never defines a second palette. The desk's own measures (bar heights, the type scale, the runtime-written widths) live in `packages/frontend/src/shared/ui/desk.stylex.ts`, its control sizes and review tones in `shared/ui/desk-control.styles.ts`.

Because the desk is the whole product (PRODUCT.md: "the review surface is the whole product"), it must read equally well in its light default and its night mirror (Settings → Appearance), and with any of the curated code themes the reviewer pairs with either.

**Key Characteristics:**

- The landing's light field: `--paper` chrome, `--white` reading surfaces, `--field` hover, the petrol `--wash` for what is selected
- Square everything: no radius, no pills; tags, counts, dots and controls are rectangles
- 1px rules as the universal separator; shadows only on layers that float
- Two voices: Geist for the chrome, Geist Mono for code, paths, counts, timestamps and the uppercase labels
- Color as signal only: petrol follows the work and the questions, green marks a verdict, amber a requested change, red what goes
- Both appearances and both code-theme families are user settings that mix freely

## Colors

Petrol blue follows the work; green marks a human verdict. The desk keeps the site's rule and adds the two signals a review needs.

### Signals

Each signal is a triad — text tone, tint fill, rule — and a surface that carries it uses all three, so a state reads without its hue (tags carry words, not just colors).

- **Petrol** (`--accent` #0e6582 / `--wash` #dcedf4 / `--accent-line` #8eb5bf): interaction and the agent's side of the conversation — focus, the primary action (Send to agent), the active file, questions, the agent's replies, every toggle that is on. `--wash-tint` (#eff7fa) is its palest step, the agent's message card.
- **Green** (`--green` #35633f / `--mint` #e0eddf / `--green-line` #a9c6a5): a verdict — Keep, Approve, the review's progress, added lines, resolved threads.
- **Amber** (`--amber` #875a0e / `--amber-tint` #f6ecd6 / `--amber-line` #d8bd86): a change the reviewer asked for, a stale guide or diff, a file signed off with objections.
- **Red** (`--red` #a8322d / `--red-tint` #f8e7e3 / `--red-line` #e2aea6): removed lines, destructive actions (shown on hover), errors.

### Neutral

- **Paper** (#f6f6f0): the chrome's ground — top bar, sidebar, guide bar, notes panel, file headers.
- **White** (#ffffff): reading surfaces and tiles — the diff canvas, thread and composer cards, fields, dialogs, menus, outlined controls.
- **Field** (#eef0e7): hover rows and quiet controls under the pointer.
- **Grid** (#e4e7dc): the ruled grid field behind the desk's page-like states (the overview, the closed-desk cover).
- **Line** (#dcdfd4) / **Line Strong** (#a8afa1): the default rule and the emphasised one (tiles, dialogs, section heads, idle decorative icons).
- **Ink** (#191b18) / **Muted** (#60635c): text and secondary text. There is no fainter text tone: timestamps and hints are muted, not ghosted.

**Named Rules:**

**The Signal-Only Rule.** Color never decorates. Every saturated pixel marks a verdict, a state, a question or focus.

**The Tint Rule.** A signal on the chrome is a tint: its text on its fill under its rule. Solid fills are reserved for the two actions that settle something — the petrol Send to agent (and a dialog's confirm) and the green Keep / Approve.

**The Two-Masters Rule.** Chrome appearance and the code highlight theme are independent settings that may mix freely. The one link is a courtesy: a code theme still at its appearance's default (Pierre Light / Pierre Dark) follows an appearance switch; a theme the reviewer picked is never touched.

### Night theme

`dark` in `packages/design-system/src/themes.stylex.ts` is a StyleX theme over the same variables, toggled on `<html>` by Settings → Appearance (`applyAppearance`). It overrides every color token and keeps each role, not each name: `--paper` stays the chrome's ground (#101210), `--white` becomes the raised surface one step above it (#171a17), the neutrals keep the landing's warm green cast, and the signals lift for a dark ground (petrol #62b2cd, green #80c48c, amber #d9a650, red #e9827a) with every text tone at WCAG AA on paper, white, field and its own tint. Text on a solid signal fill is written `--white`, so it flips to dark ink on the lifted fills.

## Typography

**Chrome:** Geist (self-hosted by the design system, weights 100–900) with a `system-ui` fallback.
**Code and labels:** Geist Mono (self-hosted).

Both stacks are user-overridable in Settings → Appearance (UI font / Code font, a few curated families load from Google Fonts on selection); the diff takes its family from the Code font via `--diffs-font-family`.

### Hierarchy (`deskText`)

- **Display** (17px; 22–26px Geist 500 at -0.03em for a page-like headline — the overview, the closed cover): the largest ink on the desk.
- **Headline** (14px, 600): dialog titles, prose headings in threads.
- **Title** (13px, 1.6): thread and composer text, dialog messages.
- **Body** (12px, 1.5): the chrome's working text — top bar, rows, settings.
- **Small** (11px): captions, hints, the agent's live line.
- **Label** (10–11px Geist Mono, uppercase, +0.08em, muted): section labels (FILES, REVIEW NOTES, a guide category), the chrome's own voice — the site's "ONE REVIEW ROUND".
- **Mono** (11.5–13px): file names in the tree and headers (600 when the path is the subject), counts, timestamps, line numbers.

**Named Rules:**

**The Two-Voice Rule.** Geist typesets the chrome; Geist Mono typesets anything that is code, a path, a count, a timestamp or a label. No third font. Key hints (kbd) stay in the sans so system key symbols render at cap height.

**The Sentence-Case Rule.** Labels read as sentences, like the site's: "Send to agent", "Mark reviewed", "Load diff anyway".

## Layout

A fixed application frame, not a scrolling page: a 48px top bar above the workspace (`--left-width` tree | 1px resizable rule | diff column | optional notes column at `--notes-width`). Every column scrolls on its own; the desk does not.

Bars that touch share a height: the sidebar's tab strip, the guide bar and the notes head are 40px (`deskSize.subbar`), so their bottom rules read as one line across the seams. The churn counts (+added / −removed) keep a 5px gap on every surface that prints them.

Below 1100px (`media.tablet`) the tree and the notes panel leave the grid and return as drawers under the top bar, over a paper scrim.

## Elevation & Depth

Depth is drawn with rules, not cast. A shadow is evidence that a layer has left the desk, and there is one soft shadow for all of them (`0 12px 32px rgb(25 27 24 / 14%)`, dialogs a step deeper): menus and popovers, the floating Approve, the toast. Dialogs sit over a paper veil (`--paper` at 74%), never a dark scrim: the light field stays visible behind.

## Shapes

Square controls, thin rules, ruled cards. The tree's nesting rails are 1px `--line` rules every 14px drawn in the indent; the active file and the agent's messages carry a 2px petrol rail on their left edge; a thread message carries a 2px rule (`--line-strong`, `--accent` for the agent, `--amber` while editing). Icons are Lucide at a 1.5 stroke, matching the site's drawings; the pending-review marker is a square dot like every live marker of the system.

## Components

Controls compose the design system's recipes (`@syneva/design-system/controls.styles`: `control.base` + a tone, `field`, `caption`, `tag`, `dot`) with the desk's sizes and review tones (`deskControl`).

- **Buttons.** Compact (28px) in the top bar and dialogs, mini (22px) inside rows. Tones: `primary` (solid petrol: Send to agent, confirm), `outlined` (white tile, strong rule, petrol on hover), `quiet` (no tile until hovered), `ask` / `request` / `resolve` / `caution` (the review's tints), `keep` (solid green verdict) and `undo` (a plain tile — removing a change is a decision, not a warning), `dangerHint` (destructive intent shows only under the pointer). Every action that has a key carries its kbd chip.
- **Segmented register.** A ruled white tile of exclusive choices (Split / Stacked, Rendered / Source, a notes lens); the chosen one sits on the petrol wash.
- **Tabs.** Underlined, the chosen one ruled in petrol on the strip's bottom rule (Tree / Walkthrough, Settings / Shortcuts).
- **Tags and counts.** Square mono text on its tint (`tag`): a thread's intent, a note's status, an open count.
- **Fields.** White wells under a strong rule; focus turns the rule petrol with a 3px wash halo. Selects draw their own chevron.
- **Tooltip.** Fast (0.18s), inverted ink on paper, square, under the control (`tip`).
- **File tree (signature).** Geist Mono rows, 14px per level with 1px rails, the change kind as the file icon's tint (green added, petrol modified, red deleted), the review state as a square dot / check / flag.
- **Threads (signature).** A ruled ledger: square message cards with a 2px left rule, the agent's on the palest petrol; the composer is the next card in the thread, not a dialog.
- **Diff canvas.** Rendered by `@pierre/diffs` with its own theme system (Pierre and Shiki themes chosen in Settings). Its colors are not part of this token layer; it takes the Code font, the size, the selection wash (the petrol rule tone) and the scrollbar gutter from the desk. Syneva draws the ledger around it; the instrument themes itself.

## Do's and Don'ts

### Do:

- **Do** read every color from the tokens (`color['--x']`) so both appearances follow; never a literal hex in a style.
- **Do** carry a signal as its triad (text, tint, rule) and name the state in words as well.
- **Do** keep controls compact and square, labels in the mono caption voice, labels in sentence case.
- **Do** align touching bars on the 40px subbar so the seam stays one rule.

### Don't:

- **Don't** round anything, or bring back pills.
- **Don't** cast shadows on in-page surfaces, or darken the page behind a dialog.
- **Don't** introduce a third font, or let the mono face set chrome sentences.
- **Don't** apply a solid fill outside Send to agent, a dialog's confirm and the green verdicts.
- **Don't** style the desk outside StyleX: the only global CSS is `app/desk.css` (element defaults under `[data-desk]`) and the markdown prose under `[data-prose]`, both zero-specificity and scoped.
