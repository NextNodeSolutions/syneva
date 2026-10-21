// Small helpers every test uses on the fake peers.
import { delay } from './fakes/timing.mjs'

// The close a peer reports within `ms`, or null.
export function closeOf(peer, ms = 5000) {
	return Promise.race([peer.closed, delay(ms, null)])
}

// A hub of `account` connected as a quiet one (no snapshot answers, pings at the policy's pace).
export async function openHub(ctx, account, index, options = {}) {
	const hub = await ctx.hub(account, index)
	const outcome = await hub.connect({ answerSnapshots: false, ...options })
	if (outcome !== 'open')
		throw new Error(`hub ${index} was refused (${outcome})`)
	return hub
}

export function describeClose(closed) {
	if (!closed) return 'still open'
	return `${closed.code} ${closed.reason ?? ''}`.trim()
}

export const isOpen = (...peers) => peers.every(peer => peer.isOpen)
