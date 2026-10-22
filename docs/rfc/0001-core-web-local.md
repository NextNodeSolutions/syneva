---
title: "RFC 0001 · Core, web, local: one hub, two ways in"
summary: How Syneva works today, how the workspace splits into one core, two adapters (local on Node, web on Workers) and three modes, and how a local hub shows up on syneva.dev in real time through one Durable Object per account, held under a complete serverless cost discipline.
---
# RFC 0001 · Core, web, local: one hub, two ways in

Status: v2.3, phases 0 to 2 implemented (section 12 records where the code differs from the
sections above), phase 3 open. Date: 2026-10-21. Branches: the `feat/core-*`, `feat/bridge-*`,
`feat/apps-web` and `feat/web-*` stack.

v2 replaces v1's bridge (a D1 mailbox that a Worker invocation re-read every 250 ms) under the
rule that polling is a last resort (`AGENTS.md`, Conventions). The bridge is now one Durable
Object per user used as a switchboard for hibernating WebSockets, and section 6 is the complete
catalogue of the ways a serverless bill runs away, each with its number, its guard, its
detection and the test that proves the guard. Prices and limits are Cloudflare's as published in
October 2026 (Workers, Durable Objects, D1, Workers Logs, Tunnel and DNS pages).

Decisions already taken, so this RFC does not reopen them:

1. **No polling anywhere**: not in the browser, the CLI, the hub, nor a Worker. Push only.
2. **The web's stateful point is a Durable Object per user**, under the cost discipline of
   section 6. Any change to that discipline reopens the cost model of section 5.
3. **One core, two adapters, three modes.** Core is all the functioning (domain, application,
   the hub, the routes) over ports; `local` implements them on Node, `web` on Workers. 100 %
   local, 100 % web (core's hub in the user's object over the GitHub API, no local code) and
   web + local through the probe are the three modes of 3.3. A desk is never a third kind.
4. **One Cloudflare account, the Paid plan.** No Free tier: "zero" means a budget mastered
   without exception, every billable dimension bounded (6.6), not a plan that fails operations
   at a cap.
5. **Budget detection lives in control-center**, as one of its agents (6.4). `apps/web` ships
   the thresholds and the breaker's ops route, never a canary or a cron.

## 1. How the app works today

### 1.1 One process, two surfaces, one protocol

- **The hub** (`packages/backend/src/bootstrap/hub.ts`) is one `node:http` server per machine
  on port 4747. `createHubRequestHandler` (`adapters/inbound/http/router.ts`) is the single
  request entry point: Host/Origin guard, then the access guard (`--key`, Bearer header or
  signed-in cookie), then dispatch: dashboard page shells, desk page shell, hub API
  (`/api/hub/*`), dashboard API (journal, settings), per-desk API (`/api/desks/<id>/*`, 22
  routes in `routes.ts`), UI assets last.
- **The desk registry** (`adapters/inbound/http/hub.ts`, `createHub`) is a `Map<deskId, HubDesk>`.
  Opens are serialized. A desk id is `hash(root + "\n" + session)` (`domain/identity.ts`, a full
  sha256 hex digest; the router accepts 8 to 64 hex), so an open is idempotent and `/d/<id>/`
  survives a restart; the rebuild parameters are persisted to `~/.syneva/hub/desks.json` and
  `restore()` rebuilds every desk at start, before the server answers desk requests.
- **One hosted desk** (`hosted-desk.ts`, `context.ts`): a `DeskContext` holds a copy-on-write
  `ReviewState`, a monotonic `revision`, one mutation mutex, the agent event stream
  (`application/events.ts`: question / review / closed, FIFO, one parked waiter), the ephemeral
  agent activity (90 s TTL), liveness, the capability ports (git, store, settings, editor) and
  the journal binding that names the desk on every event.
- **The review itself** is pure domain/application code over `GitPort` (`application/build.ts`
  assembles the diff and reads contents through `git cat-file --batch`; reconcile, staging,
  send, guide drafting and composition are all pure over the ports), persisted as JSON under
  `~/.syneva/<repoHash>/<session>/`.
- **The journal** (`application/journal.ts` on `HubJournalPort`, `~/.syneva/hub/journal.jsonl`)
  records an event when the thing happens and serves its tail (5000 kept, reads capped at 2000).
- **The published package** (`apps/syneva`) bundles the backend entry and the pi bridge with
  tsdown and copies the built UI next to them; the pi extension under `extension/` is an
  adapter over the same CLI/HTTP contract (`syneva spec`).

### 1.2 Who talks to the hub, and how often

| Caller | Transport | Cadence |
|---|---|---|
| Desk tab (`ui.js`) | `GET /api/desks/<id>/poll?instance=` | every 1.5 s (`app/poll.ts`); `/state` only when `baseDiffHash` moves; `/file-contents` per file, on demand |
| Dashboard (`dashboard.js`) | `GET /api/hub/desks`, `GET /api/hub/journal?after=` | every 2 s while the tab is visible (`entities/hub/poll.ts`); health once |
| Agent, CLI | `GET /api/desks/<id>/await-send` | one request parked up to 1 h, resolved by the event; `comment`, `status`, `reload`, `close` are plain requests |
| Agent, pi | the same routes through `adapters/inbound/pi` | the listener rides out a hub restart |
| Reviewer | `POST /save`, `/send`, `/ask`, `/reset`, `/stage*`, `/open-editor` | on action |

The two browser rows are polling and are the first thing this RFC removes (4.6). The agent's
`await-send` is not polling: the server parks the request and the event resolves it. It stays.

### 1.3 What is portable and what is Node-bound

| Layer | Node coupling | Verdict |
|---|---|---|
| `domain/`, `application/` | only `node:path` and `node:crypto` (sha1, sha256, randomUUID); no third-party dependency | portable as is; kept that way by lint as a CI gate (3.1) |
| `adapters/inbound/http/*` | `IncomingMessage` / `ServerResponse` in every route; `res.on('finish')` hooks on send, stop, shutdown | the routes move into core on the Fetch API (3.2), so the same handlers run under `node:http` and in the user's object (3.4); `local` adapts `IncomingMessage` to `Request`, keeps the parked `await-send` route and gains the WebSocket upgrade route (4.6) |
| `adapters/outbound/*` | `node:fs`, `child_process` (git, gh, the editor), `oxc-parser` native binding | local by nature |
| `adapters/inbound/cli`, `adapters/inbound/pi`, `bootstrap` | `process`, spawn, lock files | local by nature |
| `packages/frontend` | none: the desk id comes from the page URL, every path from `@syneva/contracts/routes` | portable as is |
| `packages/contracts` | none | shared |

### 1.4 What already points at a hosted hub

- `--host`, `--key`, `--public-url` bind the hub wider behind an access key (README, "Reviewing
  from another machine"). The bridge does not replace this: a tailnet user can keep it.
- The unmerged `feat/agent-runner` branch parks one desk's event loop in a plain process
  (`syneva runner --exec`). The README roadmap lists "Remote runners" and "Hosted hub".
- `PRODUCT.md`: two ways in, one product; features that need a server of ours belong to the
  hosted service alone; the local hub never needs an account.

## 2. Goals, non-goals, constraints

Goals

1. The same experience local and web: same dashboard, same desks, same routes, same bundle,
   same push transport.
2. A hub on a laptop shows up on syneva.dev in real time, from any device, when its owner signs in.
3. The web stays minimal: accounts, pairing, one object per user. No review logic of its own:
   what reviews there is core, over the web adapters.
4. The web can later host things the local never will (cloud agents, history, sharing).
5. The local never needs an account: no pairing, no bridge, nothing changes.

Constraints

- No polling (`AGENTS.md`, Conventions). Keepalive pings, coalescing and reconnection with
  backoff are not polling: nothing re-asks for state on a timer.
- Durable Objects only under the discipline of section 6: the bill must stay in cents per user,
  bounded in every failure mode listed there, with a hard bound on every billable dimension
  (6.6) and nothing paid for nothing.
- The agent contract (`syneva spec`), the desk routes and the review files on disk stay as they are.
- Everything deploys the way the landing does: Workers, D1, CI only, `nextnode.toml`.

Non-goals (this RFC)

- Multi-user review of one desk, sharing, comments from a second person.
- Building the web hub (mode 2, 3.4) in phases 0 to 2: it is phase 3. The architecture is
  ready for it from phase 0, and no desk is ever a third kind.
- History past what the hubs hold (costed in 6.2, C4; a phase 3 decision).

## 3. The split

### 3.1 Package map

```
packages/contracts    wire shapes (+ bridge.ts: frames, limits, close codes)                   shared, no deps
packages/core         domain + application + the hub + the desk routes, over ports             runs on Node and on Workers
packages/frontend     the surface: desk + dashboard, one push transport                        runs in the browser
packages/local        the Node adapters: git CLI, fs, oxc, editor, node:http + ws, CLI, pi, probe   a machine, or a sandbox
apps/syneva           the published CLI: bundles local + core + frontend
apps/web              the Workers adapters: the Worker, the user's object (core's hub + the switchboard), D1
apps/landing          unchanged
```

Dependency rule, enforced by oxlint: `core` and `frontend` import nothing from `local` or
`web`; `local` and `web` import `core` and `contracts`; `frontend` imports `contracts` only.
`core` is Workers-clean as a CI gate, not as hygiene: its only `node:*` imports are `node:path`
and `node:crypto` (both in `nodejs_compat`); `node:fs`, `node:http`, `node:child_process`,
`node:os`, the `process` global, `setTimeout` and `setInterval` are refused in core by
`no-restricted-imports` / `no-restricted-globals` overrides with a stated reason. The user's
object hosts core's hub (3.4), so a Node API in core would break mode 2 and a timer in core
would make the object billed while it waits (6.1 W4).

"A core that embeds all the functioning" is two build units, `core` (the engine) and
`frontend` (the surface), because of the two compilation worlds (`AGENTS.md`). One product,
two adapters, three modes.

### 3.2 What moves where

`packages/core` (from `packages/backend`):

- `domain/**` and `application/**` as they are, with their ports (`application/ports.ts`:
  `GitPort`, `WorkspacePort`, `ParserPort`, `ReviewStorePort`, `SettingsPort`, `EditorPort`,
  `UpdateCheckPort`, `HubRegistryPort`, `HubJournalPort`).
- The hub: the registry (`hub.ts`), the hosted desk (`hosted-desk.ts`, `context.ts`),
  liveness, records, summaries, inventory, the open request, the failure shapes. Its one timer,
  the closed-desk grace in `hub.ts`, becomes a `closedAt` deadline pruned on the next read.
- The desk and hub routes, rewritten on the Fetch API (`Request` in, `Response` out) so the
  same handlers serve on `node:http` (local adapts the request) and in the object (3.4). Core's
  router has no parked route: `await-send` is local's, added on top (4.6); the web's agent
  attach is a socket (3.4).
- The ports narrowed to what a web adapter can honour: `GitPort.run(args, cwd)` leaves the
  port, and `application` calls `diff(base, head)`, `blob(ref, path)`, `tree(ref)`, `head()`,
  `branch()`; `gh` becomes a `PullRequestPort`; staging and reset become an optional
  capability (`GitPort.staging?`) the web adapter does not offer. `Decision` records are
  already the truth (`AGENTS.md`, invariants), so a desk without staging loses nothing.
- New: `hub.subscribe(listener)`. The hub tells what moved, when it moves: a desk opened,
  reloaded or closed (`desk` / `closed`), a state commit or a status or activity change
  (`pulse`, the same payload `/poll` serves today), a journal append (`journal`), the hub's
  health (`health`). It is the only source every push transport reads from: the local
  WebSocket route (4.6), the probe (4.3) and the object's tab sockets (3.4).

`packages/local`, the Node adapters:

- `adapters/outbound/**` (git CLI, filesystem, editor, source over native `oxc-parser`,
  package-registry, console, platform-open), unchanged.
- The `node:http` server adapting `IncomingMessage` to `Request` for core's router, the parked
  `await-send` route on top of it, and one upgrade route, `GET /api/hub/ws`, served by `ws`
  (the one new dependency, bundled by tsdown): the same guards as every route (Host/Origin, key
  or cookie), then one `HubStream` per socket fed by `hub.subscribe()`.
- `routes/static.ts`, `adapters/inbound/cli/**`, `adapters/inbound/pi/**`, `bootstrap/**`.
- New: `adapters/outbound/bridge/**`, the probe (4.3, 4.4), and `syneva login` / `logout`.
- It runs on a machine (modes 1 and 3) or in a sandbox the web provisions (a cloud agent of
  ours that owns its working tree, paired like a laptop): the same code, the same contract.

`apps/web/src`, the Workers adapters: the Worker (auth, pairing, GitHub OAuth in phase 3, the
upgrade routes, the HTTP relay entry, settings, the breaker's ops route, the GitHub webhook
route), the user's object `UserHub` with its two roles (core's hub over the web adapters for
web desks, 3.4; the switchboard of section 4 for paired hubs), the web adapters (`GitPort` over
the GitHub API, `ReviewStorePort`, `HubRegistryPort` and `HubJournalPort` over the object's
SQLite, `ParserPort` over `oxc-parser`'s wasm build or a headings-only outline, `SettingsPort`
over D1, no `EditorPort`), the D1 migrations. No cron: expired codes are purged on the next
insert, and budget detection is control-center's (6.4). It imports `@syneva/core` and
`@syneva/contracts`. Section 8 has the shapes and the config.

