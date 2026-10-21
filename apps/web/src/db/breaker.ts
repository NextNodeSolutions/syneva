// breaker: the app stage of RFC 6.5, one row. Tripped while tripped_at is set; clearing it
// empties tripped_at and stamps cleared_at.
import { iso } from '../http/call.js'

export type Breaker = {
	tripped: boolean
	reason: string | null
	since: string | null
}

const OPEN: Breaker = { tripped: false, reason: null, since: null }

export async function readBreaker(db: D1Database): Promise<Breaker> {
	const row = await db
		.prepare(
			'SELECT tripped_at AS trippedAt, reason, cleared_at AS clearedAt FROM breaker WHERE id = 1',
		)
		.first<{
			trippedAt: string | null
			reason: string | null
			clearedAt: string | null
		}>()
	if (!row) return OPEN
	if (row.trippedAt)
		return { tripped: true, reason: row.reason, since: row.trippedAt }
	return { tripped: false, reason: row.reason, since: row.clearedAt }
}

export async function setBreaker(
	db: D1Database,
	state: { tripped: boolean; reason: string | null },
	now: Date,
): Promise<void> {
	const at = iso(now)
	const statement = state.tripped
		? db
				.prepare(
					'INSERT INTO breaker (id, tripped_at, reason) VALUES (1, ?, ?) ON CONFLICT (id) DO UPDATE SET tripped_at = excluded.tripped_at, reason = excluded.reason',
				)
				.bind(at, state.reason)
		: db
				.prepare(
					'INSERT INTO breaker (id, cleared_at, reason) VALUES (1, ?, ?) ON CONFLICT (id) DO UPDATE SET tripped_at = NULL, cleared_at = excluded.cleared_at, reason = excluded.reason',
				)
				.bind(at, state.reason)
	await statement.run()
}

export async function userCount(db: D1Database): Promise<number> {
	const row = await db
		.prepare('SELECT COUNT(*) AS n FROM users')
		.first<{ n: number }>()
	return row?.n ?? 0
}
