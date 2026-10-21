# The web's smoke

`node test/web/smoke.mjs` checks `apps/web` end to end, locally: its built Worker under `wrangler dev` (Miniflare; nothing touches a Cloudflare account), a scratch local hub started from the CLI build, and the CLI itself. Build first (`pnpm build`), then:

```sh
TMPDIR=<a scratch directory> node test/web/smoke.mjs [--web-port 47984] [--port 47983] [--cli apps/syneva/dist/cli.js]
```

Everything it writes goes under one directory in `os.tmpdir()` (set `TMPDIR` to keep it out of `/tmp`): the D1 and object state (`--persist-to`), wrangler's logs and config, the hub's `HOME` (its `~/.syneva`, its `bridge.json`), the scratch git repo. Both ports must be free (it checks and stops otherwise); it never touches the machine's hub on 4747. The secrets are drawn per run and passed as `--var`, with `MAIL_TRANSPORT=log`, so the sign-in link is read from wrangler's stdout.

One line per check, `ok` or `FAIL` with what was seen; the count at the end; exit 1 on any failure, the scratch directory kept and named.

## What it checks, in order

- **Signed out**: `/api/hub/health` answers a hub's health (no key, no desk); `/` and a dashboard page redirect to sign in; `/api/web/me` is 401; a tab's upgrade is refused 401; the ops status without its token is 403; the sign-in and not-found pages carry the pages' policy (`default-src 'none'`, `style-src` naming the sha256 of the very sheet the page holds, no `script-src`, `frame-ancestors 'none'`, `x-frame-options: DENY`, `nosniff`, `referrer-policy: no-referrer`).
- **Sign-in**: `POST /auth/magic-link` is 202; the link printed opens a page that names the account, under the pages' policy, and spends nothing (twice 200, no cookie); another site's POST of its token is 403; the page's same-origin POST opens a session (303 to `next`, an `HttpOnly`, `SameSite=Lax` cookie); posted or opened again, the link lands on `/login?expired=1`; `/api/web/me` names the person; a dashboard page serves its shell; settings round-trip; a cross-site POST is 403; the sign-out page carries the pages' policy and a dashboard shell `frame-ancestors 'none'`, `DENY`, `nosniff`.
- **Pairing**: `syneva login --web <web> --no-open` prints a code and the device page; the page shows the hub, under the pages' policy; `POST /device` approves it; the CLI exits 0 once the hub is connected; `bridge.json` holds a 16-hex hub id; the code pairs once (410).
- **The tab's socket**: it opens; a `hub` frame says the hub is online with its version and last connect; the hub's `hello` (its web id) and `snapshot-end` follow; `/api/web/hubs` lists it online.
- **The relay**: `POST /api/hub/desks` with `x-syneva-hub` opens a desk on the scratch repo, named by its web id, and the tab reads its `desk` frame and `desk-opened`; the desk's `/state` answers through the relay, sandboxed (CSP, `nosniff`); a comment shows in the tab's `pulse`; a question's `question-asked` reaches the tab and the hub's own journal (by the local id); `/poll` is 404 `NOT_RELAYED`, another hub's web id and a missing header 404 `HUB_NOT_FOUND`, a body over 1 MiB 413.
- **Revoke from the web**: `DELETE /api/web/hubs/<id>`; the tab reads the hub offline; the hub's own stream says its link stopped, `revoked` (close 4001); the hub is no longer listed.
- **Logout**: `syneva logout` exits 0 (the token is already revoked: it says so) and removes `bridge.json`.
- **The breaker**: the ops status with the token; tripping it drains the object (the open tab closes with 4029); a tab's upgrade is then refused 503; cleared, it opens again.
- **Sign-out**: `POST /logout` is 303 to `/login` and clears the cookie; the old cookie opens nothing.

## Not here

The cost acceptance tests of RFC 0001, 6.7 (T1 to T10: hibernation, floods, relay bounds at size, memory, the drills, log volume) need the staging Worker and the Analytics API; they are a follow-up. The probe's own behaviour against a web-like peer is `test/bridge/conformance.mjs`.
