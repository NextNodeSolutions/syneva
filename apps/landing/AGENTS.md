# Landing page

Frontend layout: responsive, breakpoints 600/900/1100/1280. This standalone public site is separate from the review application.

Read `DESIGN.md` in this directory before changing landing-page styling or copy. The repository-root design system governs the review application only.

The site is a static Astro app: one page per route in `src/pages/` (built to `dist/<route>/index.html`, plus `404.html`), the site map in `src/content/site-map.ts` (menus, footer, breadcrumbs and pagers read it, and `integrations/linked-pages.ts` fails the build when a link has no page), shared pieces in `src/components/` (`page/` holds the subpage blocks), sections in `src/sections/`, drawings in `src/art/`. Styles are StyleX, colocated in a `*.styles.ts` next to their component, with markers and variables in `*.stylex.ts`; `src/styles/global.css` keeps only the font faces, the reset and element typography. Tokens and breakpoints come from `@syneva/design-system` (`packages/design-system`), the motion runtime from `@syneva/motion` (`packages/motion`, on Motion). Preview with `pnpm dev:site`. `pnpm build` builds the app with the rest of the workspace into `dist/`, the assets root `nextnode.toml` hands to the deploy (`assets = "apps/landing/dist"`); `public/healthz` answers the pipeline's smoke check. Only `public/` and the built pages deploy; the docs and the acceptance specs (`spec.json`, `navigation-spec.json`) never do.

Copy follows `PRODUCT.md`: first-person, direct, low-hype, and every claim true of the CLI today. Prototype work is labeled as such; numbers are product facts, never metrics.

## StyleX invariants

- Merging is per property and replaces the whole value: a later style with `{ default: null, … }` drops an earlier style's default for that property. Give an element that sets a property its own conditional values instead of merging a generic modifier over it.
- `stylex.when.ancestor(…, marker)` needs the marker on an ancestor, never on the element itself; the element's own states use plain pseudo-classes (`':hover'`).
- `border: 0` also resets the style and colour: write the three longhands, and restate them under the media query that zeroes them.
- Media keys are exclusive ranges written widest first, and a shorthand under a media query outranks an unconditioned longhand: restate the longhand under the same query.
- The CSS minifier rewrites values (`240ms` becomes `.24s`): a script that reads a token from the computed style parses its unit.

## Motion invariants

- The markup is always the finished pose. Hidden poses are StyleX styles armed by `html[data-motion]`, and the safety net shows everything after 3s if the runtime never boots.
- A drawing element opts in with `data-anim` and an optional `data-delay`; nested elements inherit the nearest delay, as the CSS `--d` they replace did.
- An entrance plays once. A scene pauses only its running animations while it is out of view (or the tab is hidden) and resumes them where they paused; it never calls `play()` on one sitting at its end, because the Web Animations auto-rewind would restart it from its first frame and the finished element would vanish and enter again.
- An element without a box (`display: none`, a drawing's secondary words on phones) animates unseen and shows its finished pose if it gets a box later.
- `@syneva/motion` is the site's only way to Motion: the landing never imports `motion` or `motion/*` itself (oxlint rejects it). `animate` comes from `@syneva/motion/animate`, the package's one seam onto the engine, and a Motion API the site needs is exported from the package first, so the engine can change without touching the site.
