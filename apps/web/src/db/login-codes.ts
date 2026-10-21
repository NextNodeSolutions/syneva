// login_codes and counters: the magic links emailed, by the sha256 of their token, and the daily
// count of emails. A row is the limits' memory as much as the link (RFC 6.1 F1: 3 per address and
// 10 per client address an hour, 2,000 a day), so it stays an hour after its creation, then goes
// on the next link asked for; a day's count stays a week.
import { iso, secondsAfter } from '../http/call.js'

export type LinkLimits = {
	perAddress: number
	perClient: number
	perDay: number
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

// The link's row and the day's count, in one transaction, after the dead rows.
export async function insertLoginCode(
	db: D1Database,
	code: LoginCode,
	limits: LinkLimits,
	now: Date,
): Promise<boolean> {
	const day = dayOf(now)
	const since = iso(secondsAfter(now, -HOUR_S))
	const [, inserted] = await db.batch([
		db
			.prepare('DELETE FROM login_codes WHERE created_at <= ?')
			.bind(iso(secondsAfter(now, -HOUR_S))),
		db
			.prepare(
				'INSERT INTO login_codes (code_digest, email, next, client_digest, expires_at, created_at) SELECT ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM login_codes WHERE email = ? AND created_at > ?) < ? AND (SELECT COUNT(*) FROM login_codes WHERE client_digest = ? AND created_at > ?) < ? AND COALESCE((SELECT emails_sent FROM counters WHERE day = ?), 0) < ?',
			)
			.bind(
				code.digest,
				code.email,
				code.next,
				code.clientDigest,
				iso(code.expiresAt),
				iso(now),
				code.email,
				since,
				limits.perAddress,
				code.clientDigest,
				since,
				limits.perClient,
				day,
				limits.perDay,
			),
		db
			.prepare(
				'INSERT INTO counters (day, emails_sent) SELECT ?, 1 WHERE changes() > 0 ON CONFLICT (day) DO UPDATE SET emails_sent = emails_sent + 1',
			)
			.bind(day),
		db
			.prepare('DELETE FROM counters WHERE day < ?')
			.bind(dayOf(secondsAfter(now, -WEEK_S))),
	])
	return (inserted?.meta.changes ?? 0) > 0
}

// The address a live link signs in as, the row untouched: the link's GET is what any mail scanner
// fetches, so only the POST its page sends takes it (takeLoginCode) or counts a try.
export async function peekLoginCode(
	db: D1Database,
	digest: string,
	limits: { now: Date; maxAttempts: number },
): Promise<string | null> {
	const live = await db
		.prepare(
			'SELECT email FROM login_codes WHERE code_digest = ? AND used_at IS NULL AND expires_at > ? AND attempts < ?',
		)
		.bind(digest, iso(limits.now), limits.maxAttempts)
		.first<{ email: string }>()
	return live?.email ?? null
}

// The link's address and destination, once: the row is marked used in the same statement that
// reads it, so two posts never open two sessions. A link posted past its life, after its use or
// more than `maxAttempts` times answers null (the attempt counted).
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
