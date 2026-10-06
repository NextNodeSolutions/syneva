---
name: Syneva
description: An integrated review environment (IRE) — a local browser desk where a human judges an agent's diff and hands back a verdict, and the hub that hosts every desk.
source: packages/design-system (StyleX tokens, shared with the public site); this file describes their use on the desk and the hub.
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
  signal: "#1888b0"
  wash: "#dcedf4"
  wash-tint: "#eff7fa"
  wash-ink: "#2f5566"
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
  grid: "#1b1f1b"
  line: "#272b27"
  line-strong: "#3c423c"
  ink: "#e4e6de"
  muted: "#9ca196"
  accent: "#62b2cd"
  accent-line: "#2c5d6c"
  signal: "#4cb2db"
  wash: "#132830"
  wash-tint: "#0f1d22"
  wash-ink: "#a9d0dd"
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
  # The hub's steps (packages/frontend/src/pages/dashboard, widgets/hub-shell).
  page-headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  figure:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  figure-tile:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  row-title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  hub-body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  note:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.45
  caption:
    fontFamily: "'Geist Mono', ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: "0.02em"
  hub-label:
    fontFamily: "'Geist Mono', ui-monospace, monospace"
    fontSize: "10.5px"
    letterSpacing: "0.08em"
rounded:
  all: "0"
spacing:
  bar: "48px"
  subbar: "40px"
  sidebar: "232px"
  rail: "56px"
  page-inset: "32px"
  page-inset-phone: "16px"
  grid-cell: "24px"
  journal: "300px"
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
  button-outlined-small:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    height: "30px"
    padding: "5px 10px"
  nav-entry:
    textColor: "{colors.ink}"
    typography: "{typography.hub-body}"
    height: "32px"
    padding: "0 11px"
  nav-entry-current:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
  nav-count-yours:
    backgroundColor: "{colors.white}"
    textColor: "{colors.accent}"
    typography: "{typography.caption}"
    padding: "1px 5px"
  station:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    padding: "14px 16px"
  station-waiting:
    backgroundColor: "{colors.wash-tint}"
  station-on:
    backgroundColor: "{colors.wash}"
  board-column-yours:
    backgroundColor: "{colors.wash-tint}"
  stat-tile:
    backgroundColor: "{colors.white}"
    padding: "18px 20px"
  desk-row-open:
    textColor: "{colors.accent}"
  popover:
    backgroundColor: "{colors.white}"
    padding: "6px 0"
    width: "260–360px"
  filter-chip:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.accent}"
    height: "26px"
    padding: "0 8px"
---

# Design System: Syneva (the desk and the hub)

## Overview

**Creative North Star: "The review circuit, at the desk"**

The desk is the public site's light, ruled field put to work. Chrome sits on paper, the code and every card sit on white, and everything is separated by 1px rules, never by shadows or rounding. Large plain typography stays on the site; the desk speaks the same two voices at an application's density: Geist for the chrome, Geist Mono for anything that is code, a path, a count or a label. The record outlives the session, so nothing on the desk shouts: color marks a verdict, a question or a state, and everything else stays ink on paper.

The palette, the type families, the easing and the breakpoints belong to `@syneva/design-system` (`packages/design-system`), the package the public site (`apps/landing`, see its `DESIGN.md`) and the hub dashboard use too. The StyleX tokens there are the source of truth; this document describes how the desk and the hub use them and never defines a second palette. The desk's own measures (bar heights, the type scale, the runtime-written widths) live in `packages/frontend/src/shared/ui/desk.stylex.ts`, its control sizes and review tones in `shared/ui/desk-control.styles.ts`. The hub shell's measures live in `packages/frontend/src/shared/ui/shell.stylex.ts` (the desk lays its drawers out against the rail too), its motion runtime in `packages/frontend/src/shared/lib/motion.ts`.

Because the desk is the whole product (PRODUCT.md: "the review surface is the whole product"), it must read equally well in its light default and its night mirror (Settings → Appearance), and with any of the curated code themes the reviewer pairs with either.

The hub is the same field arranged as an application around the desks. A paper sidebar holds the navigation; each page is a ruled ledger under a page head, and the overview draws the review circuit itself: three ruled stations on the grid field, the petrol route between them, one square per desk at the station whose turn it is. When a desk's turn moves, its square, card or row travels to the new place, so the hub is seen to be live. The desk opens inside the same shell with the sidebar folded to a rail, so the next review is one click away.