### 3.3 Three modes, one hub

| Mode | Where core's hub runs | Adapter under it | The desks | The agent |
|---|---|---|---|---|
| 1. 100 % local | on the machine, `node:http` on 4747 | local: git CLI, fs, native oxc, editor | the repository on disk | the CLI on the machine, `await-send` parked |
| 2. 100 % web | in the user's object, hub role | web: the GitHub API, the object's SQLite, oxc wasm | a GitHub branch or pull request each | the CLI wherever it runs (a sandbox of ours, anyone's cloud agent), attached over a hibernating socket; or its own hub in a sandbox, paired as in mode 3 |
| 3. web + local | on the machine, shown through the object's switchboard role | local under the hub, the probe beside it | the repository on disk | the CLI on the machine |

The three share the frontend, the routes, `core.hub` and `hub.subscribe()`; what changes is
the adapter under the hub and where it runs. No local code is needed for mode 2: the repository
is a branch on GitHub, the hub is the object, the reviewer's browser and the agent's CLI are the
only clients. A cloud agent of ours is a sandbox running `local`; a cloud agent of anyone's is
whatever pushes to the branch, and its author attaches the CLI to the web hub with a token. The
object carries both roles, so one tab socket receives the frames of web desks (under the
object's own `hubId`) and of paired hubs (under theirs), and the frontend sees one list of
desks.

Mode 2 is phase 3 (section 10), but the architecture is ready for it from phase 0: core runs
on Workers, timer-free, over ports the GitHub API can honour, its routes on the Fetch API; the
object's bundle is core plus the web adapters; the switchboard and the hub share one object per
account.

### 3.4 The web hub, mode 2

The working tree is a branch. A web desk names a repository, a base and a head (a pull request
is the common case): the diff comes from the compare API, blobs from the contents API on demand
(never the whole tree), the outline from `oxc-parser`'s wasm build if it runs on Workers, else
from headings only (section 11). Decisions, comments, the guide, the journal and the registry
live in the object's SQLite, written per action: a decision, a comment, a reload, a posted
guide. A push to the branch reaches the hub as a GitHub webhook (`push`,
`pull_request.synchronize`) received by a Worker route that tells the object to reload: one
request per push, never a timer. There is no editor and no staging; `Decision` records were
already the truth.

The agent's long wait is the one thing that changes shape: a parked `await-send` would keep the
object awake (6.1 W2), so a web hub serves `GET /api/desks/:id/agent` as a hibernating socket
that delivers the review as a frame (a phase 3 addition to `spec.ts`; the parked route stays
local's). Everything else the agent does (`comment`, `status`, `reload`, `close`, the guide)
is the same route as today, through the Worker to the object.

What it costs is written before it is built: rows W1 to W7 in 6.1, tests T11 to T13 in 6.7.
The only line that scales with hours is the sandbox of a cloud agent of ours, a paid feature
priced by the hour, never part of the base.

## 4. The bridge

This section is the switchboard role of the user's object: mode 3, a paired hub shown on the
web. The hub role (mode 2) is 3.4; both share one object per account and the discipline of
section 6.

### 4.1 Five principles

1. **Outbound only.** The hub connects to the web, never the reverse: no open port, no tunnel
   binary, works behind NAT, works from a phone. The shape of Claude Code's remote control: a
   probe on the machine, a switchboard in the cloud, the same UI on top.
2. **Push everywhere.** A frame travels when the thing happens: the hub pushes, the object
   forwards, the tab renders. Nothing re-asks for state on a timer, on either side.
3. **The object is a switchboard, not a store.** The hub is the truth. The object forwards
   frames between a user's hubs and tabs, keeps no desk state across wakes, writes nothing to
   its storage, and asks a hub for a snapshot whenever a tab connects or a wake needs one.
4. **Everything is bounded.** Frames, bodies, in-flight relays, sockets per user, rates per
   socket, deadlines, log volume: every number is in `BRIDGE_LIMITS` and every bound has a
   test (6.7).
5. **The transport is a port on both ends.** `HubStream` locally and `UserHub` on the web
   speak the same frames from the same `hub.subscribe()`; the frontend has one transport module
   for both worlds.

### 4.2 Pairing: `syneva login`

A device-code flow, like `gh auth login`. No file, no probe: the local hub is exactly today's.

1. The CLI calls `POST /bridge/v1/device/code` and gets an 8-character user code, a
   verification URL and a polling interval of 5 s (the one place a timer re-asks: a device-code
   flow has no channel back to a CLI before it holds a token; it lasts at most 10 minutes and
   the comment on it says so).
2. The browser opens the URL (the code is printed too). Magic-link sign-in, code confirmation:
   the web creates the hub (`id`: 16 hex random, `name`: the hostname, a 32-byte token stored as
   a sha256 digest) and binds it to the account.
3. The CLI polls `POST /bridge/v1/device/token` at the interval, receives `{ hubId, token }`,
   writes `~/.syneva/hub/bridge.json` with mode 0600.
4. It tells the running hub through a loopback-only route (`POST /api/hub/bridge/reconnect`):
   the probe opens its socket. The hub reads the file on every start.
5. `syneva logout` revokes the token on the web (close code `4001` reaches the probe, which
   stops) and deletes the file. The Hub page shows the pairing on both sides.

### 4.3 Connections

Two kinds of socket, one object per user (`USER_HUB.idFromName(userId)`):

| Socket | Path | Auth, checked by the Worker before any object is touched | Tags at accept | Attachment, set once |
|---|---|---|---|---|
| hub | `GET /bridge/v1/ws` | `Authorization: Bearer <hub token>`: one D1 read of `hubs` by token digest; revoked or unknown: 401 | `hub`, `hub:<hubId>` | `{ kind: 'hub', hubId, userId, version }` |
| tab | `GET /api/hub/ws` | the session cookie: one D1 read of `sessions`; absent or expired: 401 | `tab` | `{ kind: 'tab', tabId, userId }` |

Then `stub.fetch(request)` with the identity in an internal header, and the object:

- refuses beyond `hubsPerUser` (8) or `tabsPerUser` (32) with close code `1013`;
- `ctx.acceptWebSocket(ws, tags)` and the attachment, never `ws.accept()`;
- the constructor has done exactly one thing: `setWebSocketAutoResponse` on the pair
  `{"t":"p"}` / `{"t":"o"}`, so pings never wake the object and are never billed;
- a hub socket's first frame is `hello`, then a snapshot (4.4); on a tab connect the object
  sends the tab one `hub` frame per connected hub (read from the attachments, no storage, no hub
  round trip) and asks each hub for a snapshot with `snapshot?`.

Close codes and the client policy, shared by the probe and the frontend transport:

| Code | Meaning | Client |
|---|---|---|
| `1008` | rate exceeded (4.4) | wait 30 s, then the normal backoff |
| `1013` | too many sockets for this user | wait 60 s; the tab says "trop d'onglets ouverts" |
| `4001` | token or session revoked | stop; the Hub page or the sign-in page says it |
| `4029` | service saturated: the breaker is set (6.5) | wait 5 min; the tab says "service saturé" |
| HTTP `401` on the upgrade response | revoked or signed out | stop; as `4001` |
| HTTP `403`, `429` or `503` on the upgrade response | refused at the edge (the WAF rule, the breaker's edge stage) or by the Worker | wait 5 min, then the normal backoff |
| any other, including a deploy | reconnect | exponential backoff 1 s to 60 s with full jitter, forever |

Every client sends `{"t":"p"}` every 30 s and expects `{"t":"o"}` within 10 s, else it
reconnects. A relayed action is never retried by a client on its own; the person retries, as
against a slow local hub.

### 4.4 Frames

`packages/contracts/src/bridge.ts` (sketch; section 8 has the full shape). JSON text frames,
at most 1 MiB each. Locally the hub sets `hubId: 'local'`; bridged, the probe speaks web ids
(4.8) and the object forwards frames verbatim after one check: a frame from a hub socket must
carry that socket's `hubId`, or the socket is closed with `1008`.

| Frame | Direction | When |
|---|---|---|
| `hello { hub }` | hub → object → tabs | first frame after connect: id, name, version, instanceId, startedAt |
| `desk { hubId, desk }` | hub → tabs | a desk opened, reloaded, or its summary changed |
| `closed { hubId, deskId }` | hub → tabs | a desk closed |
| `pulse { hubId, deskId, pulse }` | hub → tabs | the `/poll` payload of today, when it changes; coalesced per desk to at most one every 250 ms, latest wins |
| `journal { hubId, events }` | hub → tabs | journal appends, batched every 250 ms, at most 200 events per frame |
| `snapshot-end { hubId }` | hub → tabs | closes a snapshot: `hello`, then one `desk` and one `pulse` per desk, then the journal tail (200 events), then this |
| `hub { hubId, name, online }` | object → tabs | a hub socket opened or closed; on tab connect, one per connected hub |
| `snapshot? {}` | object → hub | a tab connected, or a wake needs the state |
| `req { id, method, path, query, body? }` | object → hub | one relayed HTTP request (4.5) |
| `res { id, status, headers, body?, more? }`, `chunk { id, data, more? }`, `err { id, code }` | hub → object | the relayed answer, chunked when over 768 KiB (base64 keeps a chunk frame under 1 MiB) |
| `cancel { id }` | object → hub | the Worker's request was aborted or timed out |
| `p` / `o` | any → object → any | ping, answered by the auto-response |

Rates, enforced inside the object with an in-memory token bucket per socket (lost on a wake,
which only ever makes it more lenient for one second): more than 100 frames per second or 2 MiB
per second sustained closes the socket with `1008`. Tabs send pings only; any other frame from a
tab closes it with `1003`. The hub-side coalescing (250 ms per desk, journal batches) keeps a
busy agent far under the limit: a hub that trips it has a bug, and reconnects 30 s later.

### 4.5 The HTTP relay

The frontend keeps `fetch` for every action, so nothing changes in `shared/api/client.ts` or
the entities' API modules. On the web a desk request travels: tab → Worker → object → hub →
object → Worker → tab.

1. The Worker authenticates (cookie), bounds the body (1 MiB, else 413 before any object call),
   checks the path against the allowlist derived from `@syneva/contracts/routes` and forwards
   with `stub.fetch`. Never relayed: `/poll` (replaced by `pulse` frames), `/await-send` (an
   agent talks to its hub, never to the web), `/ws`.
2. The object resolves the hub from the web id's prefix (4.8). No hub socket: `503
   HUB_OFFLINE` at once, nothing waits. More than 32 relays in flight for this user: `429`.
   Otherwise it sends `req` and awaits `res` with a 30 s deadline, streaming `chunk` frames into
   a `TransformStream` so a response is never held whole in memory. Deadline: `504 HUB_TIMEOUT`
   and `cancel` to the hub. Hub socket closed mid-flight: `502`.
3. The probe builds a trusted `Request` for the local router (loopback semantics: the
   Host/Origin guard is skipped because the channel is authenticated; every per-route
   validation runs), caps the response at 32 MiB (`err TOO_LARGE`, the tab gets 413), and
   answers in chunks of 768 KiB.

An in-flight relay is the one thing that keeps the object awake on purpose: it is bounded by
the deadline, the in-flight cap and the body cap (6.2, A6, E1). The local hub answers the same
paths directly, as today.

### 4.6 The local hub pushes the same frames

Phase 0, before any web work:

- `GET /api/hub/ws` on the local hub (`ws` on the `node:http` server's `upgrade` event, behind
  the router's guards). One `HubStream` per socket: `hello` + snapshot on connect, then every
  `hub.subscribe()` event as a frame, the same coalescing as the probe. The local hub has no
  rate limits to bill for, and keeps them anyway, with the same numbers: the same bug is found
  locally first.
- `packages/frontend/src/shared/api/stream.ts`: one WebSocket client (reconnect policy and
  close codes of 4.3, ping every 30 s). `entities/hub/stream.ts` replaces `entities/hub/poll.ts`:
  a store of hubs, desks, pulses and the journal, keyed by `(hubId, seq)` so a replayed tail
  after a reconnect is deduplicated. `app/poll.ts` goes; the desk tab reads its desk's `pulse`
  from the stream and keeps today's logic (`refresh` on a new `instanceId`, `/state` when
  `baseDiffHash` moves).
- `/api/desks/<id>/poll`, `/api/hub/desks` and `/api/hub/journal` stay one release for the
  CLI and for anyone scripting the hub, marked deprecated for the UI, then `/poll` goes.
- The agent's `await-send` keeps its parked request; its comment names it as the push path
  it is (a request the event resolves), per `AGENTS.md`.

### 4.7 The hub API on the web, route by route

| Route | Local hub | Web |
|---|---|---|
| `GET /api/hub/health` | the process | the Worker: deployment id as `instanceId`, `keyRequired: false` (a session cookie signs in) |
| `GET /api/hub/ws` | the hub's stream (4.6) | the object's tab socket (4.3) |
| `GET /bridge/v1/ws` | none | the object's hub socket (4.3) |
| `POST /bridge/v1/ops/breaker`, `GET /bridge/v1/ops/status` | none | the breaker, for control-center only (6.5): `OPS_TOKEN` as a Bearer, checked before anything else |
| `GET /api/hub/desks`, `GET /api/hub/journal` | kept for the CLI | not served: the stream carries both (`desk`, `journal` frames) |
| `POST /api/hub/desks`, `POST /api/hub/inventory` | opens, builds | relayed to the hub the body names (`hubId`; the New review dialog picks it) |
| `DELETE /api/hub/desks/:id` | closes | relayed (4.5) |
| `GET/POST …/settings` | `~/.syneva/settings.json` | D1 `user_settings`: preferences follow the person across devices |
| `GET /api/desks/:id/poll` | the desk, deprecated | not served: `pulse` frames |
| `GET /api/desks/:id/await-send` | the desk | never relayed |
| other `/api/desks/:id/*` | the desk | relayed (4.5) |
| `/login`, `/logout`, `/auth/*` | the key page | the magic-link pages |
| pages + assets | the bundle on disk | the same bundle as the Worker's static assets (requests to them are free) |

### 4.8 Ids, seqs, settings

- A web desk id is the hub id followed by the local desk id: `<16 hex><local id>`. The prefix
  is fixed-width, so the Worker and the object resolve the hub without any mapping, the probe
  strips it before dispatching, and `/d/<webId>/` keeps today's page URL shape (the local
  router's `DESK_ID` regex never sees a web id). Two laptops with the same repo path and branch
  never collide.
- Journal events carry their hub's own `seq`; the tab store keys on `(hubId, seq)`. On a
  reconnect the snapshot replays the tail; duplicates are dropped by key. No cursor crosses the
  wire.
- `serverInstanceId` travels in the `pulse`: a restarted local hub shows the same refresh notice
  on the web as in the local tab.
- Settings: D1 `user_settings` on the web, `settings.json` locally.

### 4.9 Offline and failure modes

| Situation | What the person sees | Cost side |
|---|---|---|
| hub offline | its desks stay listed, greyed, "vu il y a"; a relayed request answers `503 HUB_OFFLINE` at once | nothing waits, nothing is billed |
| web unreachable from the hub | nothing changes locally; the probe backs off (1 s to 60 s, jitter) and replays a snapshot on reconnect | bounded reconnects (6.2, B3) |
| token revoked | the probe stops (`4001`); the Hub page says it | zero |
| a deploy of `apps/web` | every socket drops; probes and tabs reconnect within the jitter window | one request per socket (6.2, B4) |
| the breaker set (6.5) | tabs and probes get `4029` and wait 5 min, relays answer `503`; the tab says "service saturé" | a drained object costs nothing |
| a hub answers nothing | `504 HUB_TIMEOUT` after 30 s; the tab shows its "ne répond pas" cover and does not retry | at most 30 s awake per request (6.2, A6) |

### 4.10 Alternatives considered

| Option | Why not |
|---|---|
| v1: a D1 mailbox re-read every 250 ms inside a Worker invocation | polling moved server-side; withdrawn under the AGENTS.md rule |
| a Cloudflare Tunnel per hub, the Worker proxying SSE | free up to 1,000 tunnels per account, then $4.50 per tunnel-month (Tunnels for Platforms, 2026-10-16); 200 DNS records per Free zone; a `cloudflared` binary on every machine; the per-user cost profile the user fears most |
| a relay of our own on a fixed-price machine | no polling, fixed cost; but a machine to operate, one region, outside the Workers pipeline; kept as the fallback if 6's discipline ever fails |
| a managed pub/sub (Ably, Pusher, Supabase Realtime) | a vendor between the hub and the person, per-message pricing at scale |
| Postgres `LISTEN/NOTIFY` from the Worker | Hyperdrive does not support it; a direct connection per tab exhausts any provider's connection limit |
| WebRTC data channels, Cloudflare Pub/Sub | a native module in the CLI; a product still in private beta since 2022 |

## 5. Cost model, normal operation

What Cloudflare bills on this design, Workers Paid ($5 per month minimum, already paid by the
landing's account):

| Dimension | Included per month | Then | Where this design touches it |
|---|---|---|---|
| Durable Object requests | 1 M | $0.15 per M | one per socket connect, one per 20 incoming frames, one per relayed HTTP request |
| Durable Object duration | 400,000 GB-s | $12.50 per M GB-s, 128 MB per object, billed while active or idle-but-not-hibernatable, rounded up to the next million | frame handling (ms), relays in flight (≤ 30 s) |
| Worker requests | 10 M | $0.30 per M | socket connects, relayed HTTP, page loads, auth; static assets are free |
| Worker CPU | 30 M ms | $0.02 per M ms | ≈ 1 to 5 ms per request |
| D1 rows read / written | 25 B / 50 M | $0.001 / $1.00 per M | one read per authenticated request; writes on login, pairing, connect/disconnect |
| DO SQLite rows written, storage | 50 M, 5 GB | $1.00 per M, $0.20 per GB-month | none: the object never writes |
| Workers Logs | 20 M events | $0.60 per M | sampled at 1 %, connect/close/error only |

Free by construction: requests to static assets, outgoing WebSocket frames, protocol pings and
auto-responses, egress, wall time on the Worker, Cloudflare's DDoS mitigation, one WAF rate
limiting rule.

Assumptions per user and per day, deliberately generous: an agent active 4 h pushing one
update every 2 s (8,000 incoming frames from hubs), 100 actions from the tabs (each a relay
awake 300 ms on average), 25 reconnects, 10 page loads, 5 ms of handling per frame.

Per user and per month: 240,000 frames = 12,000 DO requests, plus 750 connects and 3,000
relays: ≈ 16,000 DO requests; duration 1,200 s (frames) + 900 s (relays in flight) = 2,100 s ×
0.128 GB ≈ 270 GB-s; ≈ 4,000 Worker requests; ≈ 12,000 CPU-ms.

| Users | DO requests / month | DO duration / month | Worker requests | Monthly bill | Per user |
|---|---|---|---|---|---|
| 100 | 1.6 M | 27 k GB-s, included | 0.4 M | $5 (the minimum) | $0.05 |
| 1,000 | 16 M | 270 k GB-s, included | 4 M | ≈ $7 | $0.007 |
| 10,000 | 160 M | 2.7 M GB-s | 40 M | ≈ $70 | $0.007 |
| 100,000 | 1.6 B | 27 M GB-s | 400 M | ≈ $700 | $0.007 |

Sensitivity: an agent ten times chattier multiplies the frame lines by ten: 1,000 users then
cost ≈ $40 per month. A user with 8 hubs and 32 tabs costs the same as one with one of each
plus the frames they generate: outgoing frames are free.

## 6. The serverless horror catalogue

Every way this design can produce a bill nobody asked for, with the worst number, the guard
that removes it, how it is detected, and the test that proves the guard (6.7). The rules the
catalogue derives are in 6.3 and in `AGENTS.md` ("Serverless cost discipline"); any new
Cloudflare product or binding added to `apps/web` must get its own rows here first.

Units used below: one object awake 24 h costs 0.128 GB × 86,400 s = 11,059 GB-s = **$0.138
per day, $4.15 per month**. A DO request costs $0.15 per million, a Worker request $0.30 per
million, a storage row $1 per million, a log event $0.60 per million.

### 6.1 The catalogue

**A. Duration: what keeps an object awake**

| # | Vector | Mechanism | Worst case, no guard | Guard | Detection, test |
|---|---|---|---|---|---|
| A1 | `ws.accept()` instead of `ctx.acceptWebSocket()` | a standard-accepted socket pins the object for its whole life | $4.15 per socket-month; all users: $4,150 per month at 1,000 users | lint forbids `.accept(` in the object; only the Hibernation API | control-center (6.4); T1 |
| A2 | `setTimeout`, `setInterval`, scheduled callbacks | pending timers make the object not hibernation-eligible | same as A1 | lint `no-restricted-globals` in the object; pings are auto-responses | control-center; T1 |
| A3 | alarms, especially self-rescheduling ones | each alarm is a request plus duration; one per second = 2.6 M requests per object-month | ≈ $0.43 per object-month, $430 per month at 1,000 users | no `setAlarm` in the object (lint); if ever needed, never under one hour | control-center, requests; T1 |
| A4 | outbound I/O from the object: `fetch`, stubs, D1, email | pending I/O keeps the object in memory up to 15 min each, billed | 115 GB-s per occurrence; 1,000 hung calls a day = $1.44 per day | none in the switchboard role; in the hub role only the GitHub adapter, 10 s deadline (W3); D1, Resend and the other bindings are the Worker's | control-center; lint |
| A5 | a streaming or long-lived response from the object: SSE, an endless stream | the object is awake for the stream's life | $4.15 per stream-month; 1,000 tabs on SSE = $4,150 per month | tabs use WebSockets; the only stream is the bounded relay in `relay.ts` (lint forbids `ReadableStream` / `TransformStream` elsewhere) | control-center; T1 |
| A6 | relays waiting on a silent hub | an in-flight request keeps the object awake until the deadline | 30 s × 100 actions = 384 GB-s per user-day = $0.005; all hubs silent: $4.80 per day at 1,000 users | 30 s deadline, 32 in flight per user, `503` at once when no hub socket, the tab never retries by itself | T4 |
| A7 | `ctx.waitUntil`, unresolved promises in handlers | work after the response keeps the object active | as A4 | no `waitUntil` in the object (lint); handlers return when the frame is forwarded | control-center; T1 |
| A8 | slow work in the constructor or `blockConcurrencyWhile` | runs on every wake, awake meanwhile | ms per wake × wakes; harmless alone, a trap with A4 | the constructor does one thing: `setWebSocketAutoResponse` | code review |
| A9 | an unconsumed request body | an open body stream is pending I/O | as A4 | the Worker reads and bounds bodies (1 MiB) and hands the object text | T4 |
| A10 | a chatty user: many hubs, many tabs | duration is proportional to frames handled | 10× chatter = 1,536 GB-s per user-month = $0.019 | per-socket rates (4.4), coalescing at the source, caps on sockets per user | T2 |
| A11 | misreading eligibility | "idle" is billed unless the object is hibernation-eligible: no timers, no pending I/O, no in-flight request | the whole of A1 to A9 | T1 is the eligibility check, run on every change to the object's code | T1 in CI |

**B. Requests: what multiplies them**

| # | Vector | Mechanism | Worst case, no guard | Guard | Detection, test |
|---|---|---|---|---|---|
| B1 | a hub looping at 1,000 frames per second | 2.6 B frames per month = 130 M DO requests, plus duration | ≈ $24 per month per runaway hub | token bucket per socket: closed with `1008` within one second; the probe waits 30 s; hub-side coalescing | T2 |
| B2 | a tab sending frames in a loop | same meter | same as B1 | tabs may send pings only; anything else closes with `1003` | T2 |
| B3 | a client reconnecting in a tight loop, 100 per second | each connect is a Worker request, a DO request, a wake | ≈ $120 per month per offender | one WAF rate limiting rule per IP on `/api/*`, `/bridge/*`, `/auth/*` (blocked requests are not billed); the client policy of 4.3 | T3 |
| B4 | a deploy of `apps/web` | every object restarts; every socket drops; everyone reconnects | 3 requests per user, ≈ $0 at 1,000 users; a burst | jitter 0 to 5 s on reconnect; deploy at low traffic, never more than once a day | T7 |
| B5 | a public flood that passes DDoS mitigation, 1 B requests per month | every request that reaches the Worker is billed | ≈ $300 per month, plus ≈ $2 CPU | the WAF rule, Bot Fight Mode, auth checked first in under 1 ms, `limits.cpu_ms = 50`; the object never sees it; "I'm Under Attack" by hand | Worker requests, control-center; the edge stage of the breaker (6.5) |
| B6 | uptime monitors and health checks of ours | self-inflicted polling | every 10 s = 259 k per month = $0.08 | health is a static asset path; monitors at one per minute at most | config review |
| B7 | crawlers, scanners | requests to shells and APIs | as B5, smaller | `robots.txt`, auth on every API path, shells are static assets | config review |
| B8 | a budget probe touching objects | one call per object per hour wakes every object | N requests and wakes per hour | control-center's budget agent reads the Analytics API only, never an object; its one write path is the ops route (6.5) | code review, both repos |
| B9 | a cron in the Worker | an invocation per tick, for nothing | ≈ $0.01 per month at one a minute; a wake for nothing | no cron: expired codes are purged on the next insert, detection is control-center's (6.4) | config review |
| B10 | snapshot storms: each tab connect asks each hub | one incoming frame per hub per tab connect | 8 hubs × 50 tabs a day = 20 requests | snapshots are bounded (one frame per desk, 200 journal events); tab caps | T2 |

**C. Storage: what writes rows**

| # | Vector | Mechanism | Worst case, no guard | Guard | Detection, test |
|---|---|---|---|---|---|
| C1 | writing each pulse or event to the object's storage | $1 per million rows | 216 M rows per month at 1,000 users = $166; $1,660 at 10,000 | the object never touches `ctx.storage` (lint) | storage writes, control-center |
| C2 | `serializeAttachment` per message | each call persists the attachment | as C1 | the attachment is set once, at accept | code review |
| C3 | D1 writes per ping or per frame (`last_seen_at`) | $1 per million | 86 k per hub-month if written per ping | pings never reach code; `last_seen_at` on connect and disconnect only | D1 metrics |
| C4 | a journal mirror in D1 (history on the web) | one write per event | 21 M per month at 1,000 users (included), $160 at 10,000 | not in this RFC; a phase 3 decision with its own rows here | this table |
| C5 | R2 body storage (v1's design) | class A operations per body | gone with v1 | bodies stream through the relay; no R2 binding | config review |

**D. Logs and observability**

| # | Vector | Mechanism | Worst case, no guard | Guard | Detection, test |
|---|---|---|---|---|---|
| D1 | `console.log` per frame | $0.60 per million events past 20 M | 240 M events per month at 1,000 users = $132; $1,320 at 10,000 | `head_sampling_rate = 0.01`; logs on connect, close and error only; `no-console` in the object except `console.error` | T8 |
| D2 | Logpush, a tail Worker | per-GB and per-event charges | open-ended | not configured; `nextnode.toml` reviewed against this section | config review |
| D3 | Analytics Engine data points | $0.25 per million past 10 M | open-ended | not used | config review |
| D4 | OpenTelemetry export, traces | billed on Workers Paid since October 2026 | open-ended | not enabled | config review |
| D5 | invocation logs: one event per request, floods included | $0.60 per million events past 20 M, sampled | a 21.6 M-request flood hour at 1 % sampling, sustained: ≈ 155 M events per month = $81 | `invocation_logs = false`; a refusal writes no line; only accepted sockets log | T8 |

**E. Memory and cascading outages**

| # | Vector | Mechanism | Worst case, no guard | Guard | Detection, test |
|---|---|---|---|---|---|
| E1 | big relayed bodies held in memory | 128 MB per object; an overflow restarts the object and drops every socket, then a reconnect wave | an outage, then B3-shaped costs | 768 KiB chunks streamed, 32 MiB per response, 32 in flight: at most 32 chunks in memory | T5, `exceededMemory` in the metrics |
| E2 | socket count abuse: thousands of tabs | 32,768 sockets per object, memory per socket | an outage | 8 hubs and 32 tabs per user, `1013` beyond | T2 |
| E3 | a throwing handler | the runtime logs, the socket may stay in a bad state | log events (D1), confusion | every handler catches; a malformed frame closes its socket with `1003`; nothing else is touched | code review |
| E4 | a platform restart or eviction mid-relay | an in-flight relay keeps the object awake, so eviction cannot happen mid-relay; after a wake, a late `res` with an unknown id is dropped | none | the pending map is in memory only, by design | T4 |
| E5 | backpressure from a slow tab | outgoing frames queue in the runtime | memory in the object | coalescing at the hub bounds the rate (≤ 4 pulses per second per desk); the object never buffers | T5 |
| E6 | a Cloudflare incident | mass reconnects | one request per client per backoff step, capped at one a minute | the client policy (4.3) | T7 |

**F. Email and pairing**

| # | Vector | Mechanism | Worst case, no guard | Guard | Detection, test |
|---|---|---|---|---|---|
| F1 | a magic-link flood | Resend's per-email pricing and the sender's reputation | an unbounded Resend bill, a blocked domain | rate limiter binding: 3 per email per hour, 10 per IP per hour; a global daily cap of 2,000 in D1 `counters`; `429` beyond | D1 counter, Resend dashboard |
| F2 | device-code brute force | 8 characters from a 32-symbol alphabet | a stolen pairing | 10 min expiry, single use, 5 attempts per code then revoked, rate limited | rate limiter |
| F3 | a leaked hub token | one hub's socket | one hub impersonated until revoked | per-hub tokens, digests in D1, `bridge.json` 0600, revoke on the Hub page (`4001`) | Hub page |

**W. The web hub (mode 2, phase 3): rows written before the first line of code**

| # | Vector | Mechanism | Worst case, no guard | Guard | Detection, test |
|---|---|---|---|---|---|
| W1 | a storage write per frame or per pulse in the hub role | $1 per million rows | as C1 | the hub role writes per action only (a decision, a comment, a reload, a guide): ≈ 200 rows per user-day, 6 M per month at 1,000 users, included | storage writes, control-center |
| W2 | a parked request on the web hub (`await-send`) | a pending request keeps the object awake | $4.15 per parked agent-month | on a web hub every long wait is a hibernating socket (3.4); the Worker never parks | T11 |
| W3 | a hung GitHub call from the object | pending I/O, up to 15 min billed | 115 GB-s per occurrence | every GitHub fetch goes through one helper with a 10 s deadline and a 32 MiB cap; large diffs page through the API | T12 |
| W4 | a timer in core (the closed-desk grace, a TTL) | the object is never hibernation-eligible | $4.15 per object-month | core is timer-free by lint; grace and TTLs are deadlines compared on the next read | lint, T1 |
| W5 | polling GitHub for changes | requests and wakes per tick, GitHub's rate limit | $0.45 per thousand ticks, plus a locked-out token | webhooks (`push`, `pull_request`) into a Worker route, one request per push; no timer anywhere | config review |
| W6 | a big pull request held in memory | 128 MB per object | an outage (E1) | the same size limits as local (the 3,000-line desk rule), blobs fetched per file on demand | T12 |
| W7 | a costly wake: restoring every web desk from SQLite at each wake | rows read and ms per wake | 25 B rows included; ms × wakes | the hub role restores lazily: the registry row first, a desk only when a route names it | T13 |

**G. Platform behaviours that start loops**

| # | Behaviour | Consequence | Design answer |
|---|---|---|---|
| G1 | deploys close every object's sockets; hibernation does not protect them | a reconnect wave at every deploy | B4: jitter, low-traffic deploys, one a day at most |
| G2 | idle eviction keeps sockets open but wipes memory | code that assumes memory lost it | the object is stateless by design: attachments, snapshots on demand, the pending map only during an in-flight relay |
| G3 | the auto-response pair must be set in the constructor | a ping after a wake would otherwise wake the object | the constructor sets it unconditionally |
| G4 | the Paid plan has no spend cap; Cloudflare only alerts | nothing stops a runaway but us | 6.6: every dimension bounded by construction or by the two-stage breaker |
| G5 | the hibernation threshold (10 s of inactivity) is the runtime's, not ours | nothing to tune | eligibility is what we control (A11) |
| G6 | the 32 MiB cap on a received WebSocket message | a frame above it drops the socket | 1 MiB frames by contract |

**H. Human and process**

| # | Vector | Guard |
|---|---|---|
| H1 | enabling a paid feature in config (Logpush, 100 % logs, invocation logs, Queues, KV, a cron) | `nextnode.toml` and the Worker config diff are reviewed against this section; every new binding gets rows here first |
| H2 | testing against production (`wrangler dev --remote`, load tests) | staging is a second Worker on the same account, with its own D1 and objects and the same bounds; production tokens never reach a dev machine |
| H3 | ignoring the alert | control-center's budget agent trips the breaker itself (6.5); the Durable Objects billing page is read weekly |
| H4 | a paid plan with no cap | 6.6: every billable dimension has a hard bound, by construction or by the two-stage breaker; 6.2 gives the worst day |
| H5 | a dependency misbehaving inside the object (timers, fetches) | the object's bundle is `core`, `contracts` and the web adapters, nothing else; the bundle check fails on any other import, and the bridge lints apply to the whole bundle, core included |

### 6.2 Bounded exposure, everything wrong on the same day

At 1,000 users on Workers Paid, the worst day each vector can cost, with and without the guards:

| Vector | Worst day, no guard | With the guards |
|---|---|---|
| every object kept awake (A1, A2, A5) | $138 | ≈ $12: one hour to the alert, one hour to roll back |
| one hub flooding (B1) | $0.80 | $0.01 |
| one client reconnecting in a loop (B3) | $4 | $0 |
| a 1 B-request flood (B5) | $10 | ≈ $0.10 |
| storage per event (C1) | $5.50 | $0 |
| logs per frame (D1) | $4.40 | $0 |
| all of the above at once | ≈ $160 | ≈ $12 |

### 6.3 The rules, and what enforces each

| Rule | Enforced by |
|---|---|
| R1 only `ctx.acceptWebSocket()`; never `ws.accept()` | oxlint `no-restricted-syntax` in `apps/web/src/bridge/**`; T1 |
| R2 no timers, no alarms, no `waitUntil`, no `blockConcurrencyWhile` in the object | oxlint `no-restricted-globals` / `no-restricted-syntax`; T1 |
| R3 no outbound I/O in the switchboard role (no `fetch`, no stub, no binding call); in the hub role only the GitHub adapter's calls, each with a 10 s deadline and a size cap | oxlint in `bridge/**`; `adapters/github.ts` is the one file with `fetch`, through one helper; T12 |
| R4 no `ctx.storage` in the switchboard role; the hub role writes per action only, never per frame; attachments set once at accept | oxlint in `bridge/**`; code review; W1 |
| R5 the only stream is `relay.ts`: 768 KiB chunks, 32 MiB per response, 32 in flight, 30 s deadline | oxlint on `ReadableStream` / `TransformStream` outside `relay.ts`; T4, T5 |
| R6 rates per socket (100 frames/s, 2 MiB/s), caps per user (8 hubs, 32 tabs), tabs send pings only | `BRIDGE_LIMITS` in contracts; T2 |
| R7 the auto-response pair is the constructor's only work | code review; T1 |
| R8 no per-frame logging; `invocation_logs = false`; `head_sampling_rate ≤ 0.01`; `console.error` only on close and error of accepted sockets | oxlint `no-console`; config review; T8 |
| R9 the Worker authenticates before any object call, bounds bodies at 1 MiB, keeps `limits.cpu_ms = 50` | the router's order; T3 |
| R10 one WAF rate limiting rule on the app hostname; Bot Fight Mode on | zone config, checked by the deploy smoke |
| R11 detection lives in control-center: its budget agent reads the Analytics API only, never an object; its one write path is the ops route | code review, both repos |
| R12 the object's bundle is `core`, `contracts` and the web adapters, nothing else; the bridge lints apply to all of it; core is timer-free | the bundle check in CI; oxlint on core |

### 6.4 Detection: control-center's budget agent

Budget detection is not in `apps/web`. It is one of control-center's agents, which reads the
GraphQL Analytics API once an hour with an Analytics-read token held there, for the previous
hour: `durableObjectsPeriodicGroups` (active time, CPU time, storage write units,
exceeded-memory errors), `durableObjectsInvocationsAdaptiveGroups` (requests) and the Worker's
own request count (field names confirmed by introspection; the pricing page's "active time" is
the billed base). That read is the documented exception to the polling rule: Cloudflare pushes
no metric, so the agent re-asks on the slowest timer the exposure of 6.6 allows (one hour; a
15 min step divides the reaction-bounded lines by four). Cloudflare's billing notifications
("Usage Based Billing", where the plan offers them) are the second channel; they only alert.

What this RFC hands control-center: the thresholds below, the "connected users" base
(`GET /bridge/v1/ops/status`: hubs seen in the last day, the breaker's state), and its two
actions, both in 6.5: the ops route for the app stage, the Cloudflare API for the edge stage.
The agent never calls an object (B8) and never reads D1 directly.

| Signal | Budget per connected user and hour | Alert | Breaker (6.5) |
|---|---|---|---|
| object active time | 2 s (330 frames × 5 ms, plus relays) | > 20 s average | app stage: > 60 s average two hours running, or any single hour over 10,000 GB-s |
| object requests | 25 | > 250 | app stage: > 2,500 |
| storage write units | 0 | > 0 | app stage: > 1,000 |
| Worker requests | 10 | > 100 | edge stage: > 1,000, or any single hour over 5 M |
| exceeded-memory errors | 0 | > 0 | app stage: > 10 |

### 6.5 The breaker, two stages, and the runbook

**App stage.** The breaker is one D1 row (`breaker.tripped_at`, `reason`), set and cleared only
through `POST /bridge/v1/ops/breaker` (`{ "tripped": true | false, "reason" }`), a route the
Worker answers for control-center alone: `OPS_TOKEN` as a Bearer, compared in constant time
before anything else, `403` otherwise, rate limited by the WAF rule like every path, never a D1
read or an object call before the token matches. While the row is set:

- the Worker refuses every socket upgrade with `4029` (one D1 read per attempt; clients wait
  5 min);
- the ops call drains every object of the hubs seen in the last day: one `/drain` request per
  object (the one stub call, from the Worker) that closes every socket with `4029`; a drained,
  hibernation-eligible object costs nothing;
- relayed HTTP answers `503 HUB_OFFLINE`.

**Edge stage.** When Worker requests run away (B5), control-center creates a WAF custom rule
through the Cloudflare API: block every request to the app hostname except `/bridge/v1/ops/*`.
A request blocked at the edge is not a Worker request and is not billed; legitimate clients see
`403` on their upgrade and wait 5 min (4.3). The rule is deleted the same way.

Runbook, in order: (1) read control-center's alert: which signal, how far over, which stage it
set; (2) if the signal is active time and draining did not bring it down within one hour, the
objects are stuck by code: `wrangler rollback` to the previous version (a deploy restarts every
object, G1); (3) find the vector in 6.1, add the missing guard and its test, deploy; (4) clear
the stage through the same route or API; (5) add the incident to this section. The exposure
window is the agent's step plus the time to step (2).

### 6.6 The hard bounds, no exception: one account, the Paid plan

`apps/web` lives on the existing Cloudflare account, on the Paid plan, as `app.syneva.dev` on
the `syneva.dev` zone; staging is a second Worker on the same account with its own D1 and
objects. No Free tier: its daily caps fail operations at random hours, which is an outage, not
a budget. The Paid plan has no spend cap, so every bound below is ours, and "zero" means two
things: every billable dimension has a hard bound, by construction or by the breaker, and
nothing is paid for nothing.

| Dimension | Hard bound | Held by | Worst cost before the bound holds (1,000 users) | After |
|---|---|---|---|---|
| object duration | hibernation eligibility: R1 to R7 | lint, T1 on every change; the app stage | a bug that passes lint and T1: ≈ $12 (one hour to the alert, one to drain or roll back) | $0 |
| object requests | auth before any object call; `1008`, `1013`; 32 relays in flight | the Worker, the object | a compromised account reconnecting at the WAF rate: ≈ $0.01 per hour | $0 after revocation |
| Worker requests | the WAF rule per IP, Bot Fight Mode; the edge stage | the zone, control-center | a 1,000-IP flood that passes mitigation, one hour: ≈ $7 (21.6 M requests, plus CPU) | $0: blocked at the edge, not billed |
| Worker CPU | `limits.cpu_ms = 50`; bounded by requests | config | ≈ $0.40 in that same hour | $0 |
| D1 | one read per authenticated request; writes on login, pairing, connect, each rate limited | the Worker | ≈ $0.02 in that same hour | $0 |
| object storage | never written | lint (R4) | $0 | $0 |
| logs | `invocation_logs = false`, 1 % sampling, lines on accepted sockets only | config, lint (R8) | $0 during a flood: a refusal writes nothing | $0 |
| email | 3 per address per hour, 10 per IP, 2,000 per day | the rate limiter, the D1 counter | Resend's plan, never past 2,000 a day | $0 |
| assets, egress, outgoing frames, pings, auto-responses | free | Cloudflare | $0 | $0 |

Two lines are bounded by reaction rather than by construction: object duration if a bug passes
the lints and T1, and Worker requests during a flood. Their worst cost is one agent step, and
the step is control-center's to shorten. Everything else is zero by construction. And nothing
is paid for nothing: every billed line maps to a use, no product is enabled without rows in
6.1, the Paid plan's $5 minimum is the account's, not the app's, and an idle month (no hub, no
tab) bills exactly $0 above it.

### 6.7 The cost acceptance tests, phase 2 gate

All on the staging Worker (same account, its own D1 and objects), before the first user, and
T1 again on every change to the object's code:

- **T1 hibernation proof.** 50 hub sockets and 50 tab sockets connected for 30 min, pings
  only. The Analytics API reports under 5 s of total active time for the window (metrics lag:
  wait 10 min before reading).
- **T2 flood.** One hub socket at 1,000 frames per second: closed with `1008` within one
  second; the object's active time for that minute under 2 s. One tab sending a non-ping
  frame: closed with `1003`. The 9th hub and the 33rd tab of a user: `1013`.
- **T3 reconnect storm.** 100 connects per second from one IP for one minute: the edge answers
  `429` within 10 s; the Worker request count for the minute stays under 1,000.
- **T4 relay bounds.** A 40 MiB response: `err TOO_LARGE`, the tab gets 413. A hub that never
  answers: `504 HUB_TIMEOUT` at 30 s and the object idle right after. The 33rd concurrent relay:
  `429`. A hub closing mid-relay: `502`. No hub socket: `503` in under 50 ms.
- **T5 memory.** 32 concurrent 32 MiB responses streamed: no `exceededMemory` error, every
  socket still open after.
- **T6 breaker drill, app stage.** Set the row through the ops route: upgrades get `4029`,
  every object is drained, relays answer `503`; clients come back 5 min after the row is
  cleared the same way. A wrong or missing `OPS_TOKEN`: `403`, nothing touched.
- **T7 deploy drill.** A no-op deploy: every client reconnected within 60 s, no client with
  more than one attempt per backoff step.
- **T8 log volume.** One hour of T1 traffic produces fewer than 100 log events; T3's minute
  produces none.
- **T9 free pages.** Loading `/`, `/reviews` and `/d/<id>/` fifty times moves the Worker
  invocation count by at most the page-shell requests, never by the asset requests.
- **T10 breaker drill, edge stage.** Create the WAF block rule through the API: every request
  but `/bridge/v1/ops/*` gets `403` at the edge, the Worker's invocation count stops moving,
  clients back off 5 min and a trace shows at most one attempt per client per 5 min; delete
  the rule, everyone is back within the backoff window.
- **T11 agent socket (phase 3).** An agent attached to a web desk for 30 min, no review sent:
  under 1 s of active time for the window.
- **T12 GitHub bounds (phase 3).** A 50 MiB compare: paged or refused, never held whole; a
  GitHub endpoint that hangs: the object idle 10 s later, the desk marked "GitHub ne répond
  pas".
- **T13 wake cost (phase 3).** An object with 20 web desks: under 50 ms of CPU per wake, one
  registry read, no desk restored until a route names it.

## 7. Security and privacy

- **Isolation.** Every web route resolves a hub or a desk through the signed-in user's rows and
  the user's own object; there is no path from one user to another's hub. A hub socket is
  bound to its `hubId` by its attachment; a frame claiming another hub closes the socket.
- **Hub token.** 32 random bytes, stored as a sha256 digest, sent as a Bearer on the socket
  upgrade only, one per hub, revocable from the Hub page. Session cookies `HttpOnly`,
  `SameSite=Lax`, `Secure`; mutations keep the local hub's same-origin rule.
- **Path allowlist on both ends**, from `@syneva/contracts/routes`; the probe refuses anything
  else. A compromised Worker can make a hub do nothing a tab could not.
- **The in-process dispatch** skips the Host/Origin guard (the channel is authenticated) and
  keeps every per-route validation. It opens the editor, stages and resets exactly as a local
  tab does: the README says so in the same words as for `--key`.
- **Transit.** Frames cross the object in clear and are never stored: the object has no storage
  and the Worker keeps nothing but identity rows. Phase 3: end-to-end encryption of relayed
  bodies with a per-hub key held by the browser, the object switching ciphertext. No
  telemetry, as today.
- **The rate limiter** guards sign-in, pairing and the socket upgrades; the WAF rule guards the
  hostname.

## 8. Contract, schema, config

`packages/contracts/src/bridge.ts` (sketch):

```ts
export type HubIdentity = { id: string; name: string; version: string; instanceId: string; startedAt: string }

export type BridgeFrame =
  | { t: 'hello'; hub: HubIdentity }
  | { t: 'desk'; hubId: string; desk: DeskSummary }
  | { t: 'closed'; hubId: string; deskId: string }
  | { t: 'pulse'; hubId: string; deskId: string; pulse: PollPayload }
  | { t: 'journal'; hubId: string; events: HubEvent[] }
  | { t: 'snapshot-end'; hubId: string }
  | { t: 'hub'; hubId: string; name: string; online: boolean }
  | { t: 'snapshot?' }
  | { t: 'req'; id: string; method: 'GET' | 'POST' | 'DELETE'; path: string; query: string; body?: string }
  | { t: 'res'; id: string; status: number; headers: Record<string, string>; body?: string; more?: true }
  | { t: 'chunk'; id: string; data: string; more?: true }
  | { t: 'err'; id: string; code: 'HUB_TIMEOUT' | 'HUB_OFFLINE' | 'TOO_LARGE' | 'CANCELLED' }
  | { t: 'cancel'; id: string }
  | { t: 'p' }
  | { t: 'o' }

export const BRIDGE_PATHS = {
  deviceCode: '/bridge/v1/device/code',
  deviceToken: '/bridge/v1/device/token',
  hubSocket: '/bridge/v1/ws',
  tabSocket: '/api/hub/ws',
  opsBreaker: '/bridge/v1/ops/breaker',
  opsStatus: '/bridge/v1/ops/status',
} as const

export const BRIDGE_LIMITS = {
  frameBytes: 1_048_576,
  chunkBytes: 786_432,
  responseBytes: 33_554_432,
  requestBodyBytes: 1_048_576,
  inFlightPerUser: 32,
  deadlineMs: 30_000,
  framesPerSecond: 100,
  bytesPerSecond: 2_097_152,
  hubsPerUser: 8,
  tabsPerUser: 32,
  pingIntervalMs: 30_000,
  pongTimeoutMs: 10_000,
  coalesceMs: 250,
  journalTail: 200,
  journalPerFrame: 200,
  backoffMinMs: 1_000,
  backoffMaxMs: 60_000,
} as const

export const CLOSE_CODES = { malformed: 1003, rate: 1008, tooMany: 1013, revoked: 4001, saturated: 4029 } as const
```

D1 schema (`apps/web/migrations`), identity only:

```sql
users         (id, email, created_at)
sessions      (id_digest, user_id, expires_at)
login_codes   (code_digest, email, expires_at, attempts)
device_codes  (device_code_digest, user_code, hub_id, user_id, approved_at, expires_at, attempts)
hubs          (id, user_id, name, token_digest, version, created_at, last_seen_at, revoked_at)
user_settings (user_id, settings_json, updated_at)
breaker       (id, tripped_at, reason, cleared_at)
counters      (day, emails_sent)
```

Worker config (`nextnode.toml`, a second service beside the landing; the shape in wrangler terms):

```toml
name = "syneva-web"
compatibility_flags = ["nodejs_compat"]
[limits]
cpu_ms = 50
[observability.logs]
enabled = true
head_sampling_rate = 0.01
invocation_logs = false                # a refused request writes no line; only accepted sockets log
[assets]
directory = "./dist/assets"            # packages/frontend/dist: ui.js, dashboard.js, styles.css, fonts, shells
run_worker_first = ["/api/*", "/bridge/*", "/auth/*", "/d/*", "/login", "/logout"]
[[durable_objects.bindings]]
name = "USER_HUB"
class_name = "UserHub"
[[migrations]]
tag = "v1"
new_sqlite_classes = ["UserHub"]  # SQLite-backed, the current kind
[[d1_databases]]
binding = "DB"
[[unsafe.bindings]]
name = "RL_AUTH"
type = "ratelimit"
namespace_id = "1002"
simple = { limit = 10, period = 60 }
# no [triggers]: no cron (B9)
```

No KV, no R2, no Queues, no Logpush, no tail Worker, no Analytics Engine, no OTel export, no cron.
Secrets from the `syneva` Infisical project: `RESEND_API_KEY` (shared), `SESSION_SECRET`,
`OPS_TOKEN` (32 random bytes, held by control-center's budget agent; the Analytics-read token
lives in control-center, not here). Zone: one WAF rate limiting rule (60 requests per 10 s per
IP on `/api/*`, `/bridge/*`, `/auth/*`, block 10 min), Bot Fight Mode on; the breaker's edge
stage is a WAF custom rule control-center creates and deletes through the Cloudflare API (6.5).

Lint, `oxlint.config.ts` overrides for `apps/web/src/bridge/**` (each with its reason):
`no-restricted-globals` (`setTimeout`, `setInterval`, `queueMicrotask`, `fetch`),
`no-restricted-syntax` (`.accept(` on a WebSocket, `ctx.storage`, `.setAlarm(`, `.waitUntil(`,
`.blockConcurrencyWhile(`, `new ReadableStream`, `new TransformStream` outside `relay.ts`),
`no-console` (allow `error`), `no-restricted-imports` (anything but `@syneva/contracts`). The
hub role lives in `apps/web/src/hub/**` and imports `@syneva/core` and the web adapters; the
same `no-restricted-globals` rule (timers) applies there and to `packages/core`, and
`apps/web/src/adapters/github.ts` is the one file allowed `fetch` outside the Worker.

## 9. Frontend deltas

- `shared/api/stream.ts` (new): the WebSocket client of 4.3; `entities/hub/stream.ts` (new,
  replaces `poll.ts`): hubs, desks, pulses, journal keyed by `(hubId, seq)`; `app/poll.ts`
  removed; the desk tab reads its `pulse` from the stream.
- `entities/hub/model.ts`: `HubDesk.hub?: { id, name, isOnline }`; project grouping and the
  desk cards show the hub name when there is more than one; an offline hub gets its own tone.
- The New review dialog takes a hub picker on the web (hidden with one hub).
- Covers for `HUB_OFFLINE`, `HUB_TIMEOUT`, `1013` ("trop d'onglets"), `4029` ("service
  saturé"), `4001` (signed out).
- The Hub page shows the pairing (local: "connecté à syneva.dev en tant que …"; web: the hubs,
  their versions, last seen, revoke) and the stream state.
- Sign-in on the web is its own page (magic link), in the language of `pages.ts`.
- Nothing changes in the diff view, the render path, the guide pane or the agent loop.

## 10. Plan

Each phase ships on its own and ends with the hub smoke loop green (`AGENTS.md`, "Hub smoke").

- **Phase 0, push locally, no web.** `packages/core` and `packages/local`; the ports narrowed
  (3.2) and core timer-free, Workers-clean as a CI gate; the routes on the Fetch API with
  `node:http` adapted to them; `hub.subscribe()`; the `ws` upgrade route and `HubStream`; the
  frontend transport; the browser polls removed. Gate: the hub smoke, a `tsc` run of core under
  Workers types (no Node globals), plus a review that the only timers left in the frontend and
  in `local` are the ping, the coalescing, the backoff and the parked route's deadline.
- **Phase 1, the probe.** `contracts/bridge.ts`, `syneva login` / `logout`, the probe (frames,
  coalescing, web ids, the in-process dispatch with its caps, the reconnect policy), the Hub
  page's pairing state. Gate: the probe against a fake bridge (a Node `ws` server speaking the
  same frames) passes a frame-conformance check; T2 and T4 run against the fake.
- **Phase 2, the web.** `apps/web`: the Worker, the object, D1, the breaker and its ops route,
  the WAF rule, the config of section 8, the staging Worker; the thresholds of 6.4 handed to
  control-center, whose budget agent is live before the first user. Gate: the web smoke (pair a
  scratch hub, open a desk on the web, send a round, read the journal on both sides, revoke)
  and T1 to T10 green on staging. First sign-ins after that only.
- **Phase 3, the rest.** The web hub, mode 2 (3.4): GitHub OAuth, the web adapters, the
  webhook route, the agent socket in `spec.ts`, W1 to W7 guarded and T11 to T13 green; then
  end-to-end encrypted relay bodies, sandbox hubs of ours, and, each with its own rows in 6.1
  before a line is written: history past the hubs (C4), offline read-only desks. SSE from the
  object: never (A5).

Untouched throughout: `syneva spec`, the desk routes and their codes, the review files, the
journal file, the local workflow without an account, the agents' `await-send`.

## 11. Open questions

1. Decided (phase 0): `ws`, bundled into the CLI, is the local hub's one new dependency.
2. Sign-in: magic link only at first (Resend is wired), GitHub OAuth later if PR desks want it.
3. Decided (phase 0): `packages/core` and `packages/local`; `backend` is gone.
4. Whether `node:path` in core should become a posix-only helper now or when the first Windows
   hub pairs.
5. The outline on Workers: `oxc-parser`'s wasm build if it runs there, else headings only for
   web desks until it does.

## 12. Implementation notes (phases 0 to 2)

What shipped differs from the sections above in the points below. Each is the implementation's
choice, recorded here so this RFC stays the reference and the code the truth; `apps/web/AGENTS.md`
holds the web's list with the rule each point serves.

### 12.1 Contract additions (section 8)

- `BridgeFrame` gained `plan` (a plan record created or changed: the dashboard read the plan
  library on a timer, the stream replaces that read too) and `pairing` (the local hub tells its
  own tabs where its probe stands; a probe never sends it to the web). The `hub` frame carries
  `version` and `lastSeenAt` from the web's rows, one per paired hub when a tab connects, offline
  hubs included (the Worker hands the object the person's hubs with the upgrade: the object
  stores nothing).
- `RelayFailure` gained `TOO_MANY` (the hub's side of `inFlightPerUser`: the tab gets 429);
  `RELAY_FAILURE_STATUS` fixes the status per failure (`HUB_OFFLINE` 503, `HUB_TIMEOUT` 504,
  `TOO_LARGE` 413, `TOO_MANY` 429, a hub socket closing mid-answer 502).
- `BRIDGE_PATHS.hubRevoke`: `DELETE /bridge/v1/hub` with the hub's token, `syneva logout`'s
  revocation. `BRIDGE_LIMITS` gained `rateWaitMs`, `tooManyWaitMs` and `saturatedWaitMs` (4.3's
  waits as constants); `CLOSE_CODES` gained `normal` (1000) and `goingAway` (1001).
- `WEB_HUB_HEADER` (`x-syneva-hub`): the hub a relayed hub-level request goes to when its path
  names no web id (`POST /api/hub/desks`, `POST /api/hub/inventory`, `GET /api/hub/plans`).
- `contracts/web.ts`: the web's own routes and shapes. `WEB_PATHS.login` and `logout` (the hub
  paths), `magicLink` (`POST /auth/magic-link`), `authCallback` (`GET /auth/callback?token=`),
  `device` (`GET`/`POST /device`, the page `syneva login` sends the person to), `me`
  (`GET /api/web/me`), `hubs` (`GET /api/web/hubs`, `DELETE /api/web/hubs/<hubId>`); the session
  cookie's name, 30 days; a link's 15 minutes.
- `DeskCapabilities { staging }` (`contracts/browser.ts`) and `409 STAGING_DISABLED`: a desk whose
  git port has no staging tier (a PR desk today, a web desk in phase 3) says so to the tab instead
  of failing the action. All three staging routes (`/stage`, `/stage-change`, `/unstage`) refuse
  on it, and the tab approves as a verdict only and restores no index on a reset; a repo or file
  desk's read on a hub without a working tree answers `409 NO_WORKING_TREE`, not a 500.
- Core's router takes a `RequestChannel`: `direct`, or `relayed-over-pairing` for a request the
  probe dispatches, which skips the Host/Origin and access guards (section 7's in-process
  dispatch). The channel stays on every route's `HubRequest`: the routes that act for the machine
  itself read it to narrow what the web may do (12.2).
- `PartialDeskPulse` (`bridge.ts`: `DeskPulseHead` and `partial: { digest }`) and `API_PATHS.pulse`
  (`GET /api/desks/<id>/pulse`). A pulse is the one frame whose size the review sets (the guide,
  the conversation), and 4.4 bounds every frame at 1 MiB: a pulse whose whole frame would pass
  `frameBytes` travels as the part that does not grow with the review and a digest of the rest,
  which moves whenever a part left out moves, and the tab reads the whole pulse at `/pulse` when
  the digest is not the one it last read. Before it, such a desk went unheard, or closed its
  readers' sockets.
- `SnapshotTag`: `snapshot?` may carry a `tag` (at most `BRIDGE_LIMITS.snapshotTagChars`, 64), and
  the hub echoes it on every frame of that snapshot while its live stream goes on untagged; the
  object hands a tagged frame to the one tab it names (12.3). A `snapshot?` without a tag is 4.4's.
  `hubs-end` closes the cards the object sends a tab first (the person's hubs, online or not).
- `BRIDGE_LIMITS.silenceMs` (70 s: two pings and the pong deadline, a background tab's timers being
  throttled to once a minute) and `bufferedBytes` (8 MiB), with `CLOSE_CODES.silent` (4008) and
  `slow` (4010); a client reconnects after either with the normal backoff (12.2).
- `TOO_MANY_STATUS` (409): the web's answer to an upgrade past `hubsPerUser` or `tabsPerUser`, where
  6.3 R6 closes the socket with 1013 (12.3); a `hub` frame's `refusedAt` tells the open tabs that
  hub was turned away for it.
- `contracts/ops.ts` and `BRIDGE_PATHS.opsDrain` (`POST /bridge/v1/ops/drain`): the breaker's
  drain a page at a time, as control-center follows it (12.3).
- `contracts/settings.ts`: the settings payload and `MACHINE_SETTINGS` (`editorCommand`), the keys a
  relayed settings request neither reads nor writes; `contracts/relay.ts` lists neither settings
  route (12.2).
- Pairing and sign-in: the token ask may answer 429 `SLOW_DOWN` (RFC 8628, 3.5);
  `DeviceApprovalRequest.confirm`, the device page's proof, without which an approval is 403
  `DEVICE_UNCONFIRMED`; `GET /auth/callback` is a page that changes nothing, the token taken by
  its same-origin `POST` (12.3).
- Error codes beside those: local's Node adapter answers a method no Fetch `Request` can carry
  (TRACE, TRACK) `405 METHOD_NOT_ALLOWED` and a target or header the Fetch API refuses `400
  MALFORMED_REQUEST`, in the hub's error shape; a relayed open may be refused `403 NOT_SERVED` or
  `403 PR_LOCAL_ONLY`, a relayed `/open-editor` `EDITOR_LOCAL_ONLY` (12.2); the web adds `409
  NOT_TRIPPED` (a drain while the breaker is clear) and `TOO_MANY_TABS` beside `TOO_MANY_HUBS`.

### 12.2 Phase 0 and 1 choices

- The Node adapter (phase 0) runs a route's `afterSent` work once node:http is done with the
  response, handed over whole or abandoned by a client gone first: a route that returned has
  committed what its answer announces (a Send recorded, a close accepted), so a reviewer whose tab
  left before the ack still wakes the agent. It drains a request body no route read, so a
  connection is never held by it, and refuses what the Fetch API cannot carry in the hub's error
  shape instead of failing on the socket; an upgrade's raw socket keeps an error listener for its
  life, so a client resetting it while the hub writes its refusal never takes the hub down.
- The local stream bounds its readers, as the object bounds its sockets: a reader that leaves more
  than `bufferedBytes` unread is closed with `slow` (live frames queue only once the snapshot is
  written out, so a snapshot alone, whatever its size, closes no one), and a socket silent past
  `silenceMs` with `silent`, so a laptop asleep or a link dropped half-open holds neither its
  subscription nor a seat among `tabsPerUser`. A tab that comes back reads a fresh snapshot, which
  says the latest state once instead of every step it missed. The tab's transport starts its
  backoff over only once a socket has held (it read what it is sent first whole, then answered a
  ping), not at every hello: a hub that says hello and drops every socket kept its tabs
  reconnecting about once a second.
- The probe refuses a `req` whose path `contracts/relay.ts` does not list (`404 NOT_RELAYED`) or
  that does not read as itself (`400 MALFORMED_RELAY`), and never refuses a body for its size: the
  Worker bounds bodies at `requestBodyBytes` before relaying (R9). A relayed route's `afterSent`
  work runs when the relay ends, whether its answer went or not (a cancel, the hub's socket
  closing, an answer past `responseBytes`), as under node:http; a relay keeps its
  `inFlightPerUser` slot, shared by the pairing's sockets, until its route has answered, cancelled
  or not, since routes do not stop on an abort.
- The in-process dispatch is narrowed (section 7): the allowlist is not the only line between the
  web account and the machine, whose trust boundary for a relayed request is the account. The
  routes that act for the machine itself read the channel. The hub's settings and a desk's
  `/settings` are never relayed (the Worker answers both from D1, as 4.7 says of the hub's), and
  core's settings routes keep `MACHINE_SETTINGS` from a relayed request anyway: the hub runs its
  `editorCommand` as a program, which whoever holds the web account must never choose.
  `/open-editor` launches only the editor the machine set, never the OS opener (which runs
  whatever the file's type names): `EDITOR_LOCAL_ONLY`. An open names the root of a live desk on
  the hub and paths that resolve inside it, symlinks followed (`NOT_SERVED`), and never a PR, which
  checks out in the machine's working tree and runs its hooks (`PR_LOCAL_ONLY`). Every relayed
  request but a GET leaves a line in the hub's log: method, path, status, the hub-side desk id,
  never a body.
- Pairing: `syneva login --web` takes an `https` origin only, `http` on loopback alone (`wrangler
  dev`). The CLI asks for its token as RFC 8628 (3.5) says: an ask under the interval answers 429
  `SLOW_DOWN` and the CLI adds 5 s to its interval for the rest of the login; a web that does not
  answer, or fails (5xx), is asked again after a wait that doubles, until the code's lifetime
  ends.
- `SYNEVA_BRIDGE_WAIT_SCALE` (test-only) scales the probe's waits for `test/bridge`'s conformance
  check; unset, the waits are 4.3's.
- `test/bridge/fake-bridge.mjs` is the probe's oracle (the pairing routes, both sockets, the relay,
  the test-only controls); it sends `hub` frames for connected hubs only and never the two row
  fields, so the browser tolerates their absence.

### 12.3 Phase 2 choices (`apps/web`)

The Worker and the object:

- The breaker (6.5) refuses an upgrade with HTTP 503 `SATURATED` before any object call, not with
  close code 4029 on the upgrade: a close code needs an accepted socket, which is an object call.
  Clients read a 503 on an upgrade as 4029 (five minutes). The drained objects close their sockets
  with 4029; a relay while tripped answers 503 `HUB_OFFLINE`. The drain reaches every user's object
  (bounded by the user count), not only the hubs seen in the last day: a tab may be open with no
  hub online. It goes a page at a time, at most 100 objects per ops call (`contracts/ops.ts`): the
  call that trips the breaker drains the first page and answers a cursor, and control-center asks
  for each next page (a failed one again with the same cursor; draining an object twice closes
  nothing more). One call draining every object would outgrow a Worker invocation as the users
  grow, and a call cut short could not go on; nothing is queued or scheduled.
- The tab's socket meets every refusal before its upgrade is required: a browser's WebSocket never
  says why an upgrade failed, so the tab asks with a plain GET of the same path, which hears the
  session's 401, the limiter's 429 and the breaker's 503 as the upgrade would, and 426 only past
  them.
- The relay's deadline is the Worker's (`AbortSignal.timeout` on its call into the object; the
  object has no timer, R2): on the deadline the Worker asks the object to `cancel` the hub's side
  if no answer started, then answers 504. Inside the object, a reader more than two chunks behind
  cuts its relay (no buffering past about 1.1 MiB per relay), and a relay the Worker never
  cancelled is dropped at twice the deadline, compared on the object's next event.
- Relayed answers keep a header allowlist (`content-type`, `cache-control`, `etag`,
  `last-modified`, `content-disposition`, `vary`), never a cookie, and gain
  `content-security-policy: default-src 'none'; sandbox` and `x-content-type-options: nosniff`:
  a hub's bytes (a `/blob` SVG) are served on the web's origin.
- The sign-in limits of 6.1 F1 are per client per hour, and per network and in all per day (50
  links a network, 2,000 in all), in D1 (a rate-limit binding counts over 10 or 60 seconds only),
  the day's quota reserved atomically. A client is an IPv4 address or an IPv6 /64, a network an
  IPv4 address or an IPv6 /48: a device holds a whole /64, so rotating the addresses of a prefix
  buys nothing, and draining the day takes forty networks, not one client. The `RL_AUTH` binding
  holds 10 per minute per client on the magic link and the device code, per person on the device
  page and per hub on the hub's upgrade. The tab's upgrade has its own binding, `RL_TABS`, 60 per
  minute per person: RL_AUTH's ten would refuse a person's tabs reconnecting together after a
  deploy (B4, up to 32), and sixty still hold a reconnect loop to one a second.
  `POST /bridge/v1/device/token` polled under its interval answers 429 `SLOW_DOWN`; a code pairs
  once (410 after).
- The sign-in link changes nothing on its GET, which a mail scanner fetches at will: `GET
  /auth/callback` is a page naming the account the link signs in as, its one button a same-origin
  POST that takes the token, once, within 15 minutes and five tries.
- The device page names the hub (its name, its CLI version) and the account it would pair to,
  with a sign-out for the wrong one, and approves only from itself: its Approve carries a proof,
  an HMAC of the session's digest and the code under `SESSION_SECRET`, without which an approval
  is 403 `DEVICE_UNCONFIRMED`. The hub's token (4.2, step 2) is drawn when the CLI takes its
  approved code, not at the approval, and the hub's row is written then with its sha256: no token
  is ever stored, not even between the two.
- Sessions: a random id in the cookie, kept as its HMAC-SHA256 under `SESSION_SECRET`, so a
  database dump alone forges nothing. A page shell is served on a cookie that merely looks present
  (no D1 read per navigation); the first API call says 401. `GET /logout` is a confirmation page,
  the sign-out itself a same-origin POST.
- Additions: at most 32 hubs per account, paired or approved and not yet taken, checked inside the
  approval's transaction (409 `TOO_MANY_HUBS`; 8 of them connect at once, `hubsPerUser`, since a
  paired machine is often off); a hub's name cut to 64 characters; settings capped at 64 KiB;
  `lastSeenAt` is the hub's last connect (the object writes nothing on close, R3), written after
  the answer and only for a socket the object accepted; `instanceId` in the web's health is a
  build-time constant.
- The connected caps (6.3 R6): past 8 hubs or 32 tabs connected, the object accepts no socket and
  answers the upgrade 409 (`TOO_MANY_STATUS`; the Worker says `TOO_MANY_HUBS` or
  `TOO_MANY_TABS`), not an accepted socket closed with 1013. Under workerd a close the object
  issues as it accepts a socket never reaches the client, which reads it open, then nothing, not
  even a pong. The probe waits 60 s after a 409, as after 1013, and says the account has too many
  hubs connected; a browser's WebSocket reads no status, so a tab past its cap backs off as after
  any refused upgrade. A refused hub costs one object request, no socket and no D1 write, and
  never reads as connected; at each refusal the open tabs get its `hub` frame, offline, with
  `refusedAt`, which the object keeps nowhere.
- A connecting tab's snapshot goes to that tab alone (6.1 B10): its `snapshot?` carries the tab's
  socket id as its `tag`, the object hands each tagged frame to that tab (to none once it closed)
  and every untagged one to all; a tag that does not read closes the hub's socket with 1003.
- One D1 read per request past the guards: the session's read carries what the route opens (the
  person's hubs and the breaker for the tab's socket, the hub it names and the breaker for a
  relay), where a relay took three round trips.
- The Worker's own pages (sign-in, sign-out, the device page, not found) go out under one policy:
  `default-src 'none'`, the page's one inline sheet by its hash, no script, `form-action 'self'`,
  `frame-ancestors 'none'`, `base-uri 'none'`, with `x-frame-options: DENY`, `nosniff` and
  `referrer-policy: no-referrer` (a sign-in token never leaves in a `Referer`). The frontend's
  shells get `frame-ancestors 'none'`, `DENY` and `nosniff`: no other site frames a page whose
  buttons act on a machine.
- A relay that fails after its head (a hub streaming past `responseBytes`, which a probe never
  does, or a hub socket closing mid-answer) ends as a cut body after its 200, not 4.5's 413 or
  502: the head goes out with the hub's first frame, and a status that waited for the size or the
  end would hold the answer whole (R5). The 413 is the probe's own `err TOO_LARGE`, sent before
  any head; the 502 a hub socket closing before its head.
- Lint (6.3): oxlint has no `no-restricted-syntax`, so R1, R2 and R4 are held by
  `no-restricted-properties` on the property names. R8: `console.error` on a socket's error only,
  not on every close. R12: the object's bundle is contracts only until the hub role joins it.
- The page shells sit under `/_shell/` in the assets, so a dashboard path or `/d/<id>/` never
  matches an asset first and the Worker is correct with or without `assets.run_worker_first`
  (the pipeline's generator emits none, 12.4).

The browser (section 9):

- Web mode is read from the stream, never from the page: a `hub` frame or a web hub id makes the
  page `web`, a hello from `LOCAL_HUB_ID` makes it `local`; the health is read once on the web,
  at `hubs-end` when no hub is online. A 403, 429 or 503 on the upgrade's probe waits
  `saturatedWaitMs`, as 4029 does and as the probe waits.
- No read re-asks on a timer: a read the hub left unanswered tries again when the hub next
  answers, at its next hello or at the first frame of its stream past the read's backoff
  deadline, compared when the frame comes. A partial pulse is read whole at `/pulse` when its
  digest moves.
- A web stream's snapshots are kept per hub, so one hub's `snapshot-end` replaces that hub's desks,
  pulses, plans and journal alone, and a desk's closed cover waits for its own hub's; a person
  without a paired hub, or with all of them offline, reads an empty, settled listing at
  `hubs-end`. A hub the web no longer lists leaves the page with everything it held of it: at once
  when this page revoked it, at the next connect's `hubs-end` when it was revoked elsewhere. A hub
  turned away at the connected cap reads "waiting" rather than offline.
- Relay failures are non-blocking strips over the desk (`HUB_OFFLINE`, `HUB_TIMEOUT`: the hub
  cannot be reached now) or toasts (`TOO_MANY`, `TOO_LARGE`: the hub is fine), under the existing
  refresh and sign-in covers. Nothing retries on its own. The strip follows the newest word on the
  hub: a refusal shaped before the hub came back never outlives it.
- What the hub keeps for its machine is not offered from the web: New review has no PR source and
  reads `NOT_SERVED` and `PR_LOCAL_ONLY` with what to do instead, the desk's settings lock the
  editor command, and an editor refusal shows the hub's own sentence.
- Only `POST /api/hub/desks` carries `WEB_HUB_HEADER` (the New review dialog's pick; no browser
  caller of `/api/hub/inventory` exists). Project ids are scoped per hub in the browser
  (`<hubId><projectId>`, `entities/hub/hub-ids.ts`): the probe scopes desks and plans, not
  projects, and two laptops can hold a repository at the same path.
- The journal's freshness marker is a page ordinal, not a hub's `seq` (seqs of different hubs do
  not compare); the feed keys on `(hubId, seq)` as 4.8 says.
- The Hub page's web side lists the hubs (name, CLI version, online or last connect, revoke) and
  who is signed in, with a sign-out form; the pairing section stays the local page's. The UI's
  copy is English, as the rest of it.

### 12.4 The deploy pipeline

`NextNodeSolutions/core`'s `deploy.yml` generates each Worker's wrangler config from the root
`nextnode.toml` and supports D1 (one database per project, one migrations folder), KV, R2,
queues, rate limiters, limits, assets (the directory derived from the entry, no
`run_worker_first`), `observability.enabled` and routes, but no Durable Object binding or
migration, no `observability.logs` settings and no D1 per service. `apps/web` therefore ships its
own `wrangler.jsonc` (the Worker's complete config: local development today, what a deploy would
use) and no `[deploy.services]` entry; `apps/web/AGENTS.md` ("Deploy: what the pipeline must
learn") lists the fields the pipeline must gain before CI deploys it. Nothing is deployed; the
staging Worker and T1 to T10 on it (6.7) wait for that.

### 12.5 What checks it

`test/stream/conformance.mjs` (the local stream, frame by frame), `test/bridge/conformance.mjs`
(the probe against the fake bridge, T2 and T4 on the hub's side, and what the web may not do on
the machine: its settings, its editor, the folders an open names, the relay's log),
`test/web/smoke.mjs` (the Worker under `wrangler dev` with the CLI and a scratch hub: sign-in,
pairing, the tab's socket, the relay, revocation, logout, the connected cap, the breaker,
sign-out) and `test/web/cost/run.mjs` (6.7's tests: T2, T4, T5 and T6 run whole under `wrangler
dev`, T1, T3, T8 and T9 as local dry runs, T7 against a dev restart; with `--staging <origin>`
each runs what a deployed Worker takes and prints what a person completes there: the Analytics
reads, the WAF rule, a deploy, T10's edge drill), all documented in their folder's README. The
stream's check also covers a pulse past `frameBytes`, a slow reader, a silent socket and upgrades
reset while the hub refuses them.

Three cost tests depart from 6.7: T2 checks the connected caps' 409 (12.3) where 6.7 expects
1013, T4 checks the cut body after a 200 (12.3) where 6.7 expects a 413 or a 502 once the head is
out, and T5 runs scaled on `wrangler dev` (8 relays of 8 MiB,
byte-exact; `--full` is 6.7's 32 of 32 MiB, for staging): an account's 8 hub sockets at 2 MiB/s
cannot carry 32 answers of 32 MiB within the 30 s deadline, and `wrangler dev` has neither a
memory limit to exceed nor an `exceededMemory` count to read.
