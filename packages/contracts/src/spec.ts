// Second line of the agent contract (BOOT/.../spec), printed by `syneva spec` so skills fetch
// it instead of hardcoding a drifting copy; boot principles live in the skill/AGENTS.md.
// The events, the ReviewResult and how to act on it (spec-events.ts) and the guide's section (spec-guide.ts) are their own modules: one contract text, printed as one.
import { EVENTS_SPEC } from './spec-events.js'
import { GUIDE_SPEC } from './spec-guide.js'

export const SPEC = `syneva agent contract

Syneva is a hub: one long-running process per machine that hosts review desks and serves a
dashboard over them. A desk is a browser review of one repo + session (a git diff, a file, a
PR). A human accepts/rejects changes, comments and asks questions, then clicks Send to Agent;
the desk stays live across rounds. You never run a server: you open desks on the hub and attach
to them via CLI subcommands - receive each Send, answer questions, post replies that appear
live, and re-diff your edits into the same tab. No model runs in the hub; the review is the human's.

## The hub
- \`syneva start\` runs the hub in the foreground (Ctrl-C stops it); \`syneva start --detach\`
  backgrounds it. Dashboard + desks live at http://127.0.0.1:4747/ (--port / SYNEVA_PORT to
  move it; agents on a moved port need the same SYNEVA_PORT). A hub already running there means
  "already running" (exit 0), never a second hub.
- You rarely start it yourself: \`syneva open\` (and the shorthands below) starts a hub in the
  background when none answers (SYNEVA_NO_AUTOSTART=1 opts out). The human may also have one
  running already - the dashboard is where they see every project and desk.
- \`syneva hub\` prints the hub's health as JSON; \`syneva hub stop\` stops it (desks stay
  registered; the next start restores them on the same ids/URLs). Never stop the hub to end a
  review - close the desk (\`syneva close\`).
- \`syneva desks [--all]\` lists this repo's live desks (--all: the whole hub) as JSON with their
  URLs - how you find a session the human opened from the dashboard before you had changes.
- Hosted hubs: SYNEVA_HUB=<url> names the hub, SYNEVA_KEY=<secret> its access key (every call
  carries it). A hub started with --key answers nothing without it; browsers sign in at /login.

## Review modes
Pick one when opening. await/comment/status/reload/close auto-target the lone live desk of the
repo and omit --session below; --session names the desk - needed only for a stable id or when the
repo has several desks. Each repo+session is ONE desk with ONE stable URL (/d/<id>/ on the hub).
- repo (default) - \`syneva open\` (shorthand: \`syneva\`): working-tree diff; \`--diff staged\` for
  the index; \`--path <p>\` limits to a path. Untracked (new) files show as full-file additions.
  Approve stages the file (toggle); accept/reject are verdicts. A moved file stages both its old
  and new paths as a rename.
- file - \`syneva open file <path>\` (shorthand: \`syneva file <path>\`): one file, tracked or not.
  Unchanged → full file; changed → diff (stageable); untracked → full file, verdict-only. Markdown
  gets a Rendered/Source toggle - comment any rendered block. Use it to review an artifact (e.g. a
  generated plan).
- pr - \`syneva open pr <ref>\` (shorthand: \`syneva pr <ref>\`): a branch's commits vs merge-base.
  <ref> = branch | PR number | GitHub URL (number/URL resolved via \`gh\`, which must be
  installed+authed). The branch is checked out once the open is admitted - its diff is read by ref
  first, so the guide is validated before HEAD moves (refused up front if the working tree has
  uncommitted tracked changes); \`--base <ref>\` overrides the base. Verdict only: Approve =
  approve, reject = request-changes, no staging - you amend the branch and re-review.
A repo or pr desk opens guided: \`--guide <file>\` (The guide, below) is part of the open, and an
open without one is refused (422 GUIDE_REQUIRED) unless the session's saved guide still describes
this very source (same inventory fingerprint) or the changeset is empty. A file desk needs none
(one is welcome). The policy is judged before anything else: a refused open replaces no desk,
writes nothing and checks out nothing. Syneva validates and attaches the JSON you supply; it never
generates one.
open prints one JSON line on stdout: {ok, deskId, url, dashboard, session, mode, outcome, empty}.
outcome "created" = a new desk (the browser opens unless --no-open); "reloaded" = the live desk
for that repo+session was reused and re-diffed (its tab updates by itself, no new tab). empty =
nothing to review yet: the desk stays open and shows your next \`syneva reload\`. The URL also
prints on stderr as \`Syneva <label>: <url>\`. ReviewResult.mode (repo|file|pr) tells you how to
read verdicts. Paths you pass resolve against your cwd (the hub's cwd is never yours).

## Pi attachment (preferred when syneva_agent is available)
Open the desk, then call the Pi tool \`syneva_agent\` with
\`{action:"attach", repo:"<absolute repo>", session:"<desk session>"}\` from the owning
persistent session. Return control: completed reviews, closed events, and failed question
answers wake this same session via native follow-up messages, each pointing to a complete
saved JSON event. Read that file, handle its kind as below, then return control again. Do
not run the CLI wait loop while attached.
Never delegate waiting to a one-shot subagent: its exit cannot wake an idle parent indefinitely.
The listener survives agent turns, rides out a hub restart (about a minute of retries), and
restores on reload/resume of the SAME Pi session; a fork cannot inherit it. Print/JSON sessions
cannot attach. Keep the owning Pi process open.
\`syneva_agent {action:"status"}\` reports the connection; transport failures are reported and
require reattachment. Before switching desks, detach with
\`syneva_agent {action:"detach"}\` - the browser Close already does it (see closed); detach
does not close the desk. Use \`syneva close\` separately.

### Question routing - the desk correspondent answers, the owner reviews
The extension runs ONE deterministic correspondent thread per desk: a \`pi -p\` process rooted
in the repo with a fixed session file (\`<reviewDir>/correspondent-session.jsonl\`), read-only
tools, no extensions, no inherited listener. That thread is 1 thread = 1 agent: it resumes the
same conversation for every question and keeps the review Q&A context THERE, not in the owner
session, which is never asked to read for an answer. On each question event the extension
passes the parsed questions directly to that thread, parses its "### q<N>" reply blocks, and posts
each answer to the desk at the question's own path/line/side with role agent, VERBATIM - no
owner turn, no per-question children, no runs.all fanout. The owner is woken only for review
events (act on the feedback in the owner, which holds the code context, then \`syneva reload\`),
closed events, and a correspondent failure, in which case it answers the questions itself with
\`syneva comment\`, VERBATIM at the saved anchors. Never fork the owner transcript for a
factual question: a fork re-sends exactly what the routing exists to avoid.

For an existing unattached desk, attach the session that owns its review context, not an unrelated
agent. If the tool is missing in an already-open Pi process, reload the Pi extensions first.

## The loop (CLI-only hosts, without the Pi attachment)
Open the desk (it returns at once), then await events and branch on kind:
\`\`\`bash
syneva open --session <id>                 # or: syneva open file <path> / syneva open pr <ref>
while ev=$(syneva await); do
  [ -z "$ev" ] && continue                               # --timeout fired, no event
  case "$(jq -r .kind <<<"$ev")" in
    question)  # answer EACH - READ-ONLY (see Events); thread under each question's path/line/side
      jq -c '.questions[]' <<<"$ev" | while IFS= read -r q; do   # one object per line - space-safe
        syneva status --body "Reading X to answer…"        # live progress
        if [ "$(jq -r .anchor<<<"$q")" = domain ]; then     # a question on the guide: reply in its thread
          syneva comment --domain "$(jq -r .domainId<<<"$q")" --body "…"   # add --block "$(jq -r .blockId<<<"$q")" when set
        else
          syneva comment --path "$(jq -r .path<<<"$q")" \\
            --line "$(jq -r .lineNumber<<<"$q")" --side "$(jq -r .side<<<"$q")" --body "…"
        fi
      done ;;
    review)    # act on the ReviewResult, then \`syneva reload\` to show your edits
      r=$(jq .result <<<"$ev") ;;
    closed)    exit 0 ;;    # the human ended the review in the browser - workflow over
  esac
done
\`\`\`
- \`syneva await [--timeout <s>]\` - block for the next event, print one tagged JSON envelope,
  exit. No --timeout → holds open; --timeout <s> → empty stdout (204) after <s>s, re-poll. Exit
  non-zero = no live desk (open one) - including a desk that went silent mid-poll (closed, or the
  hub stopped; don't blind-reopen a closed desk, see the closed event below). After handling ANY
  event, await again immediately - more may already be queued (the human keeps working while you
  act).
- \`syneva comment --path <f> --line <n> [--side additions|deletions] --body "…"\` - agent reply.
  Live desk → posts over HTTP, threaded under the matching human comment; no live desk →
  appended to the saved review. Match path/line/side. Agent comments are never echoed back as
  requestedChanges. \`syneva comment --domain <id> [--block <id>] --body "…"\` replies in a guide
  thread instead (a domain of the guide, or one of its explanation blocks - see The guide: Feedback);
  a domain or block the attached guide does not have is refused (422 UNKNOWN_DOMAIN).
- \`syneva status --body "…"\` - ephemeral one-line "doing X now" beside the reviewer's spinner.
  Cleared by your next comment; stale after ~90s (keep posting through long work); never
  persisted; exits 0 even with no desk.
- \`syneva reload [--guide <file>]\` - re-diff the working tree into the live desk (your edits are
  NOT auto-re-diffed). Anything you edit resets to pending on reload - decisions and approvals
  alike; anything you left untouched carries over. --guide swaps the guide (one desk only -
  see Between rounds).
- \`syneva close [--session <id> | --all]\` (alias: \`syneva stop\`) - close this repo's live desk(s)
  on the hub (--all = every session of the repo). The hub keeps running. Idempotent, exits 0 with
  {stopped:[…], closed:[…]} whether or not a desk was open - call it yourself the same turn the
  session settles; never ask the human whether to close, that prices an idle desk's closure at a
  whole LLM round-trip. The human's browser Close (and the dashboard's Close) is the same closure,
  delivered to you as a closed event. All review state is persisted; a later open restores it.

${EVENTS_SPEC}
${GUIDE_SPEC}
## Between rounds - reload vs reopen, and the hub
- Don't edit tracked files mid-round: the reviewer wouldn't see the edits and their in-flight
  decisions would be invalidated. Edit between rounds, then \`syneva reload\`.
- Changing the diff source of a session (working ↔ staged, another --path) is an open with the
  other flags: the hub replaces that session's desk under the same URL (its tab asks for a
  refresh) - admitted like any open, guide first, so a refusal leaves the live desk as it was.
  Changing the mode or the file/ref is a different session - a second desk.
- The reviewer keeps ONE tab per desk: open is idempotent (a live desk is reused, never
  duplicated) and each repo+session maps to one stable /d/<id>/ URL on the hub, so a reopened or
  restored desk lands in the same tab (it shows a refresh notice after a hub restart) - don't tell
  the reviewer to switch tabs. Pass --session only to run a second, separate desk. A live guided
  desk reopened without a guide is reloaded with the guide it carries (stale where the code moved
  on); a live desk that has none is left as it is (GUIDE_REQUIRED) - \`syneva reload\` never needs
  a guide, and a hub restart restores every desk as it was.
- The hub never closes desks on its own: a desk lives until the human closes it (browser or
  dashboard) or you do (\`syneva close\`). The dashboard lists every live desk with its last
  activity, agent status and review progress. State persists on every save; \`syneva hub stop\`
  + \`syneva start\` (or a crash + restart) restores every registered desk on the same ids.
- Several agents, several repos, several desks: all on the one hub, each desk siloed (its own
  event stream, its own mutation lock, its own review state).

## Browser state & refresh
- Every desk route lives under /api/desks/<deskId>/ on the hub (GET /api/hub/desks lists desks
  with their ids; POST /api/hub/desks opens one; DELETE /api/hub/desks/<id> closes one;
  POST /api/hub/inventory answers the review source of an open's body, see The guide).
  GET /api/hub/journal[?after=<seq>][&limit=<n>] reads what happened on the hub (desks opened,
  reloaded and closed, rounds sent and picked, asks, your replies), oldest first, at most
  limit (default 500, at most 2000; the newest when more follow) - you never write it: the hub
  records each event as it happens.
- GET …/state returns BrowserReviewState plus transient desk status and serverInstanceId, not
  the persisted ReviewState. POST …/reset returns the same browser projection in its state field
  plus serverInstanceId outside it, and takes { scope: "review" | "approved" | "all" }: 'review'
  clears every decision and sign-off but keeps the notes (comments), 'approved' resets only the
  signed-off files, 'all' - also the default for a bodyless POST - clears the notes too. The tab
  checks the instance on both state-adoption paths.
  rawDiff, per-file hunks, and backend-only metadata never ride these responses. Files carry
  hasHunks and added/removed counts; contents still load separately via …/file-contents.
- GET …/poll?instance=<serverInstanceId> normally carries hash, guide, comments and liveness.
  After a hub restart, a mismatched instance receives {kind:"refresh",…liveness} instead. The tab
  shows a persistent refresh-required notice, never automatic navigation, and stops adopting the
  restored desk's state. Finish pending actions and copy unsaved text before manually refreshing.
  A closed desk answers 404 DESK_NOT_FOUND; the tab shows its desk-closed cover.

## Settings & errors
- The human's display prefs live in a desk panel (persisted to ~/.syneva/settings.json) - you
  don't set them. Note: with "Approve stages file" OFF, approving is verdict-only and stagedFiles
  may be empty even for approved files. The "Open in editor" command ({repo}/{file}/{line}
  placeholders; known GUI editors only) has no effect on review state.
- Error responses are {error, code, fix, docs} - honor fix. PATCH_CONFLICT (409) = the working
  tree changed since the desk loaded; reload state and retry. DESK_NOT_FOUND (404) = the desk was
  closed; list desks or open one. UNAUTHORIZED (401) = the hub wants its key (SYNEVA_KEY).
  GUIDE_REQUIRED (422) = a repo/pr open without a guide of this source: take the inventory, author
  the guide, open again with --guide. INVALID_GUIDE (422) = the guide names what does not hold
  (the fields are listed); fix them, never pad.`
