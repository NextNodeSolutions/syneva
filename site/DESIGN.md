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
- **Review circuit:** passive SVG animation. The changeset travels horizontally while its review layers separate vertically. Keep stage and playback controls out of the illustration.
- **Trust register:** the gap stats under `#trust` (0 / 1 / 4 / 100%). The numbers are product facts — verdicts, modes, loop, locality — never growth or adoption metrics; the copy says so openly.
- **Confidence loop:** four numbered steps under `#loop` on one ruled rail, read left to right. A sequential row, not a feature-card grid: the reading order is the story.
- **Handoff contract:** the ReviewResult under `#handoff` as a fenced JSON document in mono type with a spec strip. Fields must match `src/contracts/agent.ts`; mark the round as illustrative.
- **Chapters:** explanatory headline followed by availability status and concrete actions. Prototype status is product truth, not an eyebrow above the heading.
- **Installation:** a selectable command with copy feedback and a manual-copy failure state.
- **FAQ:** native disclosure controls with direct answers.

`hero-motion.css` owns the hero drawing and its coordinated timeline; `motion.css` owns chapter figure animation, the scroll-reveal system and shared reduced-motion rules. `motion.js` owns visibility, reveals, the stat count-up, compact framing and clipboard behavior. The reveal system is one-shot: a `data-reveal` section gains `is-inview` the first time it enters the viewport, its `data-reveal-item` children stagger in, and a `data-rule` section draws its top rule; the reveal observer stays in module scope because a function-local one can be garbage-collected mid-session. Offscreen scenes and hidden tabs pause; reduced motion shows the complete static page (every hidden reveal state lives inside `prefers-reduced-motion: no-preference`); without JS the page renders fully (`html.js` gates all hidden states). On phones, redundant circuit labels disappear while meaningful chapter lettering grows.

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

The scoped component specimens are in `.impeccable/design.json`. CSS remains the source of truth for implementation tokens; this document describes their use rather than defining a second palette.
