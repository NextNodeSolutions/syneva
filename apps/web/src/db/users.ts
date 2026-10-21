// users: one row per address that followed a magic link. The row is created at the callback,
// never at the request, so an address nobody verified leaves no row.
import { randomHex } from '../auth/secrets.js'
import { iso } from '../http/call.js'

export type UserRow = { id: string; email: string }

// 16 random bytes: the key of the person's object too (USER_HUB.idFromName).
const USER_ID_BYTES = 16

// The user an address names, created on its first sign-in; one round trip.
export async function ensureUser(
	db: D1Database,
	email: string,
	now: Date,
): Promise<UserRow> {
	const [, found] = await db.batch<UserRow>([
		db
			.prepare(
				'INSERT INTO users (id, email, created_at) VALUES (?, ?, ?) ON CONFLICT (email) DO NOTHING',
			)
			.bind(randomHex(USER_ID_BYTES), email, iso(now)),
		db.prepare('SELECT id, email FROM users WHERE email = ?').bind(email),
	])
	const row = found?.results[0]
	if (!row) throw new Error('the user row is missing after its insert')
	return row
}

// Every user id, oldest first: the objects a tripped breaker drains (routes/ops.ts).
export async function userIds(db: D1Database): Promise<string[]> {
	const { results } = await db
		.prepare('SELECT id FROM users ORDER BY created_at')
		.all<{ id: string }>()
	return results.map(row => row.id)
}
