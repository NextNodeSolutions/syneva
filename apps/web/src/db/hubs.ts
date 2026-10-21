// hubs: the person's paired hubs. A hub's token is kept as its sha256; `last_seen_at` is written
// when its socket opens, never per frame or ping (RFC 6.1 C3); a revoked hub keeps its row.
import { iso, secondsAfter } from '../http/call.js'

export type HubRow = {
	id: string
	userId: string
	name: string
	version: string
	createdAt: string
	lastSeenAt: string | null
}

const COLUMNS =
	'id, user_id AS userId, name, version, created_at AS createdAt, last_seen_at AS lastSeenAt'
const DAY_S = 86_400

export async function hubByTokenDigest(
	db: D1Database,
	digest: string,
): Promise<HubRow | null> {
	return db
		.prepare(
			`SELECT ${COLUMNS} FROM hubs WHERE token_digest = ? AND revoked_at IS NULL`,
		)
		.bind(digest)
		.first<HubRow>()
}

// The person's live hubs, oldest first.
export async function hubsOfUser(
	db: D1Database,
	userId: string,
): Promise<HubRow[]> {
	const { results } = await db
		.prepare(
			`SELECT ${COLUMNS} FROM hubs WHERE user_id = ? AND revoked_at IS NULL ORDER BY created_at`,
		)
		.bind(userId)
		.all<HubRow>()
	return results
}

export async function hubOfUser(
	db: D1Database,
	userId: string,
	hubId: string,
): Promise<HubRow | null> {
	return db
		.prepare(
			`SELECT ${COLUMNS} FROM hubs WHERE id = ? AND user_id = ? AND revoked_at IS NULL`,
		)
		.bind(hubId, userId)
		.first<HubRow>()
}

export async function touchHub(
	db: D1Database,
	hubId: string,
	now: Date,
): Promise<void> {
	await db
		.prepare('UPDATE hubs SET last_seen_at = ? WHERE id = ?')
		.bind(iso(now), hubId)
		.run()
}

// From the Hub page: the person's own hub only, revoked once (a second revoke keeps the first
// time), so a revoke whose object call failed can be asked again. False when it is not theirs.
export async function revokeHubOfUser(
	db: D1Database,
	ids: { userId: string; hubId: string },
	now: Date,
): Promise<boolean> {
	const { meta } = await db
		.prepare(
			'UPDATE hubs SET revoked_at = COALESCE(revoked_at, ?) WHERE id = ? AND user_id = ?',
		)
		.bind(iso(now), ids.hubId, ids.userId)
		.run()
	return meta.changes > 0
}

// From `syneva logout`: the hub its token opens, revoked.
export async function revokeHubByToken(
	db: D1Database,
	digest: string,
	now: Date,
): Promise<{ id: string; userId: string } | null> {
	return db
		.prepare(
			'UPDATE hubs SET revoked_at = ? WHERE token_digest = ? AND revoked_at IS NULL RETURNING id, user_id AS userId',
		)
		.bind(iso(now), digest)
		.first<{ id: string; userId: string }>()
}

// control-center's "connected users" base (RFC 6.4): live hubs that connected in the last day.
export async function hubsSeenLastDay(
	db: D1Database,
	now: Date,
): Promise<number> {
	const row = await db
		.prepare(
			'SELECT COUNT(*) AS n FROM hubs WHERE revoked_at IS NULL AND last_seen_at > ?',
		)
		.bind(iso(secondsAfter(now, -DAY_S)))
		.first<{ n: number }>()
	return row?.n ?? 0
}
