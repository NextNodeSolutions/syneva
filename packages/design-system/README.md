# @syneva/design-system

The one design system of every Syneva front: the public site (`apps/landing`, Astro) and the hub's UI (`packages/frontend`, React: the dashboard and the desk). It ships as TypeScript and CSS source; each front compiles it with its own StyleX build, so there is nothing to build here (`check` is its only task, and Turborepo's `transit` task folds it into its consumers' hashes).

The site's `DESIGN.md` (`apps/landing/DESIGN.md`) describes the language: a light ruled field, large plain Geist type, Geist Mono for anything typed or counted, square geometry, 1px rules, petrol for the work and mint/green for a human verdict. The repository root's `DESIGN.md` documents how the desk uses it (its density, its night theme). This package is the implementation; the documents describe how to use it rather than defining a second palette.

## Exports

| Export | What it holds |
| --- | --- |
| `./tokens.stylex` | StyleX variables with literal custom-property names (`var(--paper)`, `var(--accent)`, ...): `color`, `font`, `ease`, `duration`, `layout`, `typeScale` (`--h2-size`, read by name by the site's global stylesheet), and `hexColor`, the palette's hex values for the places that need a literal colour (a `theme-color` meta, the site's emails), which `color` takes its values from. |
| `./media.stylex` | Every breakpoint and preference query as style keys (`media`) and as bare queries for `matchMedia` (`queries`). Width keys are max-width ranges declared widest first. |
| `./curves.stylex` | The easing curves the tokens and `@syneva/motion` share. |
| `./transitions.stylex` | `transition.fast`: the timing (fast duration, out ease) of a quick state change, for the recipes that ease several properties alike. |
| `./when` | The `When<T>` type for a value that applies only under a condition. |
| `./press.styles` | `press.control`: a pressable control's eased fills and its give under the pointer. |
| `./controls.styles` | `caption` (`base`, `upper`), the mono caption; `tag` (`base`, `accent`), a petrol label; `dot` (`base` + a tone: `petrol`, `green`, `red`), a status square. |
| `./inline.stylex` | `textLinkMarker`, put on a link whose `textLink.arrow` steps forward on hover. |
| `./inline.styles` | What sits inside a line of text: `textLink` (`base`, `small`, `arrow`), the secondary action (there are no ghost buttons), which takes its sentence's colour; `textButton.base`, a `<button>` that reads as text (composed after `textLink` where it should look like one). |
| `./a11y.styles` | `a11y.srOnly`: text a screen reader reads and nothing draws. |
| `./ruled.styles` | `ruledItem.base`: a point under its own strong rule with a petrol square on the rule's start (the site's steps and facts, the hub's register). |
| `./icons` | The line icons' paths (`ICONS`, `IconName`) on `ICON_VIEW_BOX`, and the arrow of actions and rows (`ARROW_PATH` on `ARROW_VIEW_BOX`), drawn by each front in its own markup with its own stroke width; `CHECK_PATH`, a verdict's check, on the arrow's grid. |
| `./brand` | The mark's geometry (`MARK_VIEW_BOX`, `MARK_RAYS`, `MARK_DIAMOND`) and the `WORDMARK`, drawn by each front in its own markup. |
| `./brand.styles` | `brand` (`link`, `mark`): the wordmark lockup every front's header sets, the mark turning on hover. Each front adds only its own: the site skips the turn under keyboard operation, the hub sets its ink and its product label ("hub"). |
| `./brand.stylex` | `brandMarker`, put on the wordmark link so its mark turns while it is hovered. |
| `./fonts.css` | The `@font-face` rules for Geist and Geist Mono. |
| `./fonts/*` | The font files (latin variable WOFF2 subsets, OFL; provenance in `fonts/SOURCE.md`). |

## Colour roles

Each signal comes as a text tone (AA on `--paper`, `--white` and its own tint), a tint fill and a rule tone:

| Signal | Text | Tint | Rule | Means |
| --- | --- | --- | --- | --- |
| petrol | `--accent` | `--wash` | `--accent-line` | the agent's work, actions, questions |
| green | `--green` | `--mint` | `--green-line` | a human verdict, an approval |
| amber | `--amber` | `--amber-tint` | `--amber-line` | a change the reviewer asked for |
| red | `--red` | `--red-tint` | `--red-line` | what goes: a removal, a destructive action, an error |

`--mint-tint` and `--red-pale` are the bands of an added and a removed line. A label on a solid fill uses `color['--white']`, never a literal `#fff`.

## Using it

- **Astro (the site):** style elements with `sx(...)` (`apps/landing/src/shared/lib/sx.ts`, `stylex.attrs` for markup); import `fonts.css` once in the document shell and preload the faces by their `?url` imports.
- **React (the hub UI):** `stylex.props(...)`. The hub dashboard and the hub's server pages follow the site's language at app density. Each entry imports `fonts.css` for its side effect; Vite bundles every CSS import and StyleX's rules into the one stylesheet the page shells link (`/styles.css`), so global CSS there must be page-neutral. Primitives built on these recipes live in `packages/frontend/src/shared/ui/`.
- **A new recipe** belongs here only when more than one front (or both hub pages) uses it; a component's own styles stay colocated with it as `*.styles.ts`, markers and variables in `*.stylex.ts`.

The StyleX invariants that bite (merging replaces a property's whole value, `border: 0` resets style and colour, media keys widest first, ancestor markers) are listed in `apps/landing/AGENTS.md` and hold in every front.
