// user_settings: the display preferences, one JSON document per person (RFC 4.7).
import { iso } from '../http/call.js'

export async function readSettings(
	db: D1Database,
	userId: string,
): Promise<string | null> {
	const row = await db
		.prepare(
			'SELECT settings_json AS json FROM user_settings WHERE user_id = ?',
		)
		.bind(userId)
		.first<{ json: string }>()
	return row?.json ?? null
}

export async function writeSettings(
	db: D1Database,
	userId: string,
	settingsJson: string,
	now: Date,
): Promise<void> {
	await db
		.prepare(
			'INSERT INTO user_settings (user_id, settings_json, updated_at) VALUES (?, ?, ?) ON CONFLICT (user_id) DO UPDATE SET settings_json = excluded.settings_json, updated_at = excluded.updated_at',
		)
		.bind(userId, settingsJson, iso(now))
		.run()
}
