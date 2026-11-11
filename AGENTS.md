# AGENTS.md

These are the rules for changing this repository, for people and agents alike. A workspace package may add its own `AGENTS.md` with the rules local to it; read every `AGENTS.md` on the path you touch.

## What Syneva is

Syneva is a review surface for code a coding agent wrote. The human reviews a diff in the browser: accepts or rejects each change, comments on lines and files, asks the agent questions. Then they click **Send to Agent**. The agent receives a structured review, acts on it, pushes new code, and the same review continues on the new diff. No model runs inside Syneva: it renders the diff, records the human's verdicts and hands them back. The agent on the other side is the user's own (pi, Codex, Cursor, a script).

This repository is a restart. The first implementation became too tangled to keep building on, so it was archived and the product is being rebuilt from zero, in two stages:

1. **GitHub pull requests only.** A review is a review of a GitHub PR. The diff, the head and the base come from GitHub. Nothing reads a local working tree.
2. **Local connections later**, once stage 1 works end to end: a local hub, working-tree and staged diffs, a CLI that talks to a process on the developer's machine. These are harder to set up and wait until the PR flow is solid.

Until the user says stage 2 has started, do not add any local-git feature, even when the archive has one ready to port.

## The archive

The first implementation lives at [NextNodeSolutions/syneva-archive](https://github.com/NextNodeSolutions/syneva-archive). Keep a checkout at `.pi/syneva-archive` (ignored by git) so agents can read it:

```bash
git clone git@github.com:NextNodeSolutions/syneva-archive.git .pi/syneva-archive
```

**Read the archive for product knowledge, never copy its application code.** Its `PRODUCT.md` (positioning, users, principles), `DESIGN.md` (the review UI's design language), `README.md` and `docs/rfc/` describe what the product is for and how it behaved; they stay valid where this file does not override them. Its backend and frontend code are what we are leaving behind. When a concept from the archive is needed, re-implement it from its rule, not from its files.

The archive is frozen, so the paths and figures below stay true.

### What the old app did

- **One hub per machine.** A long-running Node process on a fixed loopback port served a dashboard and one browser **desk** per review. Agents never ran a server: the CLI (`syneva open`) started the hub when none was running.
- **Review modes.** Working tree, staged index, one file (a plan, a PRD), and a branch or PR. PR mode fetched the PR with `gh`, then checked the branch out locally; it never wrote anything back to GitHub.
- **Decisions.** Accept or reject per change, recorded as `Decision` records keyed `path:stableKey`. A `contentHash`/`reviewedHash` pair reset a decision or a file approval to pending when the agent rewrote that code. Decisions, not git staging, were the source of truth.
- **Comments.** Line and whole-file threads with two intents: **Ask** (a question the agent answers live in the thread) and **Request change** (rides along with the next send). Anchors were re-found from their text after a reload, or marked unanchored.
- **The round loop.** **Send to Agent** produced a `ReviewResult`: accepted, rejected, requested changes, approved files, open questions, an overall note. The agent waited for it with a long-poll (`syneva await`), edited the code, then called `syneva reload`; untouched verdicts carried over, touched ones went back to pending. The tab stayed open across rounds at a stable URL.
- **Agent contract.** CLI subcommands over the hub's HTTP API (`open`, `await`, `comment`, `status`, `reload`, `close`, `spec`), events `question`, `review` and `closed`, errors as `{error, code, fix, docs}`. `syneva spec` printed the whole contract. A pi extension wrapped it as a tool and ran a read-only subagent to answer questions.
- **The guide.** The agent posted a risk-ranked explanation of the changeset: "domains" owning changed code across files, each with prose or a diagram. Syneva validated and rendered it; files no domain owned landed in a trailing "Other" section so nothing was hidden. When no guide was posted, Syneva drafted one itself by clustering changed symbols.
- **Around the loop.** A dashboard over every desk (three views of whose turn it is: circuit, board, cockpit), a journal of rounds, a plan library with versions and approvals, an access key to expose the hub beyond loopback, open-in-editor, self-update from npm.

### Why it was restarted

Measured on the archive, not opinions:

- **No single file was large; the tangle was in the seams.** The lint preset capped file length, so the logic spread over 158 backend files and 500 frontend files (about 58k lines) and the coupling moved into the wiring between them.
- **Frontend state had no owner.** One hand-written Proxy store held about 55 data fields and about 70 optional methods that nine facade modules attached at boot. Three dependency-injection contexts existed only to let lower layers call upward around the layer rules. React drew the shell, then an imperative funnel filled the diff with `innerHTML` and hand-called `render()`. Nested writes bypassed the Proxy and needed a manual "notify" call.
- **Shapes were declared twice.** The backend kept hand-written copies of the shared wire types (review, guide, inventory) beside the contracts package. Accept/reject was stored in two places. Line comments and guide comments were two parallel stacks.
- **Use cases lived in transport code.** The HTTP layer opened, restored and closed desks, checked PRs out and wrote the journal; the CLI and the pi adapter imported each other's internals.
- **Features outgrew the loop.** The guide (drafting by graph clustering, composition, validation) was about 35% of the backend. The dashboard's three overviews, the plan library, the journal, auth pages and self-update were each built before the core review loop was finished.
- **Back-compat piled up** in a product with no external users: fields kept "for compat", legacy save formats, old request shapes.

### What carries over as concepts

- Decisions keyed by a stable change identity, reset to pending when the reviewed content changes.
- Nothing is auto-approved and no changed file is ever hidden.
- Comments with Ask and Request-change intents, re-anchored on new code or marked unanchored.
- A structured `ReviewResult` as the one handoff, and one contract module that both sides import.
- Rounds: the same review continues across the agent's pushes.
- Keyboard-first review, with the key map kept as data.
- `@pierre/diffs` as the diff renderer: it already provides split and unified layouts, intra-line diffs, line annotations, virtualization for large files and worker-based highlighting.

### What does not carry over

- Everything local-git: working-tree and staged modes, staging on approve, open-in-editor, the per-machine hub and its lock file. They return in stage 2, designed for it.
- The dashboard, journal, plan library and model-free guide drafting. Each comes back only when the user asks for it.
- The Proxy store, the facade bindings, the injection contexts and the `innerHTML` render path.

## What the project guarantees

A change that weakens one is wrong, even when it compiles.

1. **The human's verdicts are the authority.** A decision is recorded explicitly and never inferred. When the code it judged changes, it goes back to pending. Otherwise a stale approval would ship code nobody reviewed.
2. **Nothing is hidden from the reviewer.** Every changed file appears in the review, whatever any grouping or explanation says. A guide may order the review; it never filters it.
3. **No model runs in Syneva.** It renders, validates and hands back. The agent's work belongs to the user's agent, so Syneva works with any agent and costs nothing to run.
4. **The agent contract is plain and vendor-neutral.** Any agent can drive a review through documented HTTP/CLI calls and JSON. No feature may require one specific agent.
5. **The landing stays as copied** from the archive. Change it only when the user asks, because its copy and design are finished work.

## Architecture rules

- **One definition per wire shape.** Request, response, event and `ReviewResult` types live in the contracts package and every side imports them. A hand-written mirror drifts silently, which is what happened in the archive.
- **One state owner per piece of UI state.** UI state lives in one store whose updates re-render through React. Never patch methods onto a store at runtime or write to the DOM behind React's back, so that a change has one path to the screen.
- **Use cases sit above transport.** A route or CLI command parses input, calls a use case and formats the result. Lifecycle logic (open a review, start a round, close) never lives in a handler, so a second transport can reuse it.
- **Layers import downward only, and slices of one layer never import each other.** Compose in the layer above instead of injecting callbacks downward, so the dependency graph reads the way the code runs.
- **GitHub is behind an adapter we own.** The rest of the code talks to our interface for PRs, diffs and comments, never to a GitHub SDK type, so a GitHub API change touches one module and stage 2 can plug a local git source into the same seam.
- **Build the loop before its surroundings.** Open a PR review, decide, comment, send, receive the next round. Until that loop works end to end, add nothing outside it.

## Code rules

- Formatting and lint rules come from `@nextnode-solutions/standards`; `oxlint.config.ts` and `oxfmt.config.ts` hold only this repository's ignores and narrow overrides, each with its reason in one line.
- The landing's own rules (Feature-Sliced Design layers, StyleX and Motion invariants, the signup Worker) are in `apps/landing/AGENTS.md`. Its design language is `apps/landing/DESIGN.md`.
- The dashboard's own rules (the `ReviewSource` port, the Worker's layers, the Feature-Sliced browser app) are in `apps/dashboard/AGENTS.md`.
- **The landing imports some contract shapes and values** (the guide format) to draw the review round and the agent contract. When the new app's contract changes one of them, update the landing's import in the same change, because the landing build is the only thing that catches it.

## Checks

Every pull request must pass these, run by `.github/workflows/ci.yml` on Node 24:

```bash
pnpm lint
pnpm lint:types
pnpm format:check
pnpm check
pnpm build
```

## Commits

Conventional Commits, checked by commitlint in the `commit-msg` hook; `lint-staged` formats and lints staged files in `pre-commit`. One intention per commit; every commit passes the checks on its own. Work goes through a branch and a GitHub pull request.

## Documentation

`AGENTS.md` files hold rules and their reasons, never a copy of what the code already says: no file listings, counts or copied config values, except about the frozen archive above.

> **The docs describe the intended behavior.** That covers `docs/`, the README and the `AGENTS.md` files. When a change makes them wrong, do not just rewrite them to match. First check that the change is expected: the task asks for it, or the user confirms it.
> - If it is expected, update the docs in the same commit as the change.
> - If it is not, the docs win. Bring the code back in line with them, or stop and ask.

## Working against real systems

- **The landing deploys to Cloudflare Workers through CI only**, configured by `nextnode.toml`: static pages plus one signup route bound to a D1 database, a rate limiter and the `RESEND_API_KEY` secret from the `syneva` Infisical project. Never deploy from a local machine.
- **GitHub writes are visible to others.** Posting comments or reviews on a real PR, or creating PRs and branches on someone else's repository, needs the user's go-ahead first; clean up test comments afterwards.
