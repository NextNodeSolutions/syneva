# AGENTS.md

Guidance for coding agents (pi, Codex, …) working with code in this repository.

## What this is

Syneva is a CLI (`syneva`) whose `start` command runs the **hub**: one long-running process per machine that hosts review desks (one per repo + session, each a browser UI over a git diff, a file or a PR) and serves a dashboard over them. A human reviews (accept/reject changes, comment, ask questions), and a coding agent opens desks on the hub (`syneva open`, which starts a hub when none runs) and attaches to them via CLI subcommands to receive the review, reply, and re-diff its edits into the open tab. Agents never run a server. No model runs inside Syneva — it is a protocol + interface only.

Product positioning lives in `PRODUCT.md`, the UI design language in `DESIGN.md` — read them before product or design decisions.

## Landing deploy

The static landing (`apps/landing`, an Astro app) deploys to Cloudflare Workers (static assets) through CI only, never from a local machine. Config lives in `nextnode.toml`; the pipeline is `NextNodeSolutions/core`'s `deploy-workers.yml`: `deploy-dev.yml` fires on merge to `main` (dev.syneva.dev), `deploy-prod.yml` is a manual dispatch (syneva.dev, gated on the dev pipeline). `pnpm build` (turbo) builds every page of `apps/landing` into `apps/landing/dist`, the assets root `nextnode.toml` declares for the Worker (`assets = "apps/landing/dist"`, resolved from the repo root); `apps/landing/public/healthz` ships with it for the pipeline's smoke check (see `apps/landing/AGENTS.md`).

## Commands

Every command is a pnpm script in `package.json` — that file is the authoritative list (`dev`, `build`, `check`, `lint`, `lint:types`, `lint:fix`, `format`, `format:check`, `perf-smoke`, `release`). CI (`.github/workflows/ci.yml`) runs the same gates on Node 24 — all must pass. The tooling needs Node 24 (`devEngines`); the published CLI keeps its `engines.node >= 22` contract.

## Test layout

No unit-test suite at the moment: the colocated `*.test.ts` suite was removed and a replacement suite is planned — do not invent tests for a change unless asked. `test/` holds the frontend perf benchmarks (below); future e2e suites join the same folder.

## Benchmarks

The perf timeline is tracked data, not a chat log: after a render-path change, measure the cold open (headless, via `pi-frontend-check`) and record the run with `node test/benchmarks/bench-dashboard.mjs --record <file>`, then `--check`. Read `test/benchmarks/README.md` for the run shape and `test/benchmarks/AGENTS.md` for the rules that keep runs comparable.

## Workspace layout

The repo is a pnpm + Turborepo workspace. The publishable package is `apps/syneva` (the `syneva` npm/pi package: bin, `files`, the `pi` key, `prepack`); the build units live in `packages/`:

- `packages/contracts` (`@syneva/contracts`) — the shared wire shapes, no dependencies, compiled by `tsc` to its own `dist/` (ESM + `.d.ts`); both other packages import it through `@syneva/contracts/*` specifiers.
- `packages/backend` (`@syneva/backend`) — the Node backend (`src/backend/**` moved here), ESM NodeNext, checked and compiled by `tsc`. The published package BUNDLES it: `apps/syneva/scripts/build-dist.mjs` runs tsdown over `bootstrap/cli.ts` and `adapters/inbound/pi/pi-bridge.ts` into `apps/syneva/dist/cli.js` / `dist/pi-bridge.js` (harness peers `@earendil-works/pi-coding-agent` and `typebox` stay external) and copies the built UI next to them. `dist/cli.js` is the published bin.
- `packages/frontend` (`@syneva/frontend`) — the browser frontend, React 19 bundled by Vite from two entries: `src/app/main.tsx` (the desk, `ui.js`, served under `/d/<id>/`) and `src/app/dashboard.tsx` (the hub dashboard, `dashboard.js`, served at `/`), checked by its own bundler-world tsconfig (includes `.tsx`).
- `apps/landing` (`@syneva/landing`): the public site at syneva.dev, a static Astro app styled with StyleX and laid out in Feature-Sliced Design layers like the frontend (see `apps/landing/AGENTS.md`). It is not part of the published package.
- `packages/design-system` (`@syneva/design-system`) and `packages/motion` (`@syneva/motion`): the public site's StyleX design tokens and its motion runtime (on Motion), consumed as source by `apps/landing`; the `transit` task in `turbo.json` folds them into the landing's build hash. The landing never imports `motion` directly: `@syneva/motion` is its only seam onto the engine (`apps/landing/AGENTS.md`, Motion invariants).

