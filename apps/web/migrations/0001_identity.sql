-- The web's identity (RFC 0001, section 8): who is signed in, which hubs they paired, their
-- display settings, the breaker and the daily email count. Nothing about a desk, a frame or an
-- event: the paired hub is the truth and the object stores nothing (RFC 4.1). Timestamps are ISO
-- 8601 strings in UTC, compared as text. No cron purges anything (RFC 6.1 B9): a table's dead rows
-- go on the next write to that table (src/db/*.ts says which).

CREATE TABLE users (
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	created_at TEXT NOT NULL
);

-- The cookie holds a random id; this table holds HMAC-SHA256(SESSION_SECRET, id), so a dump of it
-- opens no session. Purged on the next sign-in.
CREATE TABLE sessions (
	id_digest TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	expires_at TEXT NOT NULL
);
CREATE INDEX sessions_user ON sessions (user_id);
CREATE INDEX sessions_expiry ON sessions (expires_at);

-- One row per emailed link, by the sha256 of its token. The rows of the last hour are the
-- per-address and per-client limits (3 and 10 an hour, RFC 6.1 F1), so a row outlives its 15
-- minutes: it is purged an hour after it was created, on the next request for a link.
-- client_digest is the sha256 of the requesting address, never the address itself.
CREATE TABLE login_codes (
	code_digest TEXT PRIMARY KEY,
	email TEXT NOT NULL,
	next TEXT NOT NULL,
	client_digest TEXT NOT NULL,
	expires_at TEXT NOT NULL,
	used_at TEXT,
	attempts INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL
);
CREATE INDEX login_codes_email ON login_codes (email, created_at);
CREATE INDEX login_codes_client ON login_codes (client_digest, created_at);
CREATE INDEX login_codes_created ON login_codes (created_at);

-- A pairing in progress (RFC 4.2): the CLI asks with the device code (kept as its sha256), the
-- person confirms the user code. `token` is the hub's token between the approval and the CLI's
-- next ask (at most `interval` seconds), then cleared; the hub keeps only its digest. Purged once
-- expired, on the next code asked for. user_code's UNIQUE is its index.
CREATE TABLE device_codes (
	device_code_digest TEXT PRIMARY KEY,
	user_code TEXT NOT NULL UNIQUE,
	hub_name TEXT NOT NULL,
	hub_version TEXT NOT NULL,
	user_id TEXT REFERENCES users (id) ON DELETE CASCADE,
	hub_id TEXT,
	token TEXT,
	approved_at TEXT,
	denied_at TEXT,
	expires_at TEXT NOT NULL,
	attempts INTEGER NOT NULL DEFAULT 0,
	last_polled_at TEXT,
	created_at TEXT NOT NULL
);
CREATE INDEX device_codes_expiry ON device_codes (expires_at);

-- A paired hub: its 16-hex web id, the sha256 of its token, the CLI version it paired or last
-- connected with, the last time it connected (written on connect only, RFC 6.1 C3). A revoked hub
-- keeps its row with revoked_at, so the Hub page can say so.
CREATE TABLE hubs (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	token_digest TEXT NOT NULL UNIQUE,
	version TEXT NOT NULL,
	created_at TEXT NOT NULL,
	last_seen_at TEXT,
	revoked_at TEXT
);
CREATE INDEX hubs_user ON hubs (user_id);

-- The display preferences a local hub keeps in ~/.syneva/settings.json, following the person
-- across devices (RFC 4.7).
CREATE TABLE user_settings (
	user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
	settings_json TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

-- The breaker's app stage (RFC 6.5): one row, set and cleared through the ops route only.
CREATE TABLE breaker (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	tripped_at TEXT,
	reason TEXT,
	cleared_at TEXT
);

-- Magic links emailed per UTC day: 2,000 at most (RFC 6.1 F1). Days older than a week go on the
-- next link.
CREATE TABLE counters (
	day TEXT PRIMARY KEY,
	emails_sent INTEGER NOT NULL DEFAULT 0
);
