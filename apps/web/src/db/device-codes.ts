// device_codes: the pairings in progress (RFC 4.2). The CLI holds the device code (stored as its
// sha256), the person confirms the user code on the device page. Approving names the account and
// the hub's web id; the CLI's next ask takes the code, once, and only then is the hub's token drawn
// and its row written with the token's sha256: the token itself is never stored, not even for the
// seconds between the approval and the ask. Expired rows go on every write to the table.
import { iso } from '../http/call.js'

// An account's approved codes not yet taken: hubs about to be, which its cap counts.
const PENDING_HUBS =
	'SELECT COUNT(*) FROM device_codes WHERE user_id = ? AND approved_at IS NOT NULL AND taken_at IS NULL AND expires_at > ?'

export type NewDeviceCode = {
	digest: string
	userCode: string
	hubName: string
	hubVersion: string
	expiresAt: Date
}

// A code as the CLI's ask reads it.
export type DevicePoll = {
	approvedAt: string | null
	deniedAt: string | null
	expiresAt: string
	attempts: number
	lastPolledAt: string | null
	takenAt: string | null
	hubId: string | null
}

// A code as the device page shows it.
export type DeviceCode = {
	userCode: string
	hubName: string
	hubVersion: string
	approvedAt: string | null
	deniedAt: string | null
	expiresAt: string
}

// False when the user code is already taken (one chance in 32^8 per live code): the caller draws
// another.
export async function insertDeviceCode(
	db: D1Database,
	code: NewDeviceCode,
	now: Date,
): Promise<boolean> {
	const [, inserted] = await db.batch([
		purge(db, now),
		db
			.prepare(
				'INSERT INTO device_codes (device_code_digest, user_code, hub_name, hub_version, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING',
			)
			.bind(
				code.digest,
				code.userCode,
				code.hubName,
				code.hubVersion,
				iso(code.expiresAt),
				iso(now),
			),
	])
	return (inserted?.meta.changes ?? 0) > 0
}

export async function devicePoll(
	db: D1Database,
	digest: string,
): Promise<DevicePoll | null> {
	return db
		.prepare(
			'SELECT approved_at AS approvedAt, denied_at AS deniedAt, expires_at AS expiresAt, attempts, last_polled_at AS lastPolledAt, taken_at AS takenAt, hub_id AS hubId FROM device_codes WHERE device_code_digest = ?',
		)
		.bind(digest)
		.first<DevicePoll>()
}

// One more ask counted, when it came.
export async function countPoll(
	db: D1Database,
	digest: string,
	now: Date,
): Promise<void> {
	await db.batch([
		purge(db, now),
		db
			.prepare(
				'UPDATE device_codes SET attempts = attempts + 1, last_polled_at = ? WHERE device_code_digest = ?',
			)
			.bind(iso(now), digest),
	])
}

// The approved code taken, once, while it lives: the hub's row is written with the token's
// digest and the code marked taken in one transaction, under the same condition, so both happen
// or neither does. False when the code was taken a moment ago or expired.
export async function takeApprovedCode(
	db: D1Database,
	taking: { digest: string; tokenDigest: string },
	now: Date,
): Promise<boolean> {
	const approved =
		'device_code_digest = ? AND approved_at IS NOT NULL AND taken_at IS NULL AND expires_at > ?'
	const [, , taken] = await db.batch([
		purge(db, now),
		db
			.prepare(
				`INSERT INTO hubs (id, user_id, name, token_digest, version, created_at) SELECT hub_id, user_id, hub_name, ?, hub_version, ? FROM device_codes WHERE ${approved}`,
			)
			.bind(taking.tokenDigest, iso(now), taking.digest, iso(now)),
		db
			.prepare(
				`UPDATE device_codes SET taken_at = ?, attempts = attempts + 1, last_polled_at = ? WHERE ${approved} AND EXISTS (SELECT 1 FROM hubs WHERE token_digest = ?)`,
			)
			.bind(
				iso(now),
				iso(now),
				taking.digest,
				iso(now),
				taking.tokenDigest,
			),
	])
	return (taken?.meta.changes ?? 0) > 0
}

export async function deviceCode(
	db: D1Database,
	userCode: string,
): Promise<DeviceCode | null> {
	return db
		.prepare(
			'SELECT user_code AS userCode, hub_name AS hubName, hub_version AS hubVersion, approved_at AS approvedAt, denied_at AS deniedAt, expires_at AS expiresAt FROM device_codes WHERE user_code = ?',
		)
		.bind(userCode)
		.first<DeviceCode>()
}

export type Approval = {
	userCode: string
	userId: string
	hubId: string
	maxHubs: number
}

// The code approved for this account and this hub id while it is open (live, neither approved
// nor denied yet), and while the account's hubs, paired or approved and not yet taken, stay
// under `maxHubs`. False otherwise.
export async function approveDeviceCode(
	db: D1Database,
	approval: Approval,
	now: Date,
): Promise<boolean> {
	const [, approved] = await db.batch([
		purge(db, now),
		db
			.prepare(
				`UPDATE device_codes SET user_id = ?, hub_id = ?, approved_at = ? WHERE user_code = ? AND approved_at IS NULL AND denied_at IS NULL AND expires_at > ? AND (SELECT COUNT(*) FROM hubs WHERE user_id = ? AND revoked_at IS NULL) + (${PENDING_HUBS}) < ?`,
			)
			.bind(
				approval.userId,
				approval.hubId,
				iso(now),
				approval.userCode,
				iso(now),
				approval.userId,
				approval.userId,
				iso(now),
				approval.maxHubs,
			),
	])
	return (approved?.meta.changes ?? 0) > 0
}

// The hubs an account has or is about to have: paired and not revoked, or approved and not yet
// taken while their code lives; the cap counts both, so two approvals at once never pass it.
export async function hubCount(
	db: D1Database,
	userId: string,
	now: Date,
): Promise<number> {
	const row = await db
		.prepare(
			`SELECT (SELECT COUNT(*) FROM hubs WHERE user_id = ? AND revoked_at IS NULL) + (${PENDING_HUBS}) AS n`,
		)
		.bind(userId, userId, iso(now))
		.first<{ n: number }>()
	return row?.n ?? 0
}

// False when the code was no longer open.
export async function denyDeviceCode(
	db: D1Database,
	userCode: string,
	now: Date,
): Promise<boolean> {
	const [, denied] = await db.batch([
		purge(db, now),
		db
			.prepare(
				'UPDATE device_codes SET denied_at = ? WHERE user_code = ? AND approved_at IS NULL AND denied_at IS NULL AND expires_at > ?',
			)
			.bind(iso(now), userCode, iso(now)),
	])
	return (denied?.meta.changes ?? 0) > 0
}

// The expired codes, gone with the write the table already gets (no cron, RFC 6.1 B9).
function purge(db: D1Database, now: Date): D1PreparedStatement {
	return db
		.prepare('DELETE FROM device_codes WHERE expires_at <= ?')
		.bind(iso(now))
}
