import { hubApi } from '@shared/api/client'
import { assertObject, DecodeError, requiredBoolean } from '@shared/api/decode'
import { HUB_PATHS, hubDeskPath } from '@syneva/contracts/routes'

import { decodeHubDesk, decodeHubDesks, decodeHubHealth } from './decode'

import type { HubDesk, HubHealth, NewDeskInput } from './model'

// The hub entity's API boundary: the only place the hub routes are named. Paths come from
// @contracts/routes so the wire stays in sync with the hub by construction, and every
// response is decoded onto a frontend-owned model here - wire shapes never escape.

export const fetchHubDesks = async (): Promise<HubDesk[]> =>
	decodeHubDesks(await hubApi(HUB_PATHS.desks), HUB_PATHS.desks)

export const fetchHubHealth = async (): Promise<HubHealth> =>
	decodeHubHealth(await hubApi(HUB_PATHS.health), HUB_PATHS.health)

// The dashboard's "New review": the same open the CLI performs, answered with the desk to
// navigate to (created, or the live one reloaded).
export const openHubDesk = async (input: NewDeskInput): Promise<HubDesk> => {
	const raw = await hubApi(HUB_PATHS.desks, {
		method: 'POST',
		body: JSON.stringify(input),
	})
	const o = assertObject(raw, HUB_PATHS.desks)
	if (!requiredBoolean(o, 'ok', HUB_PATHS.desks))
		throw new DecodeError('acknowledgement ok is false', HUB_PATHS.desks)
	return decodeHubDesk(o.desk, HUB_PATHS.desks)
}

// Close a desk: the hub tells its agent and keeps the review saved. Idempotent on the hub;
// `closed` is false when the desk was already gone.
export const closeHubDesk = async (id: string): Promise<boolean> => {
	const endpoint = hubDeskPath(id)
	const raw = await hubApi(endpoint, { method: 'DELETE' })
	const o = assertObject(raw, endpoint)
	return requiredBoolean(o, 'closed', endpoint)
}

// The hub's error body ({ error, fix }) as one sentence for the form; a non-hub failure keeps
// its own message.
export async function hubFailureMessage(error: unknown): Promise<string> {
	if (!(error instanceof Error)) return 'The hub did not answer.'
	return error.message
}
