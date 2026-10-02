---
name: Syneva public site
description: A light technical workspace for human judgment of agent-written code.
---

# Design System: Syneva public site

## Overview

**Creative North Star: "The review circuit"**

A light, ruled field carries large plain typography and precise explanatory drawings. Orange follows the work; mint marks a human verdict. The site feels like a readable technical document, not an imitation application screenshot.

This system belongs to the standalone public site. The repository-root `DESIGN.md` governs the review application and is not replaced by this document.

## Colors

`styles.css` owns the palette in `:root`; use its custom properties rather than repeating color values.

- `--paper`, `--white`: light page and control surfaces.
- `--ink`, `--muted`: headings and supporting text.
- `--accent`, `--orange`, `--peach`: actions, routes and open questions.
- `--mint`, `--green`: understood or accepted states.
- `--line`, `--line-strong`, `--grid`: separation and drawing structure.

**The Light Field Rule.** Keep every section light. Do not introduce a dark promotional panel.

## Typography

Self-hosted Geist handles display and body text; Geist Mono identifies paths, commands and drawing annotations. Font provenance and license live in `fonts/`.

The heading scale, weights, tracking and responsive sizes are defined in `styles.css`. Headings use sentence case and tight tracking; paragraphs remain open and readable. Supporting functional text must remain readable after SVG scaling, not merely have a large nominal font size.

## Layout

A centered, ruled frame contains wide editorial sections and paired copy/drawing chapters. The chapters alternate sides on desktop and put explanation before drawing on phones. Responsive rules in `styles.css` own the breakpoints and measurements.

Navigation stays compact. The primary action remains distinct from the text-link alternative. Avoid feature-card grids that fragment the Before/After reading order.

## Elevation & Depth

The page uses borders and pale surfaces, not shadows. SVG geometry supplies depth within the illustrations; it does not pretend the page itself is paper, metal or a physical desk.

## Shapes

Square controls, thin rules, routed paths and angular sheet geometry form the visual vocabulary. Small checkmarks and the Syneva mark identify decisions without adding decorative badges.

## Components

