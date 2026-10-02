# Landing page

Frontend layout: responsive, breakpoints 600/900/1100/1280. This standalone public site is separate from the review application.

Read `DESIGN.md` in this directory before changing landing-page styling or copy. The repository-root design system governs the review application only.

The site is multi-page and rendered at build time: one module per route in `src/pages/`, the site map in `src/nav.mjs` (adding a menu entry without a page fails the build), shared sections in `src/ui.mjs`, drawings in `src/art/`. Preview with `pnpm dev:site` (pages re-render on every request) and build with `pnpm build:landing`. `src/`, the docs and the acceptance specs never deploy.

Copy follows `PRODUCT.md`: first-person, direct, low-hype, and every claim true of the CLI today. Prototype work is labeled as such; numbers are product facts, never metrics.
