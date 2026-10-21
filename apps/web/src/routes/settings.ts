// GET/POST /api/hub/settings on the web: the person's display preferences, one JSON document in
// D1 (RFC 4.7), read and written as the local hub's settings are (core's hub-routes.ts): any JSON
// is written as sent, a read hands back an object or `{}`. Under a cap the local hub has no need
// for: a preferences document is small.
import { HUB_PATHS } from '@syneva/contracts/routes'

import { readSettings, writeSettings } from '../db/settings.js'
import { json } from '../http/answer.js'
import { readJson } from '../http/body.js'
import { HTTP_OK } from '../http/status.js'

import type { Session } from '../auth/session.js'
import type { Call } from '../http/call.js'

const SETTINGS_BYTES = 65_536

// The paths answered here, which need the session alone (routes/session-routes.ts).
export function isSettingsPath(pathname: string): boolean {
	return pathname === HUB_PATHS.settings
}

export async function settingsRoute(
	{ request, url, env, now }: Call,
	session: Session,
): Promise<Response | null> {
	if (!isSettingsPath(url.pathname)) return null
	if (request.method === 'GET')
		return json(
			HTTP_OK,
			settingsOf(await readSettings(env.DB, session.userId)),
		)
	if (request.method !== 'POST') return null
	const read = await readJson(request, SETTINGS_BYTES)
	if ('refusal' in read) return read.refusal
	await writeSettings(
		env.DB,
		session.userId,
		JSON.stringify(read.parsed),
		now,
	)
	return json(HTTP_OK, { ok: true })
}

// What the local hub's read gives: the stored object, or `{}` for anything else (none yet, a bare
// value, an array).
function settingsOf(stored: string | null): Record<string, unknown> {
	if (!stored) return {}
	let parsed: unknown = null
	try {
		parsed = JSON.parse(stored)
	} catch {
		return {}
	}
	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
		return {}
	return { ...parsed }
}
