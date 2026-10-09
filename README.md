<div align="center">

# Syneva

**An integrated review environment (IRE) for code you didn't write by hand**, packaged as a pi package.

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

</div>

<br>

Code editors and IDEs were built for a coding-first world. Their diff view is fine for a quick glance, but not for working through a big change or going back and forth with the agent that wrote it.

Syneva is my attempt at a real review surface: you review, hit **Send to Agent**, and your agent acts on your decisions and replies in place.

I'm not saying this is *the* review surface. I built it in a week and I'm still figuring out the shape. But this is what I think it should be.

## Getting started

1. **Install as a pi package** (ships the CLI, a `/syneva` status command, `/review` and `/plan` prompt templates, and a syneva skill):

   ```bash
   pi install git:github.com/walid-mos/syneva@<ref>   # pinned git install
   # or point settings at a local checkout: pi install /absolute/path/to/syneva
   ```

   Outside pi, the plain CLI still works: `npm install -g syneva` (needs **Node 22+** and **git**).

3. **Build from a checkout:** `pnpm build` - tsc compiles the backend, Vite bundles the browser frontend (ui + tokenization worker).

2. **Run the hub** (once per machine, optional - the first `syneva open` starts one for you):

   ```bash
   syneva start                 # the hub: dashboard + every desk at http://127.0.0.1:4747/
   syneva start --detach        # same, in the background (log in ~/.syneva/hub/hub.log)
   ```

3. **Open a review desk** on it, from inside the repository:

   ```bash
   syneva open                       # the working-tree diff (shorthand: syneva)
   syneva open --diff staged         # the staged diff
   syneva open file path/to/plan.md  # a single file or artifact (e.g. a generated plan)
   syneva open pr feature-branch     # a branch's commits vs its merge-base
   ```

   The desk opens in your browser at its own stable URL (`/d/<id>/` on the hub) and stays open until you close it, from the tab or from the dashboard. You review and click **Send to Agent**; the agent attaches, acts on each send, and replies in the same tab. The dashboard is the hub's control center: whose turn it is on every desk (drawn as the review circuit, or as a board, or as a cockpit with the numbers), how far each review is, what your agents are doing, and the hub's journal of rounds, by project and for your plans. From a desk, the hub's rail opens over the review and takes you to the next desk waiting on you. The full agent contract — the hub, modes, the event loop, all flags (`--repo`, `--path`, `--port`, `--no-open`, `--guide`, …), `ReviewResult`, and the guide schema — is printed by **`syneva spec`**.

### Reviewing from another machine (a hosted hub)

By default the hub binds to `127.0.0.1` — loopback-only, unreachable from any other device. To review from elsewhere (the agents and the hub run on a server or in a cloud workspace, you review from a browser on your laptop), bind it wider **with an access key**:

```bash
syneva start --host 0.0.0.0 --key "$(openssl rand -hex 24)"      # every request needs the key
syneva start --host 0.0.0.0 --key … --public-url https://review.example.com/   # behind a reverse proxy
```

Browsers sign in once at `/login` (the key is kept as an HttpOnly cookie, never in the URL); the CLI and the pi listener read `SYNEVA_KEY` (and `SYNEVA_HUB` when the hub is not the local default). The hub refuses to bind beyond loopback without a key unless you pass `--insecure`, which is for a fully trusted network only: a personal tailnet, or a host whose firewall blocks the port from everything else. If you reach the hub by a name that isn't the machine's hostname, the bound address or the public URL (a tailnet MagicDNS FQDN, say), add it to `SYNEVA_ALLOWED_HOSTS` (comma-separated) so the origin guard accepts it.

> [!WARNING]
> **Whoever holds the key holds the hub.** It can run your configured editor command, stage and reset changes, mutate the git index and read any file in the registered repos. Treat the key like an SSH key, and never expose an `--insecure` hub on a shared office/coffee-shop LAN.

## Features

