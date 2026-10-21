# Stream conformance

The hub's stream (`GET /api/hub/ws`, RFC 0001 section 4) checked frame by frame against a running
hub: what a tab reads on connect, what the hub pushes when an agent and a reviewer act on a desk,
and the bounds the bridge fixes. The frames, limits and close codes come from
`packages/contracts/src/bridge.ts`, read from its build, so run `pnpm build` first.

```bash
HOME=$(mktemp -d) node apps/syneva/dist/cli.js start --port 47961 --no-open &
node test/stream/conformance.mjs --hub http://127.0.0.1:47961 --shutdown

HOME=$(mktemp -d) node apps/syneva/dist/cli.js start --port 47962 --key s3cret --no-open &
node test/stream/conformance.mjs --hub http://127.0.0.1:47962 --key s3cret --shutdown
```

Point it at a scratch hub, never the machine's own (port 4747): it opens and closes desks of its
own (sessions `stream-check` and `stream-check-plan`, in a temporary git repo), archives the plan
it opens, opens `tabsPerUser` sockets at once, and with `--shutdown` stops the hub at the end. A
tab already reading that hub counts against the socket cap, so keep none open. `--cli` names
another CLI build (default `apps/syneva/dist/cli.js`); `--key` is the hub's access key, sent as a
Bearer (and to the CLI as `SYNEVA_KEY`). `ws` is resolved from `packages/local`, which serves the
stream with it.

It prints one line per check and exits 1 when any failed.

## What it checks

- **Guards**: the upgrade passes the guards every route passes. A cross-site `Origin` or a foreign
  `Host` reads 403, another path 404, the hub's own origin opens. On a keyed hub, no key and a wrong
  Bearer read 401; the Bearer and the cookie `/login` sets both open.
- **Snapshot**, on connect and again after the events: `hello` first (the hub's id, `local`, and
  the identity `/api/hub/health` reports), one `desk` then one `pulse` per live desk, the journal
  tail, every plan, `snapshot-end`, every frame naming the hub and under `frameBytes`. Each part
  equals its HTTP route read at the same moment: `/api/hub/desks`, each desk's `/poll` (and
  `/state`'s instance id), `/api/hub/journal`, `/api/hub/plans`.
- **Events**, on the first reader as the CLI and the desk's API drive a round: `open` (a `desk`, its
  `pulse`, a `desk-opened` entry), `open plan` (the desk naming its plan, the plan's `plan` frame, a
  status change's), `comment` (`agent-replied`, a pulse with the comment), the reviewer's ask
  (`question-asked`, a queued question) and the agent's `await`, a Send (`round-sent`, a queued
  review) and its `await` (`round-picked`), `reload` (`desk-reloaded`, a `desk`, a `pulse`),
  `close` (`closed`, `desk-closed`). Once quiet, the last `desk`, `pulse` and `plan` frames equal
  the routes; every journal event since the snapshot came once, in seq order; every frame names the
  hub; per desk, `desk` and `pulse` frames are at least `coalesceMs` apart.
- **Deduplication**: a second reader's journal tail shares its `(hubId, seq)` keys with the first
  reader's events, each the same event, and ends where the first reader's stream did.
- **Limits**: a ping (`{"t":"p"}`) gets its pong (`{"t":"o"}`); any other text frame, and any binary
  frame, closes with 1003; 1000 frames sent at once close with 1008 within a second; past
  `tabsPerUser` open sockets, the next is accepted and closed with 1013 before any frame.
- **Shutdown** (`--shutdown`): `POST /api/hub/shutdown` closes a reader with 1001.
