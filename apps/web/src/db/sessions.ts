// sessions: one row per signed-in browser, by the HMAC of its cookie's id (auth/session.ts).
// Expired rows go on the next sign-in.
import { iso } from '../http/call.js'

export type SessionUser = { userId: string; email: string }

export async function sessionUser(
	db: D1Database,
	digest: string,
	now: Date,
): Promise<SessionUser | null> {
	return db
		.prepare(
			'SELECT s.user_id AS userId, u.email AS email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id_digest = ? AND s.expires_at > ?',
		)
		.bind(digest, iso(now))
		.first<SessionUser>()
}

export async function insertSession(
	db: D1Database,
	session: { digest: string; userId: string; expiresAt: Date },
	now: Date,
): Promise<void> {
	await db.batch([
		db.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(iso(now)),
		db
			.prepare(
				'INSERT INTO sessions (id_digest, user_id, expires_at) VALUES (?, ?, ?)',
			)
			.bind(session.digest, session.userId, iso(session.expiresAt)),
	])
}

export async function deleteSession(
	db: D1Database,
	digest: string,
): Promise<void> {
	await db
		.prepare('DELETE FROM sessions WHERE id_digest = ?')
		.bind(digest)
		.run()
}
