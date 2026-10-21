// T8 log volume (RFC 0001, 6.7; guards R8, 6.1 D1): an hour of T1 traffic writes fewer than 100
// log events, and T3's storm none. Counted on a deployed Worker in Workers Logs; locally, what
// the Worker's own code wrote during a hold (`wrangler dev`'s log table and stdout, the runtime's
// request lines left out) must be nothing at all: no line per frame, per ping, per socket.
import { holdFleet, iso } from './hold.mjs'
import { stdoutLogs } from './observe.mjs'

const LOCAL = { hubs: 8, tabs: 8, minutes: 2 }
const STAGING = { hubs: 50, tabs: 50, minutes: 60 }
const MAX_LISTED = 5

async function run(ctx) {
	const { report, options } = ctx
	const base = ctx.staging ? STAGING : LOCAL
	const reuse = ctx.holds.at(-1)
	const hold =
		reuse ??
		(await holdFleet(ctx, {
			hubs: Number(options.hubs ?? base.hubs),
			tabs: Number(options.tabs ?? base.tabs),
			minutes: Number(options.minutes ?? base.minutes),
		}))
	ctx.note(
		`${reuse ? "T1's hold" : 'a hold'} of ${hold.hubs.length} hubs and ${hold.tabs.length} tabs, ${hold.minutes} min`,
	)
	report.check(
		'the hold ran to its end with every socket open',
		!hold.closed.length,
		`${hold.closed.length} closed`,
	)
	if (!ctx.staging) {
		const lines = stdoutLogs(ctx.web, hold.stdoutOffset, hold.stdoutEnd)
		report.check(
			'the Worker wrote nothing to stdout during the hold (no per-frame, per-ping or per-socket line)',
			!lines.length,
			lines.slice(0, MAX_LISTED).join(' | '),
		)
		const logged = await ctx.explorer.codeLogs(hold.startedAt, hold.endedAt)
		if (logged === null)
			ctx.notMeasured(
				"T8: `wrangler dev`'s log table during the hold",
				'no local Explorer answered',
			)
		else
			report.check(
				"... nor in `wrangler dev`'s log table (the runtime's request lines aside)",
				!logged.length,
				logged
					.slice(0, MAX_LISTED)
					.map(row => row.message)
					.join(' | '),
			)
	}
	ctx.printReads('T8', { from: iso(hold.startedAt), to: iso(hold.endedAt) })
}

export const t8 = {
	id: 'T8',
	title: 'log volume',
	where: 'staging',
	run,
	dryRun: run,
}
