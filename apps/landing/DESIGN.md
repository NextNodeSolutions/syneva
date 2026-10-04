---
name: Syneva public site
description: A light technical workspace for human judgment of agent-written code.
---

# Design System: Syneva public site

## Overview

**Creative North Star: "The review circuit"**

A light, ruled field carries large plain typography and precise explanatory drawings. Petrol blue follows the work; mint marks a human verdict. The site feels like a readable technical document, not an imitation application screenshot.

This system belongs to the standalone public site. The repository-root `DESIGN.md` governs the review application and is not replaced by this document.

## Colors

`@syneva/design-system` (`packages/design-system/src/tokens.stylex.ts`) owns the palette as StyleX variables that keep their literal names (`var(--paper)`, `var(--accent)`, ...); use them rather than repeating color values.

- `--paper`, `--white`: light page and control surfaces.
- `--ink`, `--muted`: headings and supporting text.
- `--accent`, `--signal`, `--wash`: actions, routes and open questions. Petrol blue (`--accent` #0e6582) reads as trust and control, sits beside the NextNode teal, and stays clearly apart from `--green` so the agent's work never reads as a verdict. Keep it at WCAG AA: 4.5:1 as text on `--paper`, `--white` and `--wash`, and white text on it.
- `--mint`, `--green`: understood or accepted states.
- `--line`, `--line-strong`, `--grid`: separation and drawing structure.

**The Light Field Rule.** Keep every section light. Do not introduce a dark promotional panel.

## Typography

Self-hosted Geist handles display and body text; Geist Mono identifies paths, commands and drawing annotations. Font provenance and license live in `public/fonts/`.

The heading scale, weights, tracking and responsive sizes are defined in `src/app/styles/global.css` (element typography, with the h2 size from the design system's `--h2-size`) and the components' StyleX styles. Headings use sentence case and tight tracking; paragraphs remain open and readable. Supporting functional text must remain readable after SVG scaling, not merely have a large nominal font size.

## Layout

A centered, ruled frame contains wide editorial sections and paired copy/drawing chapters. The chapters alternate sides on desktop and put explanation before drawing on phones. The breakpoints live in `@syneva/design-system` (`media.stylex.ts`); each component's StyleX styles own its measurements.

Navigation stays compact. The primary action remains distinct from the text-link alternative. Avoid feature-card grids that fragment the Before/After reading order.

## Elevation & Depth

The page uses borders and pale surfaces, not shadows. SVG geometry supplies depth within the illustrations; it does not pretend the page itself is paper, metal or a physical desk.

## Shapes

Square controls, thin rules, routed paths and angular sheet geometry form the visual vocabulary. Small checkmarks and the Syneva mark identify decisions without adding decorative badges.

## Components

- **Actions:** petrol primary link, outlined navigation link, and underlined secondary links. Preserve the visible keyboard focus treatment.
- **Hero headline (home):** the H1 is set as a two-line diff with a mono gutter. Line 1 is the agent's addition (line number, petrol `+`, pale blue band); line 2 is the human verdict (green check, mint band, `decide` in green with a drawn underline). It is the whole color system in one sentence: petrol follows the work, mint marks a human decision. Bands sweep in once; the text is real, selectable heading text.
- **Hero instrument (home):** one review round drawn as a flat technical figure in three columns (your agent, your desk, your verdict) joined by ports and one dotted return route. `src/views/home/ui/hero.client.ts` drives it on a single 16s clock (`@syneva/motion/loop-timeline`, Motion over the Web Animations API): files settle into a reading order, a change opens, you ask, the agent answers on the line, you accept, the ledger fills, Send returns to the agent and only the rejected file comes back pending. The markup is the static pose. Pointer movement drifts the columns a few pixels apart and lights petrol registration crosses in the hero field; touch devices get neither. On phones the figure reframes onto the desk column (`data-compact`).
- **Review circuit (How it works, `#how`):** the drawing that opens the home page's loop section (`src/views/home/ui/circuit/`), one review round from your agent's diff to the next revision. Passive SVG animation: the changeset travels horizontally while its review layers separate vertically. Keep stage and playback controls out of the illustration.
- **Trust register:** the stats under `#facts` (0 / 1 / 4 / 100%). The numbers are product facts (verdicts, the single tab, review modes, locality), never growth or adoption metrics; the copy says so openly.
- **Confidence loop:** four numbered steps under `#how` on one ruled rail, read left to right. A sequential row, not a feature-card grid: the reading order is the story.
- **Comparison (`#compare`):** a ruled table against two categories (your editor's diff, hosted AI review), never named competitors. Every cell must stay true for the category as a whole.
- **Handoff contract:** the review event under `#handoff` as a fenced JSON document in mono type. Fields must match `packages/contracts/src/agent.ts` and the spec; mark the round as illustrative and trimmed.
- **Chapters:** explanatory headline followed by availability status and concrete actions. Prototype status is product truth, not an eyebrow above the heading. Chapters alternate sides (`<Chapter artSide="left">` puts the drawing left of the copy).
- **Installation:** a selectable command with copy feedback and a manual-copy failure state (every `[data-command]`, wired by `src/features/copy-command/model/command.client.ts`).
- **FAQ:** native disclosure controls with direct answers.
- **Footer:** pitch and primary action, a sitemap generated from the site map, and the wordmark sized from its container so it spans the frame.

### Pages

Every navigation link and sub-link has its own page with its own drawings: Product (overview, review desk, guided walkthrough, ask your agent, plan desk), Workflows (overview, working tree, staged changes, pull requests, single file), Resources (overview, get started, connect your agent, questions & answers, changelog) and Open source, plus a 404. Subpages share one rhythm from the widgets in `src/widgets/` (`page-hero`, `chapter`, `cta-band`, `page-index`) and the prose blocks in `src/shared/ui/prose/`: a page hero (breadcrumb, headline, availability, lede, actions, the page's drawing), ruled prose and chapter sections, the start band, and a pager to the neighbouring pages of the section. The breadcrumb and the availability come from the site map. Overview pages list their section as linked index rows. The changelog is curated from the git history and its chart counts real commits; never invent entries.

### Files

The source layout, its layers and its link rules are in `AGENTS.md`. Assets in `public/` use absolute paths.

The morphing menu lives in `src/widgets/navigation/`: `model/navigation-geometry.ts` measures the dropdown destinations and `model/navigation-morph.ts` coordinates shell geometry, the indicator and panel reveals without scaling or blurring text. Preview selection runs on an independent clock so hovering a product row never restarts the menu's movement, and row staggering derives from panel progress rather than a separate transition.

`@syneva/motion` owns the reveal system and the drawing motion vocabulary. A drawing element opts in with `data-anim`: `draw`, `fade`, `rise`, `pop`, `sweep`, `type` and `move` (offset by `--tx`/`--ty`) enter once when their section arrives, staggered by `data-delay` (nested elements inherit the nearest one); `signal`, `pulse`, `blink` and `spin` repeat while their scene is in view. `src/app/scripts/site.ts` boots scene pausing, the copyable commands, the disclosures and the reveals; `src/shared/ui/drawing/frames.ts` owns compact framing (`svg[data-compact]` swaps its viewBox on phones); `src/views/home/ui/circuit/circuit.client.ts` routes the review circuit; `src/views/home/ui/hero.client.ts` owns the hero timeline. The reveal system is one-shot: a `data-reveal` section's `data-reveal-item` children stagger in the first time it enters the viewport, its facts count up, and a `data-rule` section draws an accent rule that settles into its border. Offscreen scenes and hidden tabs pause their running animations and resume them where they paused (an entrance plays once and is never rewound); reduced motion shows the complete static page (every hidden pose is armed only for motion, and every drawing's markup is its finished pose); an inline head script arms the hidden poses so nothing flashes, and if the runtime never boots they show anyway after 3s. On phones, drawings reframe onto their subject instead of shrinking labels into microtext, and small state diagrams (`is-dense`) grow their words.

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

The StyleX tokens are the source of truth for implementation tokens; this document describes their use rather than defining a second palette.