- **A beautiful and functional diff view** built on `@pierre/diffs`.
- **Per-line comment threads.** Comment on any line. Ask questions — as many as you like, without waiting — and your agent answers live in the thread; leave a change request and it rides to the handoff.
- **Whole-file comments.** The file header (and the guide bar's 💬 button) opens a thread addressed to the file itself — same Ask / Request change intents. A file-wide change request keeps the file out of Approved until it's resolved.
- **Per-change accept/reject.** Accept or reject individual changes, or sign off a whole file.
- **A tight handoff loop.** Hit **Send to Agent** and your agent gets a structured review. It makes the edits, re-diffs into the same tab, and replies in place.
- **Guided review.** Your agent attaches a guide: the coherent behaviors the changeset changes ("domains"), highest risk first, each with the concrete consequence its risk rests on, the changed code it owns across files, and an explanation in the form that fits it (prose, before/after, a state, sequence or data-flow diagram). Syneva validates and renders it; it runs no model and the guide never decides anything — your verdicts do. Files the guide doesn't own still land in a trailing **Other** section, so nothing is hidden.
- **Four review modes.** The working tree, the staged diff, a single file (tracked or not, like a plan, PRD, or issue — markdown renders, with the file's own images served straight from the repo), or a branch against its merge-base.
- **Keyboard-first.** Intuitive navigation: move by file, line, or change, and accept, reject, comment, or approve without touching the mouse.
- **Open in editor.** Configure a repo-scoped editor command and jump from the review desk to the current file and line.
- **Customize** diff layout, intra-line, hunk separators, wrapping, code-highlight theme, and fonts.

## Principles

Syneva is opinionated about exactly one thing: the review surface. It's a protocol and an interface, nothing more. How you review, and what you review with, stays yours.

- **No model runs here.** Syneva doesn't call an LLM or orchestrate one. It renders the diff, validates the structured input it's given, and hands a result back.
- **Your agent, not ours.** The contract is plain JSON over stdout and the hub's HTTP API, with no assumption about who's on the other end: Cursor, Codex, a shell script. The review grouping, the answers to your questions, the code changes themselves are all *your* agent's work. Syneva just gives it somewhere to land.
- **One hub, every project.** Agents never run a server. The hub is one long-running process per machine; each desk is siloed (its own review state, event stream and mutation lock) and keeps one stable URL, so a reopened or restored desk lands in the same tab.
- **Local and private.** The hub binds to loopback (`127.0.0.1`) on one fixed port. No telemetry. Your browser may fetch a web font; switch to system fonts and even that stops. (A hosted hub binds wider behind an access key — see [Reviewing from another machine](#reviewing-from-another-machine-a-hosted-hub); the default stays loopback-only.)
- **It won't touch your repo unless you ask.** Syneva never edits your tracked files.

## Roadmap

Immediate to-dos, in rough priority order.

- [ ] **Remote runners**: let an agent on another machine feed a hosted hub (the hub holds the review, the runner holds the repo), so the hub no longer has to sit next to the repositories.
- [ ] **Hosted hub**: the hub's dashboard (now the control center: where every round stands, your reviews, projects and plans, the hub's journal) as a service you sign in to from syneva.dev, with the same features as the local hub; the local hub never needs an account.
- [ ] **Desktop app**: a macOS/Linux/Windows shell that runs the hub and opens the dashboard without a terminal.

- [ ] **Command palette**: add a discoverable Cmd/Ctrl+Shift+P palette for common review actions: file filter, find in diffs, next/previous file or change, accept/reject/request change, approve file, toggle layout/settings/sidebar, open in editor, reload, and Send to Agent. Keep keyboard shortcuts as the fast path, but make every major action searchable.
- [ ] **Commit/range/branch review modes**: expand beyond working/staged/file/PR branch reviews with `syneva commit <ref>`, `syneva range <base>..<head>` / `<base>...<head>`, and `syneva branch <base>` so Syneva can review historical or comparison diffs without requiring a dirty working tree.
- [ ] **Lazy diff/content loading + large/binary-file guards**: today every changed file's full contents are read and shipped up front; the only large-file handling is client-side render deferral. Move the guard to the data layer: classify each file by byte size and ship lightweight patch data first, hydrating full contents, highlighting, and rendered markdown on demand when a file is opened. Per-file `loadState` (`ready | deferred | too-large | binary | error`) with two byte tiers — an *eager* limit (~1 MiB, loaded up front) and a *manual* limit (~2 MiB, deferred until opened); over that is `too-large` (skipped with a summary + explicit load-anyway action), plus an image byte cap. Add **binary detection** (NUL-byte scan) so binaries are skipped rather than read as UTF-8 and handed to @pierre.

## Acknowledgements

Syneva started as a fork of [Galley](https://github.com/ymansurozer/galley).

## License

[MIT](./LICENSE) © Walid Mostefaoui