**Key Characteristics:**

- The landing's light field: `--paper` chrome, `--white` reading surfaces, `--field` hover, the petrol `--wash` for what is selected
- Square everything: no radius, no pills; tags, counts, dots and controls are rectangles
- 1px rules as the universal separator; shadows only on layers that float
- Two voices: Geist for the chrome, Geist Mono for code, paths, counts, timestamps and the uppercase labels
- Color as signal only: petrol follows the work and the questions, green marks a verdict, amber a requested change, red what goes
- Both appearances and both code-theme families are user settings that mix freely
- One shell for the hub and the desk: a 232px paper sidebar that folds to a 56px rail, the page you are on flat on the petrol wash inside a petrol hairline
- The circuit as the hub's signature drawing: ruled stations on the 24px grid field, a petrol route, a dotted return, a square token per desk
- Motion that explains a change: entrances step in nested and settle within about 700ms, desks travel when their turn moves, counts tick; reduced motion shows the end state

## Colors

Petrol blue follows the work; green marks a human verdict. The desk keeps the site's rule and adds the two signals a review needs.

### Signals

Each signal is a triad — text tone, tint fill, rule — and a surface that carries it uses all three, so a state reads without its hue (tags carry words, not just colors).

- **Petrol** (`--accent` #0e6582 / `--wash` #dcedf4 / `--accent-line` #8eb5bf): interaction and the agent's side of the conversation — focus, the primary action (Send to agent), the active file, questions, the agent's replies, every toggle that is on. `--wash-tint` (#eff7fa) is its palest step, the agent's message card. In the hub petrol also marks the page you are on, the waiting-on-you count, a chosen station or display, and every Open.
- **Live** (`--signal` #1888b0): a running process, not a state: the hub's pulsing live square and the circuit's token for a desk whose agent is at work. `--wash-ink` (#2f5566) is the petrol ink the agent's own words take on a board card.
- **Green** (`--green` #35633f / `--mint` #e0eddf / `--green-line` #a9c6a5): a verdict — Keep, Approve, the review's progress, added lines, resolved threads.
- **Amber** (`--amber` #875a0e / `--amber-tint` #f6ecd6 / `--amber-line` #d8bd86): a change the reviewer asked for, a stale guide or diff, a file signed off with objections.
- **Red** (`--red` #a8322d / `--red-tint` #f8e7e3 / `--red-line` #e2aea6): removed lines, destructive actions (shown on hover), errors, a hub that does not answer.

### Neutral

- **Paper** (#f6f6f0): the chrome's ground — top bar, sidebar, guide bar, notes panel, file headers; the hub's sidebar and its page ground.
- **White** (#ffffff): reading surfaces and tiles — the diff canvas, thread and composer cards, fields, dialogs, menus, outlined controls; the hub's stations, cards, stat tiles and popovers.
- **Field** (#eef0e7): hover rows and quiet controls under the pointer, a nav entry under the pointer.
- **Grid** (#e4e7dc): the ruled grid field behind the desk's page-like states (the overview, the closed-desk cover) and under the hub's circuit band, as a 24px field.
- **Line** (#dcdfd4) / **Line Strong** (#a8afa1): the default rule and the emphasised one (tiles, dialogs, section heads, idle decorative icons, a ledger group's head, a station's frame).
- **Ink** (#191b18) / **Muted** (#60635c): text and secondary text. There is no fainter text tone: timestamps and hints are muted, not ghosted.

**Named Rules:**

**The Signal-Only Rule.** Color never decorates. Every saturated pixel marks a verdict, a state, a question or focus.

**The Tint Rule.** A signal on the chrome is a tint: its text on its fill under its rule. Solid fills are reserved for the two actions that settle something — the petrol Send to agent (and a dialog's confirm) and the green Keep / Approve.

**The Two-Masters Rule.** Chrome appearance and the code highlight theme are independent settings that may mix freely. The one link is a courtesy: a code theme still at its appearance's default (Pierre Light / Pierre Dark) follows an appearance switch; a theme the reviewer picked is never touched.

**The Waiting-Ground Rule.** In the hub the palest petrol (`--wash-tint`) is the ground of the work that waits on the reviewer: the You station while desks wait there, the board's Your turn column. The wash (`--wash`) inside a petrol hairline marks what is chosen or current: the page you are on, a chosen station, a display tile or segment that is on, a filter chip, an open popover's trigger.

### Night theme

`dark` in `packages/design-system/src/themes.stylex.ts` is a StyleX theme over the same variables, toggled on `<html>` by Settings → Appearance (`applyAppearance`). It overrides every color token and keeps each role, not each name: `--paper` stays the chrome's ground (#101210), `--white` becomes the raised surface one step above it (#171a17), the neutrals keep the landing's warm green cast, and the signals lift for a dark ground (petrol #62b2cd, green #80c48c, amber #d9a650, red #e9827a) with every text tone at WCAG AA on paper, white, field and its own tint. Text on a solid signal fill is written `--white`, so it flips to dark ink on the lifted fills. The hub reads the same variables: its sidebar, its circuit field and its washes follow the theme with no rule of their own.

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

### Hierarchy in the hub

The hub runs a step larger than the desk: it is read in one look between two pieces of work, not worked through line by line.

- **Page headline** (26px Geist 500, -0.03em, 1.12; 23px on phones): every hub page's one h1, the page's statement ("Two desks wait on you."), balanced. The lede under it is 13.5px muted, 8px below.
- **Figure** (40px at a circuit station, 34px in a cockpit tile, 28px on phones; Geist 500, -0.03em, line-height 1, tabular numerals): a count the page is about. A station's zero goes to `--line-strong`.
- **Row title** (15px Geist 500, -0.01em): a desk's session in the ledger, a ledger group's name, a project, a settings section's heading.
- **Hub body** (13px, 1.5): the sidebar and its nav entries, a row's Open, menu rows, facts.
- **Note** (12.5px, 1.45–1.55, muted): the secondary sentence: a stage's detail under a row, a group's note, a journal line, a section's note, a small control's label.
- **Caption** (11px Geist Mono, muted): metadata in runs: a row's repository and mode, the turn's age, nav counts, the journal's time, the sidebar's version.
- **Hub label** (10.5px Geist Mono, uppercase, +0.08em, muted): the name over a section or a figure: a nav group (HUB), a station (YOU), a stat tile, a board column, the journal's head, a menu section.

**Named Rules:**

**The Two-Voice Rule.** Geist typesets the chrome; Geist Mono typesets anything that is code, a path, a count, a timestamp or a label. No third font. Key hints (kbd) stay in the sans so system key symbols render at cap height.

**The Sentence-Case Rule.** Labels read as sentences, like the site's: "Send to agent", "Mark reviewed", "Load diff anyway".

**The Tabular Figure Rule.** A number that changes under the reviewer's eyes is set in tabular numerals (or in the mono), so a count that ticks never moves the words beside it.

## Layout

A fixed application frame, not a scrolling page: a 48px top bar above the workspace (`--left-width` tree | 1px resizable rule | diff column | optional notes column at `--notes-width`). Every column scrolls on its own; the desk does not.

Bars that touch share a height: the sidebar's tab strip, the guide bar and the notes head are 40px (`deskSize.subbar`), so their bottom rules read as one line across the seams. The churn counts (+added / −removed) keep a 5px gap on every surface that prints them.

Below 1100px (`media.tablet`) the tree and the notes panel leave the grid and return as drawers under the top bar, over a paper scrim.

### The hub shell

The hub is an application frame too: the sidebar (232px) beside the page, filling the viewport. The document never scrolls; the sidebar and the page each scroll on their own. Folding narrows the sidebar's grid track to the 56px rail (220ms, `--ease-out`) and the page widens in step; the sidebar is never laid out again. Every icon sits on the rail's centre line in both states (the list's 8px inset plus an entry's 12px padding put a 16px icon's centre 28px in, half the rail), so a fold only clips the labels, which fade out first and back in after.

The 48px bars touch across the shell as the 40px ones do on the desk: the sidebar's top, the desk's top bar beside the rail and the phone bar share the height, so their rules meet.

Inside the desk, the rail is a 56px column at the desk's left. Opened, the full sidebar uncovers over the desk (its clip opens to the sidebar's width in 240ms) and the desk does not move.

Every page has a head (30px above, 20px below, a 32px inset; the headline and lede at the left, the page's own controls at the right, a hairline under) and a body at the same 32px inset (16px on phones). The overview stacks the circuit band (about 200px, the full width) above the ledger, with the journal as a 300px column at the ledger's right when the page is 1040px wide or more, under it otherwise; with no desk open it holds one 720px column on the same inset instead (Empty overview).

The listings lay themselves out by the width of their container, not the window's (beside the sidebar and the journal a wide window can still give a narrow column): a ledger row keeps one line down to a 640px listing, takes two lines to 441px and stacks below; the board runs four columns, two from 980px, one from 560px; the cockpit's four tiles go two by two from 900px and its two figures stack; a settings-like section (a 260px heading column beside its content, 40px apart) goes to one column at 760px.

On phones (750px and down, `media.stacked`) the sidebar leaves the grid for a drawer (`min(300px, 86vw)`) under a 48px bar of its own, over the paper veil; the desk drops its rail and gets its wordmark back in its top bar.

## Elevation & Depth

Depth is drawn with rules, not cast. A shadow is evidence that a layer has left the desk, and there is one soft shadow for all of them, dialogs a step deeper: menus and popovers, the floating Approve, the toast; in the hub, the Display and Filter panels, the rail opened over the desk, the phone drawer, and a desk while it travels to its new place. Dialogs sit over a paper veil (`--paper` at 74%), never a dark scrim: the light field stays visible behind. The phone drawer takes the same veil.

### Shadow Vocabulary

- **Floating** (`box-shadow: 0 12px 32px rgb(25 27 24 / 14%)`): every layer over the page, and every desk in motion.

**Named Rules:**

**The Lift Rule.** A shadow means a layer has left the page, floating over it or travelling across it. A desk on the move takes the floating shadow at the start of its travel and sets it down when it lands; nothing at rest in the page casts one. Tiles and cells part on hairlines: the cockpit's tiles are drawn with inset rules, not shadows.

## Shapes

Square controls, thin rules, ruled cards. The tree's nesting rails are 1px `--line` rules every 14px drawn in the indent; the active file and the agent's messages carry a 2px petrol rail on their left edge; a thread message carries a 2px rule (`--line-strong`, `--accent` for the agent, `--amber` while editing). Icons are Lucide at a 1.5 stroke, matching the site's drawings; the pending-review marker is a square dot like every live marker of the system.

The hub keeps every corner square. The circuit's stations are ruled white tiles under a strong rule; the route between them is a 1px petrol rule ending on an open chevron; the return under them is a dotted rule (1.5px, dashes 2 5, `--accent-line`) ending on an arrowhead. A desk at its station is a 9px square token: filled petrol while it waits on you, `--signal` while its agent works, a petrol outline once sent. Live squares are 7px; a hollow one means sent or awaited, and a live one pulses (2.4s) only while a process holds it. A menu's check is a 14px square that a petrol square fills, inset 2px. The cockpit marks the reviewer's own tile with a 2px petrol rule along its top. An empty board column is a dashed strong rule. The shell's icons are the design system's line icons on its 24-unit grid, 16px at a 1.6 stroke with square caps, never filled; a desk row's kind icon is 22px at 1.2.

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

### Hub shell

- **Sidebar.** Paper under a right rule, set in its own 13px Geist so it reads the same on the dashboard and over the desk. Its top is the 48px bar: the mark (22px), the wordmark and `hub` in mono after a strong rule. Under it, the hub's identity as a white tile under a hairline (its name 13px 500, its address in 10.5px mono, its live square), the place a hosted workspace switch will take. Then New review, the shell's one standing action on every page (an outlined 30px control with its N key; folded, the plus on the rail). Then the navigation (Overview, Reviews, Projects, Plans; under a HUB label, Settings and Hub), and at the foot (48px, a top rule) the live square, the version and the fold control.
- **Nav entry.** 32px, 13px, behind a transparent 1px rule, on `--field` under the pointer. The page you are on sits flat on the petrol wash inside a petrol hairline, its icon petrol. Counts are 11px mono, muted; the waiting-on-you count is the one in petrol, on a white tile inside a petrol hairline. Folded, that count rides the icon's corner as a 14px petrol square.
- **Rail.** Folded, each entry is its icon on the centre line; its label opens at its right as the inverted tooltip (ink on paper, 12px) after 0.15s (at once while the pointer moves from one icon to the next), drawn in one fixed layer outside the sidebar so its fold never clips it; a tap never shows one. Over the desk the rail carries the same navigation and, opened, the desks also waiting on you, which wait faded in place while it is folded so its icons never move. At rest the desk's rail is the rail's width; opened, it takes the sidebar's width at once and its clip uncovers it.

### Overview displays

Three displays of the same desks, chosen from the Display panel and kept in the URL: the circuit by default, the board, the cockpit.

- **Circuit (signature).** A band on white under the 24px grid field: three stations (Your agent, You, Sent) as ruled buttons at least 124px tall, 72px petrol routes between them (16px on phones), the dotted return under them with its caption, and the idle desks named at its foot. A station holds its square and label, its figure and phrase, and its tokens at its foot. Choosing a station puts it on the wash under a petrol rule and narrows the ledger to that turn; choosing it again shows every turn.
- **Board.** A column per turn, the reviewer's own first on the palest petrol, columns parted by hairlines; a column's 46px head carries its square, its label and its count. A card is a white tile under a hairline (strong under the pointer), the whole card its link: its title (14.5px), its repository and mode in 10.5px mono, the agent's words in `--wash-ink`, its progress and tags, and a foot under a hairline with the wait, Close and Open. Armed, its warning takes the progress's place, so the card keeps its height; keyboard focus frames the whole card in petrol. Cards hold their order while the pointer or focus is on the board, as the ledger's rows do.
- **Cockpit.** Four stat tiles (white, parted by inset hairlines): a label, a figure, a 12px line on how to read it; a figure with nothing to count yet says "Not yet" rather than show a zero. Under them, the rounds of the last 14 days as one petrol bar series (no legend: the cell's title names it) on a strong baseline over a 32px hairline grid, bars 6px apart, today's carrying its number, `--accent-deep` under the pointer; beside it, this week's verdicts as one ruled line each: the verdict in words, its count and share in mono, a 3px bar in its signal (green kept, red undone, amber requested).

### Ledger and journal

- **Ledger.** Desks in groups (by turn, the reviewer's own first and a chosen station narrowing it to that turn; or by project), each under a strong rule with its square, its name, its count in mono and its note at the right.
- **Desk row (signature).** One line on a wide listing: the kind icon; the desk (its session as the title, its repository and mode under it in mono, the mode in ink); the stage (a square and a mono label, Your turn on its petrol tag, the turn's age beside it; the detail under it as a note cut with an ellipsis); the review (the approvals meter and its count, then the decided changes, requests in amber, questions in petrol); Close; and Open as the row's end, petrol, 13px 500, its arrow stepping 4px forward while the row is hovered or its link focused. The whole row is the link and its focus ring frames the row. On a fine pointer, hover slides the content 10px in over white at 60% and turns the icon petrol (a 1.08 spring); the slide is a `translate` of the cells, never the row's padding, so the columns keep their widths and no text re-wraps. Close is the row's quiet action: muted, red with a `--red-line` underline only under the pointer. A row that was not in the listing before fades out of the palest petrol once (1.6s).
- **Empty overview.** No desk live: one 720px column on the page inset, never centred or stretched. Open a desk first (a group head over a strong rule, one sentence, the `syneva open` box, New review outlined with its N key, the setup guide), then the desks closed before, by repository: each group head names the repository, its closed count and its path, with a quiet New review that opens the dialog on that repository; at most three repositories of two desks, the rest one link away in Reviews. A desk closed while the page is open lands on the palest petrol and fades to paper (1.6s).
- **Journal feed.** A ruled ledger of events: the time in mono (a 48px column), the event's square, its sentence as a note, and the desk it is about in mono, petrol under the pointer. A just-recorded event lands on the wash, drops 4px into place and settles (1.4s).

### Popover panels

- **Display and Filter.** The page head's two outlined triggers; open, the trigger sits on the wash inside a petrol hairline. The panel is white under a strong rule with the floating shadow, 260 to 360px wide, opening down from its trigger with a 4px fall and fade (160ms); it hangs from the trigger (it scrolls with the page), its left edge on the trigger's or, near the window's right edge, its right edge on the trigger's, and focus leaving it closes it. Inside, sections part on hairlines under hub labels: the displays as three ruled tiles (the chosen one on the wash with a petrol rule and petrol text), two-way segmented registers, square checks with their counts, and Reset as an underlined muted link. Filters in force show under the head as petrol chips on the wash (26px, a petrol hairline), each closing itself; their row opens and closes by its height (`--duration-medium`), so the page under it slides rather than jumps, and focus goes to the next chip or back to Filter.

### Motion

The hub's motion runs on the Web Animations API (`shared/lib/motion.ts`, no runtime dependency) on the design system's `--ease-out` curve. Every animation plays from a pose to the element's resting style, so a page whose animation never runs shows everything in place.

- **Entrances.** An element names its pose with `data-enter`: `rise` (8px up: rows, sections, stations, tiles, the page's statement), `slide` (8px in from the left: nav entries), `fade` (what holds its place: a group head, the head's actions, the identity tile, the circuit's return), `grow` (a rule drawing along its length: the circuit's routes). The runtime also offers `pop` and `draw` (an SVG path tracing its length). Each plays in 360ms; siblings step 28ms apart, capped at 140ms so a long list arrives together; a nested element waits 60ms after its parent. The page's last element settles within about 700ms. An entrance plays when a page or a display opens, never again on a poll.
- **Travel.** A desk that changes place (a ledger row to another group, a board card to another column, a circuit token to another station) moves from where it was in 560ms, lifted on the floating shadow (FLIP, `shared/lib/use-flip.ts`). A token going back round the circuit takes the dotted return under the stations, each corner adding half the time.
- **Counts.** A count that changes ticks to its new value in 650ms on a cubic ease-out; the cockpit's figures count up from zero when it opens.
- **Turn flash.** A desk whose turn changes washes its row on `--wash` and fades back in 1.4s, even where the row does not move.
- **Shell.** The sidebar folds in 220ms and its labels, counts and identity tile fade in 120ms (back in after 80ms); the desk's rail opens in 240ms; the phone drawer slides in 260ms with its veil fading in step. A page move fades the old page out in 140ms while the new page shows at once, at its top, and plays its own entrance; the sidebar holds still (nothing else crossfades). Back returns a page where it was left. Phones take no view transition: the drawer's slide is the move. One motion per move, never a rise on top of a rise.
- **Overlays.** New review hangs from a line near the top (`min(10dvh, 80px)`) and grows downwards; its veil fades in with its 200ms rise. The close toast rises in (200ms) and leaves in a 150ms fade. Escape closes the topmost layer only.
- **Reduced motion.** The end state at once: no entrance, no travel, no flash, counts jump, and the page's stylesheet drops every animation and transition.

## Do's and Don'ts

### Do:

- **Do** read every color from the tokens (`color['--x']`) so both appearances follow; never a literal hex in a style.
- **Do** carry a signal as its triad (text, tint, rule) and name the state in words as well.
- **Do** keep controls compact and square, labels in the mono caption voice, labels in sentence case.
- **Do** align touching bars on the 40px subbar so the seam stays one rule; in the hub shell, on the 48px bar.
- **Do** take the shell's measures from `shell.stylex.ts` (232px sidebar, 56px rail, 48px bars) and keep every icon on the rail's centre line, so a fold only clips labels.
- **Do** keep a hover for a fine pointer (`media.finePointer`): a tap leaves a sticky `:hover` behind on a touch screen, which would read as a chosen or active state. The control recipe does so for every tone.
- **Do** mark the page you are on, a chosen station and a display that is on with the petrol wash inside a petrol hairline, and the work waiting on the reviewer with the palest petrol.
- **Do** give every hub entrance a `data-enter` pose played through the runtime (`MOTION_MS`), inside the 700ms budget, and let a desk whose turn changes travel or flash, so the change is seen.
- **Do** give each review signal its own line and its word when a chart shows verdicts.

### Don't:

- **Don't** round anything, or bring back pills.
- **Don't** cast shadows on in-page surfaces, or darken the page behind a dialog.
- **Don't** introduce a third font, or let the mono face set chrome sentences.
- **Don't** apply a solid fill outside Send to agent, a dialog's confirm and the green verdicts.
- **Don't** style the desk outside StyleX: the only global CSS is `app/desk.css` (element defaults under `[data-desk]`) and the markdown prose under `[data-prose]`, both zero-specificity and scoped; the hub's page-level CSS stays in `app/dashboard.html` (its element reset, the selection and scrollbar colors, the page's view transition and the reduced-motion rule), with no global focus rule that would outrank the components' ring.
- **Don't** push the desk aside when its rail opens: the sidebar floats over it.
- **Don't** stack the green, red and amber signals side by side in one bar: they sit too close to tell apart.
- **Don't** play a page's entrance over the old page's exit: one motion per move.