Turbo task graph (`turbo.json`): `build` (`dependsOn ^build` and `transit`, outputs `dist/**`) and `check` (same dependencies) run per package, where `transit` is a no-op task that folds source-only workspace dependencies (`@syneva/design-system`, `@syneva/motion`) into the hash; root `package.json` scripts delegate (`build`/`check` → `turbo run …`) while `lint`/`lint:types`/`format`/`format:check` stay repo-wide oxlint/oxfmt runs from the root. `pnpm dev` builds nothing: `apps/syneva/scripts/dev.ts` runs the hub from source under `node --watch` (tsx as the loader) and passes it a Vite dev server as its `UiServer` (`http/routes/static.ts`; an install serves the built bundle), so the UI loads from source with HMR on the hub's own origin and URLs, and the `@syneva/source` export condition resolves `@syneva/contracts` to its TypeScript in both worlds. A backend or contracts edit restarts the hub (desks restore), a frontend edit hot-reloads. The dev hub is the machine's hub (port 4747, `~/.syneva`): stop an installed one first (`syneva hub stop`).

## Two compilation worlds

The workspace splits the same way: a Node backend (`packages/backend/src/**`, ESM NodeNext — intra-backend imports use `.js` extensions) and a browser frontend (`packages/frontend/src/**`, React 19). The two worlds never import each other at runtime: `packages/contracts/src/` (`review.ts`, `browser.ts`, `agent.ts`, `hub.ts`, `routes.ts`, `spec.ts`) is the single source of truth for the shared wire shapes (the backend's persisted shapes live in `packages/backend/src/domain/review.ts`), and the frontend entities map contract DTOs into frontend-owned models at their `entities/*/api.ts` boundaries — change a wire type in `packages/contracts/src/` alone. The backend layers: `domain` (pure review/diff/guide/identity rules, no IO), `application` (use cases, DTO mappers, cache/mutation ownership: `open-desk.ts` builds a desk's review, `desk-summary.ts` projects it for the dashboard), `adapters/{inbound/{cli,http,pi},outbound/{git,filesystem,editor,package-registry,console}}` (transport and IO: `http/hub.ts` is the registry of live desk contexts, `http/router.ts` the one request entry point, `http/auth.ts` the access key, `cli/hub-client.ts` how the CLI finds and auto-starts the hub), and `bootstrap` (composition roots: `hub.ts` starts the hub, `cli.ts` is the entry the published bundle starts from).

The frontend follows Feature-Sliced Design with layer aliases (`@app/*`, `@pages/*`, `@widgets/*`, `@features/*`, `@entities/*`, `@shared/*` — declared in `packages/frontend/tsconfig.json`, wired in `vite.config.ts`, and oxlint's layer rules); the wire shapes come from the `@syneva/contracts` package, not an alias. The layers, strictly downward: `app` (bootstrap, the reactive store and its bindings facade, hotkeys, polling, global shell, `index.html`; `dashboard.tsx`/`dashboard.html` is the hub dashboard's own root), `pages` (`desk` — `overview.ts` is a desk view mode, not a separate page — and `dashboard`, the hub listing), `widgets` (`diff-view`, `chrome`, `dialogs`), `features` (`decide-change`, `manage-comment`, `send-review`, `expand-context`, `open-editor`), `entities` (`review` — one review aggregate including its change/comment/guide/file segments — plus `settings` and `hub`), and `shared` (API transport, UI/lib primitives, markdown, the generic diff renderer/highlighting infra, icons). The desk's API calls are prefixed with the desk's base (`/api/desks/<id>`, read once from the page URL in `shared/api/base.ts`); hub routes are absolute. Composition happens above: same-layer slices don't import each other's internals, lower layers never import `app`, and the imperative render path reaches the funnel only through the narrow scheduler seam (`@shared/lib/render-scheduler`). Only the entity API boundary modules (`entities/*/api.ts`) name HTTP paths — always via `@syneva/contracts/routes` — and decode contract DTOs into the frontend-owned models (`entities/review/decode.ts` mapping onto `entities/review/model.ts`). The file diff renders directly through `@pierre/diffs` in `widgets/diff-view/diff-instance.ts`.

