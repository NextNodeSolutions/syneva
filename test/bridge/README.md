# Bridge conformance

The probe (RFC 0001, phase 1) checked against a fake bridge: what a paired hub sends up its one
outbound socket, how it answers the web's relayed requests, and what it does on every close.
`fake-bridge.mjs` stands in for the web's bridge (section 4): the pairing endpoints, the hub and
tab sockets, the HTTP relay, and test-only controls. `conformance.mjs` starts it in process, runs
its own scratch hubs from the CLI build and pairs one with `syneva login`. The frames, limits and
close codes come from `packages/contracts/src/bridge.ts`, read from its build, so run
`pnpm build` first.

```bash
node test/bridge/conformance.mjs
```

It uses a scratch `HOME` of its own (its hubs read that HOME's `bridge.json` and hub lock, never
the machine's; a failed run keeps it, with the hubs' logs, a green one removes it), the hub port
47982 and the fake's port 47981 (`--port` and `--bridge-port` name others), a temporary git repo
for its desks, and `apps/syneva/dist/cli.js` (`--cli` names another build). It prints one line
per check and exits 1 when any failed; a run takes about a minute, most of it the client policy's
waits. `ws` is resolved from `packages/local`, which bundles it into the CLI.

The fake alone, to pair a hub by hand: `node test/bridge/fake-bridge.mjs --port 47981`, then
`syneva login --web http://127.0.0.1:47981 --no-open` and approve the code it prints with
`curl -X POST localhost:47981/__approve -d '{"userCode":"<code>"}'`.

## The fake bridge

One user, everything in memory. As the web: `POST /bridge/v1/device/code` and
`/bridge/v1/device/token` (interval 1 s, the web's is 5), `DELETE /bridge/v1/hub` (the Bearer
token revoked, its socket closed with 4001), the hub socket `GET /bridge/v1/ws` (the Bearer
checked, 401 when unknown or revoked; past `hubsPerUser`, 1013), the tab socket `GET /api/hub/ws`
(a `hub` frame per connected hub, `snapshot?` to each), and the relay: any other request under
`/api/` goes to the hub its web id names (or the `x-syneva-hub` header) as one `req`, its `res` and
`chunk` frames streamed back as they come; no hub socket answers 503, past `inFlightPerUser` 429,
the deadline 504 with a `cancel`, a client gone first a `cancel`. A hub's stream frames must carry
its hub id and are forwarded verbatim to the tabs; a token bucket per hub socket (the object's)
closes it with 1008 past `framesPerSecond` or `bytesPerSecond`; pings get their pong outside it.
Every frame is recorded with its size and arrival time.

Test-only controls: `POST /__approve { userCode, deny? }`, `POST /__close { hubId, code, reason? }`,
`POST /__refuse { status }` (every hub upgrade refused with it; 0 lifts it),
`POST /__silence { hubId, silent? }` (pings go unanswered), `GET /__state`.

## What it checks

- **A hub without a pairing** runs as before: its health answers, its stream says
  `pairing { paired: false }`, it never opens a socket. Checked on the first hub and again on a
  hub started after `logout`.
- **Login**: a denied code and an unreachable web exit 1 naming the cause; the code and its URL
  are printed, approving it writes `bridge.json` mode 0600 with the web, hub id, token, name and
  pairing time, and the running hub connects at once (`login` says so) with the token.
- **Stream**: a tab's snapshot starts with `hello` naming the web hub id and the hub's identity;
  every frame names the web hub id. The CLI's and the reviewer's actions (open, open plan, a plan
  status, comment, ask, await, send, reload, close; the reviewer's through the relay) raise their
  `desk`, `pulse`, `journal`, `plan` and `closed` frames with web ids (`<hubId><localId>`, desk
  pages `/d/<web id>/`). `snapshot?` answers `hello` and a snapshot whose desks and plans are
  the local routes' with web ids. A second tab's tail deduplicates by `(hubId, seq)`. The hub's
  own stream keeps local ids, and no `pairing` frame ever goes to the web.
- **Relay**: `/state` through the bridge is the local `/state`; a POSTed comment lands; `/blob`
  bytes and type are the local ones; a 3 MiB answer is `res { more }` then chunks of at most
  `chunkBytes` of base64, every frame under `frameBytes`, whole once reassembled; a 40 MiB one
  is one `err TOO_LARGE` (413 at the tab); `POST /api/hub/desks`, `DELETE /api/hub/desks/<id>`
  and `GET /api/hub/plans` answer with web ids.
- **Refusals and bounds**: `/poll`, `/await-send`, `/api/hub/shutdown`, `/api/hub/ws`, `/login`,
  the pairing route, the desk list, a page, another hub's desk and a dot-segment path answer
  `404 NOT_RELAYED` at once, never dispatched (the hub still runs); a `req` that does not read
  answers 400; a cancel stops the answer's frames and the hub answers the next relay; with
  `inFlightPerUser` relays streaming, the next is `err TOO_MANY`. A relay cancelled while its
  route still runs (a `/blob` read of a FIFO the check writes to later) keeps its slot, so one of
  the next `inFlightPerUser` is `err TOO_MANY`; once its route settles it sends nothing, and its
  slot is free again.
- **The machine's own** (RFC 0001, section 7: the web may review the code of the repositories
  the hub serves, nothing more): a relayed `GET /settings` leaves the editor command out; a
  relayed `POST /settings` changes the display preferences and keeps the machine's editor
  command, a body that is no object included. A relayed `/open-editor` is `422 EDITOR_LOCAL_ONLY`
  when the machine sets no editor or the OS opener, and `400 BAD_PATH` on a symlink out of the
  repo; a template whose program is a placeholder is `422 BAD_EDITOR_COMMAND`, locally too.
  Nothing is launched: every case is refused first. A relayed open of another repository, of the
  filesystem's root, of a file outside the served repo (directly or through a symlink), of a repo
  scope outside it, and the inventory of another repository are `403 NOT_SERVED`; a relayed pr open
  is `403 PR_LOCAL_ONLY`; a file inside the served repo still opens from the web, and the machine
  still opens the other repository itself.
- **The hub's log**: every relayed request but a GET left one line in the hub's log, by its path
  as the hub read it, its status and code, and the hub-side id of the desk it acted on (a
  comment, a settings write, an open by the desk it opened, a refused open, a path never relayed);
  no GET has a line, and the relayed comment's words appear nowhere in the log.
- **Limits**: 50 CLI comments in a busy loop all reach the web; over the whole run no second at
  the fake held more than `framesPerSecond` frames or `bytesPerSecond` bytes, and the bucket
  never closed the socket.
- **Stop and restart**: the hub stopping closes its socket with 1000; the next start reads
  `bridge.json` and connects with no login, its `hello` naming the new instance.
- **Client policy**, on a hub started with `SYNEVA_BRIDGE_WAIT_SCALE=0.01` (test-only: it scales
  the reconnect waits, the ping interval and the pong deadline; unset they are the RFC's): a ping
  every interval; a silent web dropped at the pong deadline, said on the Hub page, reconnected;
  1008, 1013 and 4029 wait 30 s, 60 s and 5 min; another code backs off under 60 s; an upgrade
  refused with 403, 429 or 503 waits 5 min; 4001 and a 401 upgrade stop the probe (said on the
  Hub page, no attempt since) until `POST /api/hub/bridge/reconnect` starts it again.
- **Logout**: exit 0; the fake saw `DELETE /bridge/v1/hub` with the token; `bridge.json` is gone;
  the hub's tabs read `paired: false`; no attempt since.
