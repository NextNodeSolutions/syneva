// A session read together with what one route needs, in one D1 statement: the relay's hub and
// the breaker, the tab socket's hubs and the breaker, one round trip where each took three (the
// session, then its rows, then the breaker) on the routes every tab action takes. Each joins from
// the session's row, so nothing of another account can come back, and a session absent or
// expired reads as null; the route still refuses in its order (R9), 401 first.
import { iso } from '../http/call.js'

import type { HubRow } from './hubs.js'

export type SessionRead = {
	userId: string
	email: string
	// The breaker's app stage (RFC 6.5), as readBreaker says it.
	tripped: boolean
}

// The session, and `hubId` back when that hub is the session's own and not revoked.
export async function relayRead(
	db: D1Database,
	ask: { digest: string; hubId: string | null; now: Date },
): Promise<(SessionRead & { hubId: string | null }) | null> {
	const row = await db
		.prepare(
			`SELECT s.user_id AS userId, u.email AS email, b.tripped_at AS trippedAt, h.id AS hubId ${FROM_SESSION} LEFT JOIN hubs h ON h.id = ? AND h.user_id = s.user_id AND h.revoked_at IS NULL ${WHERE_SESSION}`,
		)
		.bind(ask.hubId, ask.digest, iso(ask.now))
		.first<SessionRow & { hubId: string | null }>()
	if (!row) return null
	return { ...sessionOf(row), hubId: row.hubId }
}

// The session and its live hubs, oldest first (one row per hub, one with no hub for none).
export async function tabRead(
	db: D1Database,
	digest: string,
	now: Date,
): Promise<(SessionRead & { hubs: HubRow[] }) | null> {
	const { results } = await db
		.prepare(
			`SELECT s.user_id AS userId, u.email AS email, b.tripped_at AS trippedAt, h.id AS hubId, h.name AS name, h.version AS version, h.created_at AS createdAt, h.last_seen_at AS lastSeenAt ${FROM_SESSION} LEFT JOIN hubs h ON h.user_id = s.user_id AND h.revoked_at IS NULL ${WHERE_SESSION} ORDER BY h.created_at`,
		)
		.bind(digest, iso(now))
		.all<SessionRow & HubColumns>()
	const [first] = results
	if (!first) return null
	return { ...sessionOf(first), hubs: results.flatMap(hubOf) }
}

type SessionRow = { userId: string; email: string; trippedAt: string | null }

type HubColumns = {
	hubId: string | null
	name: string | null
	version: string | null
	createdAt: string | null
	lastSeenAt: string | null
}

const FROM_SESSION =
	'FROM sessions s JOIN users u ON u.id = s.user_id LEFT JOIN breaker b ON b.id = 1'
const WHERE_SESSION = 'WHERE s.id_digest = ? AND s.expires_at > ?'

function sessionOf(row: SessionRow): SessionRead {
	return {
		userId: row.userId,
		email: row.email,
		tripped: Boolean(row.trippedAt),
	}
}

function hubOf(row: SessionRow & HubColumns): HubRow[] {
	const { hubId, name, version, createdAt } = row
	if (!hubId || name === null || version === null || createdAt === null)
		return []
	return [
		{
			id: hubId,
			userId: row.userId,
			name,
			version,
			createdAt,
			lastSeenAt: row.lastSeenAt,
		},
	]
}
