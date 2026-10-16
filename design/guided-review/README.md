# Guided review — design and prototype (PROD-88)

`prototype.html` is a self-contained page (inline CSS and JS, no build): open it in a browser. It shows the review-view design the production work (PROD-89 to PROD-97) implements: a short changeset overview, the domains ranked by risk, the selected domain's explanation and the real diff side by side. The desk's visual language is kept (DESIGN.md: paper chrome, white reading surfaces, 1px rules, square geometry, Geist and Geist Mono, the petrol/green/amber/red signals); the prototype falls back to system fonts since Geist is self-hosted by the design system.

Approval of this view is the gate before the production UI (PROD-95). The stacked PRs after this one implement the contract and the lifecycle, so the view can still change without rework below it.

## What it shows

Scenario buttons at the bottom right:

- **Default** — a six-file changeset with five behaviors. The first domain (Critical) owns two blocks of `src/hub.ts`; the fourth (Medium, "Serialized opens") owns another block of the same file. Each domain explains itself differently: a state diagram, a sequence, a data flow, a before/after, prose only, and one domain with no block at all (its summary is the explanation).
- **After reload (stale + unassigned)** — the first domain's owned code changed: its explanation carries a stale banner, one context reference no longer resolves (shown struck through, labelled, not clickable), a new change exists that no domain owns (listed as unassigned, pending), a diagram that failed to draw keeps its text, and a question asked on a block is marked stale beside its old reply.
- **Many domains** — 28 domains, to check density and the keyboard order.
- **No changes** — the empty changeset: a guide with no domains and the empty desk.
- **File review, no guide** — the plain desk with the Tree only; no explanation pane.
- **Night** toggles the appearance.

Narrow the window under 1100px for the narrow layout: the file list is a drawer, the explanation pane hangs under the guide bar as a drawer (`g` or the Explain button), the diff stays reachable underneath.

## Interaction specification

Navigation (all keyboard-reachable; every control also has a visible button):

| Key | Action |
| --- | --- |
| `]` / `[` | Next / previous domain, in risk order. Selecting a domain opens its first owned change in the diff and scrolls its explanation to the top. |
| `}` / `{` | Next / previous changed block of the current domain (across its files). |
| `b` | Back: return to the domain, explanation scroll position and code position before the last reference follow. A stack of 8. |
| `g` | Show / hide the explanation pane. |
| `w` | Domains / Tree tab in the sidebar (the complete file list is always one key away). |
| `o` | Overview (the sidebar's changeset summary; on narrow windows opens the drawer). |
| `⇧→` / `⇧←` | Next / previous file. |
| `⇧Y` / `⇧N` | Keep / undo the change under the cursor (unchanged from today). |
| `Enter` / `Space` on a diagram element | Same as clicking it: follow its code reference. |
| `⌘↵` / `⌘⇧↵` | Submit a change request / a question from the pane's composer. |
| `Esc` | Close the composer, then the drawer. |

Focus: a reference follow moves the diff cursor to the target's side and line and flashes the row; focus stays on the control that was activated so `b` returns without re-finding it. Tabbing through a diagram visits only the elements that carry a reference. The composer takes focus when opened and gives it back on Esc.

Labels: criticality reads "Critical risk / High risk / Medium risk / Low risk"; reviewer verdicts read "Pending / Kept / Undone / Decided / Changes requested". They never share a tag style.

Progressive disclosure: a domain opens with its summary, consequence ("If this is wrong"), what to verify, the changed code it owns with each block's verdict, and its blocks. Longer reasoning, assumptions and failure cases are behind "Reasoning, assumptions, failure cases" per block; diagrams carry an "As text" equivalent. Evidence is labelled "agent's claims". Nothing in the pane approves anything.

## Production components and state ownership (what PROD-95 builds)

Layer by layer, following the frontend's Feature-Sliced layout:

- `entities/review/guide/` — `model.ts` (the guide shapes), `decode.ts` (wire to model), `domains.ts` (risk order, owning domains per file), and, after PROD-90/92, the resolution model: per domain the owned unit keys, per reference its status (resolved / stale / unresolved) and the unassigned units. Derivations: domain progress from the unique owned units' decisions (never from reading), next/previous domain and change, the return stack's entries.
- `widgets/chrome/react/domain-navigator.tsx` — the sidebar's Domains tab (replaces the file walkthrough rows): changeset overview + coverage, the risk-ranked rows with verdict-derived progress, the unassigned notice. The Tree tab stays as it is.
- `widgets/guide-pane/` — the explanation column: `guide-pane.tsx` (head, consequence, verify, prerequisites, coverage list, blocks, evidence, unknowns, related, discussion), `blocks/` (prose through the existing sanitized Markdown engine, before/after, and the three diagrams as inline SVG from typed data, lazy-loaded as one chunk), `ref-chip.tsx` (the one code-reference control; pointer and keyboard emit the same action), a per-block error boundary, and the composer the discussion uses (PROD-96 wires its transport).
- `widgets/diff-view/guide-domain-chips.ts` — the owning domains on the file header and the oversized card (already in this PR).
- `app/facade/guide-domain.ts` — `selectDomain`, `stepDomain`, `stepUnit`, `followReference`, `goBack`; references resolve through `cursorJumpTo` / the virtual navigator for offscreen rows and through the preview route for context in files outside the diff.
- Store (`app/store-state.ts`): `domainId`, `guideReturn` (the stack), `guideExpanded` (opened details), `guidePaneOpen`; the sidebar tab reuses `sidebarTab`. Decisions, comments and sign-offs stay where they are: the guide owns no verdict.
- Layout (`app/react/app.tsx`, `app.styles.ts`): one more grid column (`--guide-width`, resizable) between the tree and the diff; under `media.tablet` the pane becomes the drawer described above.

Out of scope here, by the ticket: generation automation and any domain approval action.