Lint/format behaviour is the shared `@nextnode-solutions/standards` preset; `oxlint.config.ts`/`oxfmt.config.ts` hold only repo-specific ignores and narrow overrides with a stated reason.

## Render path

All render passes funnel through `packages/frontend/src/pages/desk/render.ts`; `widgets/diff-view/diff-instance.ts` creates a fresh `FileDiff` for each pass and mounts its full output. `packages/frontend/scripts/bundle-budget.mjs` budgets the whole static import graph, not just `ui.js`. `@pierre/diffs` renumbers lines per render — display anchors are derived, raw file lines stay canonical.

## Key invariants

- `Decision` records (keyed `path:stableKey`) — not git staging and not the rendered diff — are the source of truth for accept/reject. They survive reloads even when accepting staged the hunk out of the working-tree diff.
- `contentHash`/`reviewedHash` pairs detect staleness: if the agent rewrites a block (or a file) after it was decided/approved, the decision/approval resets to pending on reload. The same pattern invalidates comment anchors (`anchorText` → re-anchoring → `unanchored`) and guides (`baseDiffHash`).
- Desks are idempotent per repo+session: `deskId` hashes repo root + session, so a second open reuses (reloads) the live desk and the same `/d/<id>/` URL survives a hub restart (the hub registry under `~/.syneva/hub/desks.json` records every desk's rebuild parameters; `restore` rebuilds them on start). The hub never closes a desk on its own. The hub lock (`~/.syneva/hub/hub.json`) is trusted only if its pid is alive AND the hub answers `/api/hub/health`.
- The hub binds one fixed port (4747) and is itself idempotent: a second `start` finds the live hub and exits 0; the CLI auto-starts a detached hub when a desk command finds none. Binding beyond loopback requires an access key (`--key`), checked as a Bearer header or a signed-in cookie; the Host/Origin guard stays on in every mode.
- `packages/backend/src/application/state-cache.ts` caches the serialized browser response per review revision: `DeskContext.serialize` invalidates around mutations, and the cache must never be keyed solely on `baseDiffHash`.

## Hub smoke

There is no unit suite, so the hub is verified end to end by hand: build, then start a hub on a spare port with a scratch `HOME`, open a repo desk from a temp git repo (`syneva open --no-open`), drive `await`/`comment`/`status`/`reload`/`close` against it, stop and restart the hub to see the desk restored, and start one with `--key` to check the 401/login paths. Keep that loop green after any change to the hub, the CLI or the desk routes.

## Harness module

Everything a coding-agent harness loads from the published package (the extension entry, `/plan` and `/review` prompts, the syneva skill, the syneva-answer subagent) lives under `apps/syneva/extension/` — read `apps/syneva/extension/README.md` before touching it. It is an adapter layer only: it talks to desks through the CLI/HTTP contract and must not grow business logic.

## Agent contract

`packages/contracts/src/spec.ts` is the single source of truth for the CLI/HTTP contract (flags, events, `ReviewResult` shape) and is printed by `syneva spec` — the skill and the server's error responses point consuming agents at it. If you change the CLI flags, events, or ReviewResult shape, update `packages/contracts/src/spec.ts` in the same change.

## Conventions

- Commits follow **Conventional Commits** (`feat:`, `fix:`, `perf:`, `refactor:`, `docs:`, `chore:`, …); `semantic-release` (config in `apps/syneva/.releaserc.json`, extending the shared `@nextnode-solutions/standards` preset) infers the semver bump from the prefix, publishes the `syneva` package and cuts the GitHub release. Run it with `pnpm release`; don't edit the version by hand.
- Comments in this codebase explain *why* and record invariants; match that style.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
