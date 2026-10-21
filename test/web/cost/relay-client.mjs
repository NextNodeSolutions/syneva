// A tab's relayed requests as the tests make them: a desk route named by a hub's web id (the hub
// id followed by a local desk id, RFC 4.8), read to its end.
import { createHash } from 'node:crypto'

import {
	API_PATHS,
	deskApiBase,
} from '../../../packages/contracts/dist/routes.js'

// `tag` is the local desk id: distinct tags are distinct relays to the same hub.
export const relayPath = (hub, tag = '0001') =>
	`${deskApiBase(`${hub.hubId}${tag}`)}${API_PATHS.state}`

export const relayGet = (account, hub, tag, init) =>
	account.browser.fetch(relayPath(hub, tag), init)

// The body to its end, hashed as it comes: how many bytes, their sha256, or the error that cut it.
export async function readBody(response) {
	const reader = response.body.getReader()
	const hash = createHash('sha256')
	let bytes = 0
	try {
		for (;;) {
			const { done, value } = await reader.read()
			if (done) return { bytes, sha256: hash.digest('hex'), error: null }
			bytes += value.length
			hash.update(value)
		}
	} catch (error) {
		return {
			bytes,
			sha256: null,
			error: error.cause?.code ?? error.message,
		}
	}
}

// A failure answer's JSON, or null when the body is not one.
export async function failureOf(response) {
	try {
		return await response.json()
	} catch {
		return null
	}
}
