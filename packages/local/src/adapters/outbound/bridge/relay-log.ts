// What the web did on this machine, read back from the hub's own log (`~/.syneva/hub/hub.log` for
// a detached hub): one line for every relayed request but a GET, once its route answered or the
// probe turned it away - its method, its path as the hub read it (local ids once let through,
// the web's when refused before routing), its status and failure code, the desk it acted on by
// its hub-side id, and whether its answer was stopped. Never its query or its body: they carry
// the reviewer's words and file names. A GET changes nothing, and the tab reads often.
import { DESK_API_PREFIX, HUB_PATHS } from '@syneva/contracts/routes'

import type { RelayMethod } from '@syneva/contracts/bridge'

export type Relayed = {
	method: RelayMethod
	path: string
	// Let through to the router; else refused before it (its path then names the web's ids).
	isRouted: boolean
	response: Response
	// The answer as the router gave it (local ids); null once it passed `responseBytes`.
	local: Uint8Array | null
	// Cancelled, or its socket closed, before its answer went out.
	isStopped: boolean
}

type Log = (line: string) => void

export function logRelayed(log: Log, relayed: Relayed): void {
	if (relayed.method === 'GET') return
	const desk = deskOf(relayed)
	const line = [
		`bridge: relayed ${relayed.method} ${relayed.path} answered ${statusOf(relayed)}`,
		desk ? ` (desk ${desk})` : '',
		relayed.isStopped ? ', not sent: the relay was stopped' : '',
	]
	log(line.join(''))
}

// A relayed request the probe answered without a route (`err TOO_MANY`).
export function logTurnedAway(
	log: Log,
	frame: { method: RelayMethod; path: string },
	code: string,
): void {
	if (frame.method === 'GET') return
	log(`bridge: relayed ${frame.method} ${frame.path} refused: ${code}`)
}

function statusOf({ response, local }: Relayed): string {
	if (!local) return `${response.status} TOO_LARGE`
	if (response.ok) return String(response.status)
	const code = fieldsOf(local)?.code
	return typeof code === 'string'
		? `${response.status} ${code}`
		: String(response.status)
}

// The desk its path names, or the one an open answered.
function deskOf({ method, path, isRouted, local }: Relayed): string | null {
	if (!isRouted) return null
	for (const prefix of [DESK_API_PREFIX, `${HUB_PATHS.desks}/`])
		if (path.startsWith(prefix))
			return path.slice(prefix.length).split('/')[0] ?? null
	if (method !== 'POST' || path !== HUB_PATHS.desks || !local) return null
	const desk = fieldsOf(local)?.desk
	if (typeof desk !== 'object' || desk === null || !('id' in desk))
		return null
	if (typeof desk.id !== 'string') return null
	return desk.id
}

function fieldsOf(bytes: Uint8Array): Record<string, unknown> | null {
	try {
		const raw: unknown = JSON.parse(Buffer.from(bytes).toString('utf8'))
		if (typeof raw !== 'object' || raw === null) return null
		return Object.fromEntries(Object.entries(raw))
	} catch {
		return null
	}
}
