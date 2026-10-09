---
name: syneva
disable-model-invocation: true
description: Drive Syneva — a living browser surface where a human reviews a git diff (accept/reject changes, leave comments) and the coding agent acts on their decisions and replies in the same tab. Use after making code changes the user should review, when the user asks to "open the Syneva", or to collaborate on a diff turn-by-turn.
license: MIT
metadata:
  homepage: https://github.com/walid-mos/syneva
---

# Syneva

Syneva is a **living** browser surface for a git diff (working tree or staged). A human reviews the diff — accepting/rejecting changes and leaving comments — and clicks **Send to Agent**. The desk does **not** close on send: it keeps running across rounds. The agent attaches to it, receives each send, posts replies that appear in the open tab live, and the human keeps going in the same tab.

The desks live on a **hub**: one long-running Syneva process per machine, with a dashboard of every project and desk at `http://127.0.0.1:4747/`. You never run a server yourself - `syneva open` registers a desk on the hub and starts the hub in the background when none runs.

The review is the human's; the agent acts on the decisions and answers questions. No model runs inside the hub.

## When to use it

Reach for Syneva when the user should review something turn-by-turn: **code changes you made** (the working tree or staged diff), **a markdown plan or single artifact**, or **a branch / PR**. Use it when the user asks to "open the Syneva", or whenever a diff is better reviewed interactively than pasted into chat. A repo or PR desk opens with a guide (`--guide <file>`) you author against `syneva inventory`, so the reviewer reads the changeset one coherent behavior at a time, highest risk first, with your explanation beside the real code; a file desk needs none. `syneva spec` holds the schema and the authoring workflow - follow it there rather than from memory.

## Getting the tool

`syneva` is a Node CLI (Node 22+ and `git` required). Check whether the configured local package already provides `syneva` before installing another copy. If absent, use a reviewed, pinned CLI installation appropriate to the project; do not assume the Pi extension package puts the command on `PATH`. Invoke the resolved CLI as `syneva …`.

## Quickstart

Three ways to open a review desk (each returns at once with the desk's URL; the desk stays alive on the hub across rounds):

- **Changes you made** → `syneva open --session <id> --guide <file>` (working tree; `--diff staged` for staged only).
- **A markdown plan / single artifact** → `syneva open file <path>`.
- **A branch / PR** → `syneva open pr <ref> --guide <file>`.

`open` is idempotent: a second open of the same repo+session reloads the live desk into its tab instead of opening another. `syneva desks` lists the repo's live desks (the human may have opened one from the dashboard before you had changes).

Close the desk yourself — once a Send is fully acted on and nothing needs the reviewer's eyes (no edits awaiting re-review, no open questions), run `syneva close` in that same turn; never end a round asking the human whether to close, that trades one whole LLM round-trip for an idle desk's closure. `syneva close` is idempotent, the hub keeps running, and all review state persists for a later open.

## The authoritative contract: `syneva spec`

**For the full contract — the hub, review modes, the `await`/`comment`/`reload` loop, `await` exit semantics, the `ReviewResult` shape, how to act on a review, the guide schema, reload-vs-reopen, concurrency, settings, and errors — run `syneva spec` and follow it.** Do this once per session before your first review.
