// device_codes: the pairings in progress (RFC 4.2). The CLI holds the device code (stored as its
// sha256), the person confirms the user code on the device page. Approving writes the hub's row
// and parks its token here until the CLI's next ask takes it, once. Expired rows go on the next
// code asked for.
import { iso } from '../http/call.js'

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
	hasToken: number
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
		db
			.prepare('DELETE FROM device_codes WHERE expires_at <= ?')
			.bind(iso(now)),
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
			'SELECT approved_at AS approvedAt, denied_at AS deniedAt, expires_at AS expiresAt, attempts, last_polled_at AS lastPolledAt, token IS NOT NULL AS hasToken FROM device_codes WHERE device_code_digest = ?',
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
	await db
		.prepare(
			'UPDATE device_codes SET attempts = attempts + 1, last_polled_at = ? WHERE device_code_digest = ?',
		)
		.bind(iso(now), digest)
		.run()
}

// The approved hub's id and token, handed out once: read and cleared in one transaction (a
// RETURNING clause would read the cleared column).
export async function takeToken(
	db: D1Database,
	digest: string,
	now: Date,
): Promise<{ hubId: string; token: string } | null> {
	const held = 'device_code_digest = ? AND token IS NOT NULL'
	const [read, cleared] = await db.batch<{ hubId: string; token: string }>([
		db
			.prepare(
				`SELECT hub_id AS hubId, token FROM device_codes WHERE ${held}`,
			)
			.bind(digest),
		db
			.prepare(
				`UPDATE device_codes SET token = NULL, attempts = attempts + 1, last_polled_at = ? WHERE ${held}`,
			)
			.bind(iso(now), digest),
	])
	const row = read?.results[0]
	if (!row || !cleared?.meta.changes) return null
	return row
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
	token: string
	tokenDigest: string
}

// The hub's row and the code's approval in one transaction, under the same condition (the code
// live, neither approved nor denied yet), so both happen or neither does. False when the code was
// no longer open.
export async function approveDeviceCode(
	db: D1Database,
	approval: Approval,
	now: Date,
): Promise<boolean> {
	const open =
		'user_code = ? AND approved_at IS NULL AND denied_at IS NULL AND expires_at > ?'
	const [, approved] = await db.batch([
		db
			.prepare(
				`INSERT INTO hubs (id, user_id, name, token_digest, version, created_at) SELECT ?, ?, hub_name, ?, hub_version, ? FROM device_codes WHERE ${open}`,
			)
			.bind(
				approval.hubId,
				approval.userId,
				approval.tokenDigest,
				iso(now),
				approval.userCode,
				iso(now),
			),
		db
			.prepare(
				`UPDATE device_codes SET user_id = ?, hub_id = ?, token = ?, approved_at = ? WHERE ${open}`,
			)
			.bind(
				approval.userId,
				approval.hubId,
				approval.token,
				iso(now),
				approval.userCode,
				iso(now),
			),
	])
	return (approved?.meta.changes ?? 0) > 0
}

// False when the code was no longer open.
export async function denyDeviceCode(
	db: D1Database,
	userCode: string,
	now: Date,
): Promise<boolean> {
	const { meta } = await db
		.prepare(
			'UPDATE device_codes SET denied_at = ? WHERE user_code = ? AND approved_at IS NULL AND denied_at IS NULL AND expires_at > ?',
		)
		.bind(iso(now), userCode, iso(now))
		.run()
	return meta.changes > 0
}
