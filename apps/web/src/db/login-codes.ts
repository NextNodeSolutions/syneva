// login_codes and counters: the magic links emailed, by the sha256 of their token, and the daily
// count of emails. A row is the limits' memory as much as the link (RFC 6.1 F1: 3 per address and
// 10 per client address an hour, 2,000 a day), so it stays an hour after its creation, then goes
// on the next link asked for; a day's count stays a week.
import { iso, secondsAfter } from '../http/call.js'

export type LinkCounts = {
	perAddress: number
	perClient: number
	today: number
}

export type LoginCode = {
	digest: string
	email: string
	next: string
	clientDigest: string
	expiresAt: Date
}

const HOUR_S = 3600
const WEEK_S = 604_800
const DAY_LENGTH = 10

// A UTC day as the counters key it: YYYY-MM-DD.
export function dayOf(date: Date): string {
	return iso(date).slice(0, DAY_LENGTH)
}

export async function linkCounts(
	db: D1Database,
	asked: { email: string; clientDigest: string },
	now: Date,
): Promise<LinkCounts> {
	const since = iso(secondsAfter(now, -HOUR_S))
	const [perAddress, perClient, today] = await db.batch<{ n: number }>([
		db
			.prepare(
				'SELECT COUNT(*) AS n FROM login_codes WHERE email = ? AND created_at > ?',
			)
			.bind(asked.email, since),
		db
			.prepare(
				'SELECT COUNT(*) AS n FROM login_codes WHERE client_digest = ? AND created_at > ?',
			)
			.bind(asked.clientDigest, since),
		db
			.prepare('SELECT emails_sent AS n FROM counters WHERE day = ?')
			.bind(dayOf(now)),
	])
	return {
		perAddress: perAddress?.results[0]?.n ?? 0,
		perClient: perClient?.results[0]?.n ?? 0,
		today: today?.results[0]?.n ?? 0,
	}
}

// The link's row and the day's count, in one transaction, after the dead rows.
export async function insertLoginCode(
	db: D1Database,
	code: LoginCode,
	now: Date,
): Promise<void> {
	const day = dayOf(now)
	await db.batch([
		db
			.prepare('DELETE FROM login_codes WHERE created_at <= ?')
			.bind(iso(secondsAfter(now, -HOUR_S))),
		db
			.prepare(
				'INSERT INTO login_codes (code_digest, email, next, client_digest, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
			)
			.bind(
				code.digest,
				code.email,
				code.next,
				code.clientDigest,
				iso(code.expiresAt),
				iso(now),
			),
		db
			.prepare(
				'INSERT INTO counters (day, emails_sent) VALUES (?, 1) ON CONFLICT (day) DO UPDATE SET emails_sent = emails_sent + 1',
			)
			.bind(day),
		db
			.prepare('DELETE FROM counters WHERE day < ?')
			.bind(dayOf(secondsAfter(now, -WEEK_S))),
	])
}

// The link's address and destination, once: the row is marked used in the same statement that
// reads it, so two clicks never open two sessions. A link followed past its life, after its use
// or more than `maxAttempts` times answers null (the attempt counted).
export async function takeLoginCode(
	db: D1Database,
	digest: string,
	limits: { now: Date; maxAttempts: number },
): Promise<{ email: string; next: string } | null> {
	const taken = await db
		.prepare(
			'UPDATE login_codes SET used_at = ?, attempts = attempts + 1 WHERE code_digest = ? AND used_at IS NULL AND expires_at > ? AND attempts < ? RETURNING email, next',
		)
		.bind(iso(limits.now), digest, iso(limits.now), limits.maxAttempts)
		.first<{ email: string; next: string }>()
	if (taken) return taken
	await db
		.prepare(
			'UPDATE login_codes SET attempts = attempts + 1 WHERE code_digest = ?',
		)
		.bind(digest)
		.run()
	return null
}
