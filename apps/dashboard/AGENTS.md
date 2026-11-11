# Dashboard

The browser app where a human reviews pull requests: an overview of the open pull requests grouped by project, a page per project, and a page per pull request that shows its diff. It is stage 1 of the restart (root `AGENTS.md`): every review is a GitHub pull request, and nothing reads a local working tree.

A Worker answers the app's read-only JSON API under `/api/*` and serves the built single-page app for every other path. Run both with `pnpm dev:dashboard`.

## Rules

- **Data comes through the `ReviewSource` port** (`worker/source/review-source.ts`). Routes and use cases only know that interface. Today a mock adapter serves fixed pull requests whose patches are real `git diff` output; the GitHub adapter replaces it behind the same seam. A GitHub SDK type, a mock detail or a fixture never crosses the port, so swapping the source touches one module.
- **The Worker reads downward**: `worker/api` parses the request and formats the answer, `worker/reviews` holds the use cases, `worker/source` holds the port and its adapters. oxlint rejects an upward import, so a second transport can reuse the use cases.
- **The API shapes come from `@syneva/contracts`**: the routes, the error body and every response schema. The app parses each response with the schema the Worker answers with, so a drift fails in the browser instead of drawing wrong data.
- **The browser app is Feature-Sliced**: `app`, `pages`, `widgets`, `entities`, `shared`, strictly downward, through their `@layer` aliases (`layers.json` is the list the Vite config and the root `oxlint.config.ts` read). Slices of one layer never import each other: compose them in the layer above.
- **Server state lives in TanStack Query, the place in the URL.** A page reads its data through an entity's query hook and its route from the path, parsed with the contracts' schemas. There is no client store; add one only for state that is neither.
- **The review page reads like the archive's desk; only its features are cut.** A file tree beside one file's diff, the Split/Stacked switch and the keys that drive them stay; verdicts, comments and sending wait for the review loop.
- **Reading state belongs to the desk.** The open file, folded folders, layout and tree drawer live in one reducer the desk owns; the URL names the pull request only, so a review keeps one stable address across rounds.
- **Every changed file is shown.** The file tree and the diff come from the same parsed patch: the tree lists every changed file and the diff shows the open one, so no file can be missing from the review.
- **The diff is drawn by `@pierre/diffs`**, which parses the patch, lays out unified and split views and highlights in a small worker pool. Never render diff lines by hand.
- **Styles are StyleX** on the tokens and recipes of `@syneva/design-system`; `src/app/styles/global.css` keeps only the reset and element defaults. The StyleX invariants in `apps/landing/AGENTS.md` hold here too.
- **Nothing deploys this app yet.** `wrangler.dev.jsonc` serves local development only. Shipping it means a `nextnode.toml` entry and a CI pipeline, never a deploy from a local machine.
