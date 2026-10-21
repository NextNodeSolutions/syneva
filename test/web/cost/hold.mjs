// A fleet held open with pings only: `hubs` fake hubs and `tabs` tabs spread over as many accounts
// as the per-person caps ask for (8 hubs and 32 tabs each, RFC 0001, 4.3), connected, settled,
// then left alone for `minutes` while each socket pings every 30 s. T1 reads what the object did
// in that window from the Analytics API; T8 what the Worker logged.
import { BRIDGE_LIMITS } from '../../../packages/contracts/dist/bridge.js'

import { delay } from './fakes/timing.mjs'
import { invocationTotal } from './observe.mjs'

const MS_PER_MINUTE = 60_000
const TAB_SPACING_MS = 60
const SETTLE_QUIET_MS = 3000
const SETTLE_MAX_MS = 60_000
const POLL_MS = 250

export function accountsFor(hubs, tabs) {
	return Math.max(
		1,
		Math.ceil(hubs / BRIDGE_LIMITS.hubsPerUser),
		Math.ceil(tabs / BRIDGE_LIMITS.tabsPerUser),
	)
}

// Opens the fleet and waits for its first conversation (hello, snapshots, `hub` frames) to end.
export async function openFleet(ctx, { hubs, tabs }) {
	const count = accountsFor(hubs, tabs)
	const accounts = []
	for (let at = 0; at < count; at += 1) accounts.push(await ctx.account(at))
	const opened = { hubs: [], tabs: [], refused: [] }
	for (let at = 0; at < hubs; at += 1) {
		const account = accounts[at % count]
		const hub = await ctx.hub(account, Math.floor(at / count))
		const outcome = await hub.connect({
			pingMs: BRIDGE_LIMITS.pingIntervalMs,
		})
		if (outcome === 'open') opened.hubs.push(hub)
		else opened.refused.push(`hub ${at}: ${outcome}`)
	}
	for (let at = 0; at < tabs; at += 1) {
		const tab = await ctx.tab(accounts[at % count], {
			connect: false,
		})
		const outcome = await tab.connect({
			pingMs: BRIDGE_LIMITS.pingIntervalMs,
		})
		if (outcome === 'open') opened.tabs.push(tab)
		else opened.refused.push(`tab ${at}: ${outcome}`)
		await delay(TAB_SPACING_MS)
	}
	await untilQuiet([...opened.hubs, ...opened.tabs])
	return { accounts: count, ...opened }
}

// Resolves once no frame arrived on any of `peers` for SETTLE_QUIET_MS.
async function untilQuiet(peers) {
	const total = () => peers.reduce((sum, peer) => sum + peer.frames.length, 0)
	const deadline = Date.now() + SETTLE_MAX_MS
	let seen = -1
	let quietSince = Date.now()
	while (Date.now() < deadline && Date.now() - quietSince < SETTLE_QUIET_MS) {
		await delay(POLL_MS)
		if (total() !== seen) {
			seen = total()
			quietSince = Date.now()
		}
	}
}

// Holds the fleet `minutes` and reports what happened on each socket in that window.
export async function holdFleet(ctx, { hubs, tabs, minutes }) {
	const fleet = await openFleet(ctx, { hubs, tabs })
	const peers = [...fleet.hubs, ...fleet.tabs]
	const baseline = new Map(peers.map(peer => [peer, peer.frames.length]))
	const stdoutOffset = ctx.web.output.text.length
	const startedAt = Date.now()
	// Ends at the minutes, or at the first socket that closes: a close is already the failure.
	await Promise.race([
		delay(minutes * MS_PER_MINUTE),
		...peers.map(peer => peer.closed),
	])
	const endedAt = Date.now()
	const stdoutEnd = ctx.web.output.text.length
	const requests = await ctx.explorer.settledRequests(startedAt, endedAt)
	const closed = peers.filter(peer => !peer.isOpen)
	const spoken = peers.flatMap(peer =>
		peer.frames.slice(baseline.get(peer)).filter(each => !each.isPong),
	)
	const hold = {
		...fleet,
		startedAt,
		endedAt,
		minutes,
		stdoutOffset,
		stdoutEnd,
		closed,
		spoken,
		requests,
		invocations: requests ? invocationTotal(requests) : null,
		pings: peers.reduce((sum, peer) => sum + peer.pings, 0),
		pongs: peers.reduce((sum, peer) => sum + peer.pongs, 0),
		unanswered: peers.filter(peer => peer.pongs < peer.pings - 1).length,
	}
	ctx.holds.push(hold)
	return hold
}

export const iso = ms => new Date(ms).toISOString()
