-- The hub's token is never stored, not even between the approval and the CLI's next ask (0001's
-- device_codes.token held it there, in clear, until that ask or the next code purged it). The ask
-- that takes an approved code now draws the token and writes the hub's row with its sha256 in one
-- transaction; `taken_at` says the code was spent. hubs keeps its schema: a row exists only once
-- its token does.
ALTER TABLE device_codes DROP COLUMN token;
ALTER TABLE device_codes ADD COLUMN taken_at TEXT;
