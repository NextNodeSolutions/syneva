// A relayed request's answer as the probe sends it back (RFC 0001, 4.5): read whole up to
// `responseBytes` before its first frame, its desk and plan ids traded for their web ids where a
// hub route names them, then one `res` with its body, or `res { more }` and its chunks once the
// body's base64 is over `chunkBytes` (outbox.ts cuts them).
import { webDeskId } from '@syneva/contracts/bridge'
import { deskPagePath, HUB_PATHS } from '@syneva/contracts/routes'

import { CHUNK_RAW_BYTES } from './outbox.js'

import type { BridgeFrame, RelayMethod } from '@syneva/contracts/bridge'
import type { Outbox } from './outbox.js'

// The answer's bytes, or null once they passed `cap` (the rest is never read).
export async function readCapped(
	response: Response,
	cap: number,
): Promise<Uint8Array | null> {
	if (!response.body) return new Uint8Array()
	const parts: Uint8Array[] = []
	let size = 0
	for await (const part of response.body) {
		size += part.byteLength
		if (size > cap) return null
		parts.push(part)
	}
	return Buffer.concat(parts)
}

// `sent` runs once the answer's last frame is written; a cancel drops what was not, and it
// never runs.
export function sendAnswer(
	outbox: Outbox,
	id: string,
	answer: { response: Response; bytes: Uint8Array },
	sent: () => void,
): void {
	const { response, bytes } = answer
	const head = {
		t: 'res',
		id,
		status: response.status,
		headers: headersOf(response, bytes.byteLength),
	} as const
	if (bytes.byteLength > CHUNK_RAW_BYTES) {
		const frame: BridgeFrame = { ...head, more: true }
		outbox.send(JSON.stringify(frame), undefined, id)
		outbox.stream(id, bytes, sent)
		return
	}
	const body = Buffer.from(bytes).toString('base64')
	const frame: BridgeFrame = body ? { ...head, body } : head
	outbox.send(JSON.stringify(frame), sent, id)
}

// The answer's own headers; its length is the bytes sent (an answer named by web ids changed
// size).
function headersOf(response: Response, length: number): Record<string, string> {
	return {
		...Object.fromEntries(response.headers),
		'content-length': String(length),
	}
}

// The hub routes whose answer names a desk or a plan by its local id, named instead by its web
// id as the stream names it (core's stream-frames.ts): the web's New review dialog opens the desk
// an open answers, its Plans page links a plan's desk. Every other answer goes as it is.
export function webAnswer(
	hubId: string,
	request: { method: RelayMethod; path: string },
	response: Response,
	bytes: Uint8Array,
): Uint8Array {
	const rename = renamerOf(request.method, request.path)
	if (!rename || !response.ok) return bytes
	const answer: unknown = JSON.parse(Buffer.from(bytes).toString('utf8'))
	return Buffer.from(JSON.stringify(rename(hubId, fieldsOf(answer) ?? {})))
}

type Fields = Record<string, unknown>
type Renamer = (hubId: string, answer: Fields) => Fields

function renamerOf(method: RelayMethod, path: string): Renamer | null {
	if (path === HUB_PATHS.desks && method === 'POST')
		return (hubId, answer) => ({
			...answer,
			desk: webDesk(hubId, answer.desk),
		})
	if (path.startsWith(`${HUB_PATHS.desks}/`) && method === 'DELETE')
		return (hubId, answer) => ({ ...answer, id: webId(hubId, answer.id) })
	if (path === HUB_PATHS.plans)
		return (hubId, answer) => ({
			...answer,
			plans: webPlans(hubId, answer.plans),
		})
	if (path.startsWith(`${HUB_PATHS.plans}/`))
		return (hubId, answer) => renamedPlan(hubId, answer)
	return null
}

// A plan's read and its status change answer `plan`; a version's read names none.
function renamedPlan(hubId: string, answer: Fields): Fields {
	if (!('plan' in answer)) return answer
	return { ...answer, plan: webPlan(hubId, answer.plan) }
}

function webId(hubId: string, localId: unknown): unknown {
	if (typeof localId !== 'string') return localId
	return webDeskId(hubId, localId)
}

function webDesk(hubId: string, summary: unknown): unknown {
	const fields = fieldsOf(summary)
	if (typeof fields?.id !== 'string') return summary
	const id = webDeskId(hubId, fields.id)
	return {
		...fields,
		id,
		path: deskPagePath(id),
		plan: webId(hubId, fields.plan),
	}
}

function webPlans(hubId: string, plans: unknown): unknown {
	if (!Array.isArray(plans)) return plans
	return plans.map((plan: unknown) => webPlan(hubId, plan))
}

function webPlan(hubId: string, plan: unknown): unknown {
	const fields = fieldsOf(plan)
	if (typeof fields?.id !== 'string') return plan
	const desk = fieldsOf(fields.desk)
	const deskId = webId(hubId, desk?.id)
	return {
		...fields,
		id: webDeskId(hubId, fields.id),
		desk:
			typeof deskId === 'string'
				? { id: deskId, path: deskPagePath(deskId) }
				: fields.desk,
	}
}

function fieldsOf(raw: unknown): Fields | null {
	if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
		return null
	return Object.fromEntries(Object.entries(raw))
}