- **Actions:** orange primary link, outlined navigation link, and underlined secondary links. Preserve the visible keyboard focus treatment.
- **Hero headline (home):** the H1 is set as a two-line diff with a mono gutter. Line 1 is the agent's addition (line number, orange `+`, peach band); line 2 is the human verdict (green check, mint band, `decide` in green with a drawn underline). It is the whole color system in one sentence: orange follows the work, mint marks a human decision. Bands sweep in once; the text is real, selectable heading text.
- **Hero instrument (home):** one review round drawn as a flat technical figure in three columns (your agent, your desk, your verdict) joined by ports and one dotted return route. `hero.js` drives it on a single 16s Web Animations clock: files settle into a reading order, a change opens, you ask, the agent answers on the line, you accept, the ledger fills, Send returns to the agent and only the rejected file comes back pending. The markup is the static pose. Pointer movement drifts the columns a few pixels apart and lights orange registration crosses in the hero field; touch devices get neither. On phones the figure reframes onto the desk column (`data-compact`).
- **Review circuit (How it works, `#how`):** the former hero drawing, now opening the loop section where its story belongs. Passive SVG animation: the changeset travels horizontally while its review layers separate vertically. Keep stage and playback controls out of the illustration.
- **Trust register:** the stats under `#facts` (0 / 1 / 4 / 100%). The numbers are product facts (verdicts, the single tab, review modes, locality), never growth or adoption metrics; the copy says so openly.
- **Confidence loop:** four numbered steps under `#how` on one ruled rail, read left to right. A sequential row, not a feature-card grid: the reading order is the story.
- **Comparison (`#compare`):** a ruled table against two categories (your editor's diff, hosted AI review), never named competitors. Every cell must stay true for the category as a whole.
- **Handoff contract:** the review event under `#handoff` as a fenced JSON document in mono type. Fields must match `packages/contracts/src/agent.ts` and the spec; mark the round as illustrative and trimmed.
- **Chapters:** explanatory headline followed by availability status and concrete actions. Prototype status is product truth, not an eyebrow above the heading. Chapters alternate sides (`chapter({ reverse })`).
- **Installation:** a selectable command with copy feedback and a manual-copy failure state (every `.command`, wired by `motion.js`).
- **FAQ:** native disclosure controls with direct answers.
- **Footer:** pitch and primary action, a sitemap generated from the navigation table, and the wordmark sized from its container so it spans the frame.

### Pages

Every navigation link and sub-link has its own page with its own drawings: Product (overview, review desk, guided walkthrough, ask your agent, plan desk), Workflows (overview, working tree, staged changes, pull requests, single file), Resources (overview, get started, connect your agent, questions & answers, changelog) and Open source, plus a 404. Subpages share one rhythm from `src/ui.mjs`: a page hero (breadcrumb, headline, availability, lede, actions, the page's drawing), ruled prose and chapter sections, the start band, and a pager to the neighbouring pages of the section. Overview pages list their section as linked index rows. The changelog is curated from the git history and its chart counts real commits; never invent entries.

### Files

`src/` is build-time only and never deployed: `nav.mjs` is the single site map (menus, footer, breadcrumbs, pagers, and the build fails if a link has no page), `layout.mjs` the document shell, `ui.mjs` the shared sections, `art/*.mjs` the drawings and `pages/*.mjs` one module per route. `scripts/build-landing.mjs` renders them into `dist/<route>/index.html`; `pnpm dev:site` renders on every request. Assets use absolute paths.

`styles.css` owns tokens and shared components, `home.css` the hero and home sections, `pages.css` the subpage layouts, `art.css` every drawing's styles, `circuit.css` the review circuit, and the `navigation*.css` files the morphing menu. `motion.css` owns the reveal system and the drawing motion vocabulary: `.a-draw`, `.a-fade`, `.a-rise`, `.a-pop`, `.a-sweep`, `.a-type` and `.a-move` (offset by `--tx`/`--ty`) enter once when their section arrives, staggered by the inline `--d`; `.a-signal`, `.a-pulse`, `.a-blink` and `.a-spin` keep an arrived scene quietly alive. `motion.js` owns visibility, reveals, the stat count-up, compact framing (`svg[data-compact]` swaps its viewBox at 600px), the circuit's routing and clipboard behavior; `hero.js` owns the hero timeline. The reveal system is one-shot: a `data-reveal` section gains `is-inview` the first time it enters the viewport, its `data-reveal-item` children stagger in, and a `data-rule` section draws an orange rule that settles into its border; the reveal observer stays in module scope because a function-local one can be garbage-collected mid-session. Offscreen scenes and hidden tabs pause; reduced motion shows the complete static page (every hidden state lives inside `prefers-reduced-motion: no-preference`, and every drawing's markup is its finished pose); an inline head script sets `html.js` so nothing flashes, and if the modules never boot a CSS fallback reveals everything after 3s. On phones, drawings reframe onto their subject instead of shrinking labels into microtext, and small state diagrams (`svg.is-dense`) grow their words.

## Do's and Don'ts

- **Do** make authored diagrams explain an actual review action.
- **Do** distinguish prototype concepts from available behavior.
- **Do** keep human decisions and the visitor's agent visible in the story.
- **Do** label recorded performance evidence as historical.
- **Do** keep every number on the page a product fact (verdicts, review modes, the loop, locality) and say so in the copy.
- **Don't** add photography, application screenshots or dark sections.
- **Don't** put decorative eyebrows above chapter headings.
- **Don't** promise that Syneva runs a model or reviews code on the human's behalf.
- **Don't** let shrinking SVGs turn explanatory labels into microtext.
- **Don't** state an unmeasured number (speed, adoption, time saved) anywhere, including captions.
- **Don't** compare against a named competitor; compare against categories, truthfully.

The scoped component specimens are in `.impeccable/design.json`. CSS remains the source of truth for implementation tokens; this document describes their use rather than defining a second palette.
