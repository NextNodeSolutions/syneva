# RFC 0002 — Plans as documents

Status: accepted, phase 1 in progress · 2026-10-20 · builds on RFC 0001 (core · local · web).

## 1. The statement

A plan becomes a document the hub keeps, not a file a desk looks at once. Syneva holds the record of each project's plans, a document library (a GED): every version an agent posted, every round a reviewer ran on it, its status, readable in the hub's own typography with figures drawn in the guide's vocabulary. No editor and no model: agents and people write markdown, Syneva validates, keeps, renders and remembers.

Later the plan becomes live: the agent and the reviewer go back and forth on the document itself, not only through a desk's rounds. This RFC lays the record that work will stand on and does not design it.

## 2. Today

- The `/plan` prompt writes `<repo>/.pi/syneva/plans/<slug>.md`, hides it from git through `.git/info/exclude`, and opens a file desk on it (`syneva open file <path>`). The desk renders markdown with a Rendered/Source toggle, every rendered block can be commented, sections are the file's headings (`domain/outline-markdown.ts`), decisions are verdict-only. The agent revises the file between rounds and `syneva reload` re-reads it.
- The Plans page lists the file desks, live and closed. The journal keeps the rounds as lines.
- Once the desk closes, what remains is the file on disk (untracked, unversioned) and the journal lines. Nothing says which version was approved, what it led to, or where a project's plans are. A mermaid fence renders as a code block.
- What this builds on, all existing: the markdown engine (markdown-it with a source line per block, Shiki through Pierre's highlighter, DOMPurify), the guide's typed explanation blocks (`state`, `sequence`, `flow`) and their renderers in `widgets/guide-pane`, the project identity (`projectId`), the journal's rule (record when it happens), and the hub's design language (`DESIGN.md`).

## 3. The record

In the backend's domain, pure (`domain/plan.ts`):

```ts
type PlanStatus = 'draft' | 'approved' | 'implemented' | 'archived'

type PlanVersion = {
	number: number            // 1..n, in posting order
	contentHash: string       // the same content never makes a second version
	postedAt: string
	title: string
	approvedAt?: string       // set by the round whose Send approved the file
}

type PlanRecord = {
	id: string                // hash(root + "\n" + "plan:" + path), 16 hex
	root: string
	path: string              // the plan file, relative to the root
	title: string
	summary?: string
	status: PlanStatus
	versions: PlanVersion[]
	deskId: string            // the desk that last reviewed it
	createdAt: string
	updatedAt: string
}
```

- **A plan desk** is a file desk opened with `syneva open plan <path>` (the open body carries `plan: true`). It is the same desk a file desk is, same session, same id, same review, same events; the hub records it as a plan in its registry, so a restart keeps it one.
- **Identity.** A plan is stable per repo + path, so reopening the file reuses the record, as a second open reuses a desk.
- **Versions.** The plan library observes its desks' events, the way the journal does, when they happen: an open or a reload of a plan desk reads the file and posts a version if its content changed. Identical content posts nothing.
- **Status.** `draft` while the latest version is not approved; `approved` when a Send approves the file (the latest version gets `approvedAt`); a new version after that is a draft again. `implemented` and `archived` are the reviewer's, set from the plan's page (`POST /api/hub/plans/:id/status`); a new version brings an archived or implemented plan back to draft, since someone is working on it again.
- **Store.** `~/.syneva/hub/plans/<planId>/plan.json` and `v<n>.md` (each version verbatim). The working file stays where the agent wrote it; whether a team commits it is its choice, the record does not depend on git.
- **Nothing is edited in Syneva.** The record grows by versions and a status; the text is always a file someone wrote.

## 4. The document

The agent-facing format stays markdown, so every harness can write it.

- **Title and summary.** A leading front matter block (`title:`, `summary:`) names the plan; without one, the first heading does, then the file name.
- **Sections** are the headings: the desk's units of verdict, the page's table of contents.
- **Figures** are `syneva` fences holding one diagram block in the guide's JSON shape (`state`, `sequence`, `flow`), drawn by the guide pane's renderers, in the hub's day and night themes, with their text equivalent. The vocabulary is the one the product already defends for the guide: the form that fits, validated, no runtime diagram library, no model. Code references (`ref`) are a guide's and are ignored in a plan for now.
- **An invalid figure never refuses anything.** It renders as its source under a notice that names the problem. The reader's page never waits on JSON.
- **Plans written before** stay valid: no front matter is a plan titled by its first heading, no fence is prose.

## 5. The hub

- **CLI.** `syneva open plan <path>` (shorthand `syneva plan <path>`) opens or reloads the plan's desk and prints `plan: { id, url }` with the open's usual JSON. `syneva plans [--all]` lists the repo's plans (the hub's with `--all`).
- **HTTP.** `GET /api/hub/plans` (every record, newest first, each with its live desk if any), `GET /api/hub/plans/:id` (the record with the latest version's markdown), `GET /api/hub/plans/:id/versions/:n` (one version's markdown), `POST /api/hub/plans/:id/status`. The desk routes are untouched; `DeskSummary.plan` names a plan desk's plan.
- **Dashboard.** `/plans` is the library: by project, each plan with its status, its versions, its last move and its live desk. `/plans/<id>` is the document: the eyebrow (project, status, version, date), the title as the page's headline, the summary as its lede, the table of contents, the sections through the markdown engine and the figures, then the versions and the actions (review on its desk, mark implemented, archive, restore, download the markdown).

## 6. Local and web

With RFC 0001, plans join the mirror lane, not the relay: the push carries records and new versions (a version is a few kilobytes; a body over 1 MB goes to R2), D1 holds `plans` and `plan_versions`, and the web's `/plans` pages read the mirror. A plan is therefore readable from a phone while its hub is offline, which a desk is not: the record is the first thing on the web that does not need the laptop awake. Reviewing and status changes relay to the hub as any action.

## 7. Phases

1. **The library.** The record, the store, `open plan`, versions on open and reload, status from rounds and from the reviewer, the HTTP routes, `syneva plans`, the spec.
2. **The pages.** `/plans` as the library by project, `/plans/<id>` as the document.
3. **The figures.** `syneva` fences drawn by the guide's renderers, on the plan's page and on its desk.
4. **The prompt.** `/plan` opens plans with `open plan`.
5. **Later.** The mirror lane (RFC 0001), comparing two versions, the live plan (agent and reviewer on the document itself), plans cited from a guide.

## 8. Open questions

- Should the `/plan` prompt keep hiding plans from git? The proposal keeps it: the hub is the record; a team that wants plans in the repo points the prompt at `docs/plans/` and commits.
- Code references in figures: resolve them against the plan's repo like a guide's, or keep plans free of code anchors.
- Mermaid alongside the typed figures: familiar, but a runtime library and no validation.

## 9. Untouched

`syneva spec`'s review contract, `ReviewResult`, the desk routes, the review files under `~/.syneva/`, the file mode for files that are not plans, the local workflow without an account.
