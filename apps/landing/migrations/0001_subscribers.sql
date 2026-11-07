-- The newsletter list: one row per address, kept as it was typed. NOCASE
-- makes the address unique however it is cased, so a second signup is a
-- no-op (the endpoint's INSERT ... ON CONFLICT DO NOTHING).
CREATE TABLE subscribers (
	id INTEGER PRIMARY KEY,
	email TEXT NOT NULL UNIQUE COLLATE NOCASE,
	subscribed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
