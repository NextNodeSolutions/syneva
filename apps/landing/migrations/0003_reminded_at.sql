-- When an address already on the list was last told so by email (ISO 8601,
-- UTC, like subscribed_at); NULL until a second signup. A second signup is no
-- longer a pure no-op: it stamps this column, at most once a day per address
-- whoever submits it, and only then is the note sent
-- (src/features/subscribe/model/subscribe.server.ts).
ALTER TABLE subscribers ADD COLUMN reminded_at TEXT;
