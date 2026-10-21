// T1 hibernation proof (RFC 0001, 6.7; guards A1 to A5, R1, R2, R7): hub and tab sockets held
// with pings only cost the object no active time, because the runtime answers the ping pair
// without waking it. The proof is the Analytics API's, read on a deployed Worker (metrics lag:
// ten minutes). The part a script can settle runs anywhere: every socket stays open, nothing
// but the pong reaches any of them, the Worker is not invoked. Run again on every change to the
// object's code.
import { delay } from './fakes/timing.mjs'
import { holdFleet, iso } from './hold.mjs'

const LOCAL = { hubs: 8, tabs: 8, minutes: 2 }
const STAGING = { hubs: 50, tabs: 50, minutes: 30 }
const MAX_LISTED = 5
const MAX_TEXT = 80
const WAKE_WAIT_MS = 600

function sizes(ctx) {
	const base = ctx.staging ? STAGING : LOCAL
	const { options } = ctx
	return {
		hubs: Number(options.hubs ?? base.hubs),
		tabs: Number(options.tabs ?? base.tabs),
		minutes: Number(options.minutes ?? base.minutes),
	}
}

// A hold shorter than a ping interval (30 s) sends no ping at all: there is nothing to answer.
const MS_PER_MINUTE = 60_000
const PING_FLOOR_MS = 35_000

async function run(ctx) {
	const { report } = ctx
	const want = sizes(ctx)
	ctx.note(
		`${want.hubs} hubs and ${want.tabs} tabs for ${want.minutes} min; pairing is paced by the rate limiter (ten a minute), so opening takes a while`,
	)
	const hold = await holdFleet(ctx, want)
	report.check(
		`${want.hubs} hub and ${want.tabs} tab sockets opened (${hold.accounts} account${hold.accounts === 1 ? '' : 's'}: 8 hubs and 32 tabs a person at most)`,
		hold.hubs.length === want.hubs && hold.tabs.length === want.tabs,
		hold.refused.slice(0, MAX_LISTED).join('; '),
	)
	report.check(
		`none of them closed in ${want.minutes} min with pings only`,
		!hold.closed.length,
		hold.closed
			.slice(0, MAX_LISTED)
			.map(peer => JSON.stringify(peer.closeInfo))
			.join('; '),
	)
	report.check(
		'nothing but the pong reached any socket in the window (no frame from the object)',
		!hold.spoken.length,
		hold.spoken
			.slice(0, MAX_LISTED)
			.map(each => each.text.slice(0, MAX_TEXT))
			.join(' | '),
	)
	report.check(
		`every ping was answered (${hold.pings} pings, ${hold.pongs} pongs)`,
		hold.unanswered === 0 &&
			(want.minutes * MS_PER_MINUTE < PING_FLOOR_MS || hold.pings > 0),
		`${hold.unanswered} sockets short of a pong`,
	)
	if (hold.invocations !== null)
		report.check(
			"the Worker was not invoked once during the hold (pings are the runtime's auto-response)",
			hold.invocations === 0,
			`${hold.invocations} invocations`,
		)
	if (ctx.explorer.isLocal) await objectWokenOnlyByFrames(ctx, hold)
	ctx.printReads('T1', { from: iso(hold.startedAt), to: iso(hold.endedAt) })
}

// `wrangler dev` logs `hibernatableWebSocket` for each event that runs the object's code. None in
// the window is the local proof that the pings were auto-responses; one real frame afterwards
// proves the log would have shown a wake.
async function objectWokenOnlyByFrames(ctx, hold) {
	const events = await ctx.explorer.objectEvents(hold.startedAt, hold.endedAt)
	if (events === null)
		return ctx.note('no local Explorer: the object events were not read')
	ctx.report.check(
		"the object ran no code during the hold (no hibernatableWebSocket event in wrangler dev's log)",
		!events.length,
		`${events.length} events`,
	)
	const [hub] = hold.hubs
	const sentAt = Date.now()
	hub.send(hub.pulse())
	await delay(WAKE_WAIT_MS)
	const after = await ctx.explorer.objectEvents(sentAt, Date.now())
	return ctx.report.check(
		'... and one real frame afterwards does show one (the check is not blind)',
		after !== null && after.length > 0,
		`${after?.length} events`,
	)
}

export const t1 = {
	id: 'T1',
	title: 'hibernation proof',
	where: 'staging',
	run,
	dryRun: run,
}
