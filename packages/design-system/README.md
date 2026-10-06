# @syneva/design-system

The one design system of every Syneva front: the public site (`apps/landing`, Astro) and the hub's UI (`packages/frontend`, React: the dashboard and the desk). It ships as TypeScript and CSS source; each front compiles it with its own StyleX build, so there is nothing to build here (`check` is its only task, and Turborepo's `transit` task folds it into its consumers' hashes).

The site's `DESIGN.md` (`apps/landing/DESIGN.md`) describes the language: a light ruled field, large plain Geist type, Geist Mono for anything typed or counted, square geometry, 1px rules, petrol for the work and mint/green for a human verdict. The repository root's `DESIGN.md` documents how the desk uses it (its density, its night theme). This package is the implementation; the documents describe how to use it rather than defining a second palette.

## Exports

| Export | What it holds |
| --- | --- |
| `./tokens.stylex` | StyleX variables with literal custom-property names (`var(--paper)`, `var(--accent)`, ...): `color`, `font`, `ease`, `duration`, `layout`, `typeScale`, and `hexColor`, the palette's hex values for the places that need a literal colour (a `theme-color` meta, the site's emails), which `color` takes its values from. |
| `./themes.stylex` | Themes over `color` (`stylex.createTheme`), applied by a front on its root. |
| `./media.stylex` | Every breakpoint and preference query as style keys (`media`) and as bare queries for `matchMedia` (`queries`). Width keys are max-width ranges declared widest first. |
| `./curves.stylex` | The easing curves the tokens and `@syneva/motion` share. |
| `./transitions.stylex` | `transition.fast`: the timing (fast duration, out ease) of a quick state change, for the recipes that ease several properties alike. |
| `./when` | The `When<T>` type for a value that applies only under a condition. |
| `./press.styles` | `press.control`: a pressable control's eased fills and its give under the pointer. |
| `./controls.styles` | The apps' control recipes at application density: `focus` (`ring`, the one petrol focus ring, outside the box; `inset`, the same inside it) for any focusable the control recipes do not cover, `control` (`base`, `primary`, `outlined`, `quiet`, `danger`, `small`, `large`, `square`, `block`, `arrow`), `field` (`base`, `mono`, `invalid`, `select`, `selectBox`, `chevron`), `caption` (`base`, `upper`), `tag` (`base` + a tone), `dot` (`base` + a tone: `accent` the live signal, `petrol`, `green`, `amber`, `red`; `hollow` outlines the tone instead of filling it; `live`). |
| `./controls.stylex` | `controlMarker`, put on a control whose `control.arrow` steps forward on hover; `textLinkMarker`, the same for a link whose `textLink.arrow` steps forward. |
| `./inline.styles` | What sits inside a line of text: `textLink` (`base`, `small`, `onWash`, `arrow`), the secondary action of every front (the site's `TextLink` and the hub's are this recipe; there are no ghost buttons), which takes its sentence's colour and, in the apps, is composed after `focus.ring`; `code` (`base`, `onPaper` for a chip on a wash band), an inline command; `kbd` (`base`, `onFill` and `onTint` for a cap on a solid or tinted control), a key hint set in the sans (Geist Mono lacks the key symbols). |
| `./meter.styles` | `meter` (`track`, `fill`, `empty`): a share of a whole as a thin green track (the hub's approvals; the desk's file progress can reuse it). The fill spans the track and the caller scales it to its ratio; `empty`, composed over `track`, is the dashed rule of a whole of nothing. |
| `./ruled.styles` | `ruledItem.base`: a point under its own strong rule with a petrol square on the rule's start (the site's steps and facts, the hub's register). |
| `./icons` | The line icons' paths (`ICONS`, `IconName`) on `ICON_VIEW_BOX`, and the arrow of actions and rows (`ARROW_PATH` on `ARROW_VIEW_BOX`), drawn by each front in its own markup with its own stroke width. |
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

`--mint-tint` and `--red-pale` are the bands of an added and a removed line. A label on a solid fill uses `color['--white']`, never a literal `#fff`, so a theme can turn it.

## Using it

- **Astro (the site):** style elements with `sx(...)` (`apps/landing/src/shared/lib/sx.ts`, `stylex.attrs` for markup); import `fonts.css` once in the document shell and preload the faces by their `?url` imports.
- **React (the hub UI):** `stylex.props(...)`. The hub dashboard and the hub's server pages follow the site's language at app density. Each entry imports `fonts.css` for its side effect; Vite bundles every CSS import and StyleX's rules into the one stylesheet the page shells link (`/styles.css`), so global CSS there must be page-neutral. Primitives built on these recipes live in `packages/frontend/src/shared/ui/`.
- **A new recipe** belongs here only when more than one front (or both hub pages) uses it; a component's own styles stay colocated with it as `*.styles.ts`, markers and variables in `*.stylex.ts`.

The StyleX invariants that bite (merging replaces a property's whole value, `border: 0` resets style and colour, media keys widest first, ancestor markers) are listed in `apps/landing/AGENTS.md` and hold in every front.
