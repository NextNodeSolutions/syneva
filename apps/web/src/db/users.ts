// users: one row per address that followed a magic link. The row is created at the callback,
// never at the request, so an address nobody verified leaves no row.
import { randomHex } from '../auth/secrets.js'
import { iso } from '../http/call.js'

export type UserRow = { id: string; email: string }

// 16 random bytes: the key of the person's object too (USER_HUB.idFromName).
const USER_ID_BYTES = 16
// Its hex: two digits a byte.
const USER_ID = /^[0-9a-f]{32}$/

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

// Whether a text has a user id's shape: an ops cursor names one (routes/ops-drain.ts).
export function isUserIdShape(text: string): boolean {
	return USER_ID.test(text)
}

// A page of user ids in id order, after `after` (from the first when null): the objects a
// tripped breaker drains (routes/ops-drain.ts). A range of the primary key, so a page reads its
// rows alone however many users there are; one more than `limit` is read to tell whether another
// page follows, so the last page says so and no empty one is asked for.
export async function userIdPage(
	db: D1Database,
	page: { after: string | null; limit: number },
): Promise<{ ids: string[]; hasMore: boolean }> {
	const { results } = await db
		.prepare('SELECT id FROM users WHERE id > ? ORDER BY id LIMIT ?')
		.bind(page.after ?? '', page.limit + 1)
		.all<{ id: string }>()
	const ids = results.map(row => row.id)
	return { ids: ids.slice(0, page.limit), hasMore: ids.length > page.limit }
}
