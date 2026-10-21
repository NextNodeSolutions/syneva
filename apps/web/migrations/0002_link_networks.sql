-- Magic links emailed per UTC day per client network (apps/web's auth/client-keys.ts: an IPv6 /48,
-- an IPv4 address), by the network's sha256: 50 at most, so one network spends a share of the
-- day's 2,000 (RFC 6.1 F1) and never drains it by rotating the addresses of a prefix it holds.
-- Only today's rows count: older days go on the next link.
CREATE TABLE link_networks (
	day TEXT NOT NULL,
	network_digest TEXT NOT NULL,
	links INTEGER NOT NULL,
	PRIMARY KEY (day, network_digest)
);
