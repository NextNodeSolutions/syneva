// What a cost test is handed: the report, the web it runs against (a `wrangler dev` this runner
// started, or a deployed Worker named by --staging), the accounts and fake hubs it may use, and
// the one cleanup that closes every socket a test opened, whatever the test did.
import { createInterface } from 'node:readline/promises'

import { createAccounts, hubOf, tabOf } from './accounts.mjs'
import { createExplorer, NO_EXPLORER } from './observe.mjs'
import { opsOf } from './ops.mjs'
import { printReads } from './staging-reads.mjs'

function explorerFor(web, staging) {
	if (staging) return NO_EXPLORER
	return createExplorer(web.origin)
}

export function createContext({
	options,
	report,
	web,
	secrets,
	staging,
	scratch,
}) {
	const tracked = new Set()
	const ctx = {
		options,
		report,
		web,
		secrets,
		staging,
		scratch,
		// Holds finished in this run, for the tests that read the same window (T1, T8).
		holds: [],
		// The readings this run could not take, and the tests whose staging reads are a person's:
		// the summary names both, since neither is an `ok`.
		unmeasured: [],
		readsLeft: [],
		note(text) {
			process.stdout.write(`note ${text}\n`)
		},
		// A reading a check needs that came back empty (no local Explorer, or one that lost what it
		// was to count): a FAIL, since a check that measured nothing proves nothing, unless
		// --allow-unmeasured says this run is a dry run that may go without it.
		notMeasured(what, why) {
			ctx.unmeasured.push(what)
			if (options['allow-unmeasured'])
				process.stdout.write(`unmeasured ${what}: ${why}\n`)
			else
				report.check(
					`measured: ${what}`,
					false,
					`${why} (--allow-unmeasured runs without it, and says so)`,
				)
		},
		track(peer) {
			tracked.add(peer)
			return peer
		},
		async cleanup() {
			for (const peer of tracked) peer.terminate()
			tracked.clear()
		},
		prompt: async message => {
			const lines = createInterface({
				input: process.stdin,
				output: process.stdout,
			})
			await lines.question(`${message} [Enter] `)
			lines.close()
		},
		printReads: (id, window) => {
			if (staging) ctx.readsLeft.push(id)
			printReads(ctx, id, window)
		},
	}
	ctx.accounts = createAccounts(ctx)
	ctx.account = index => ctx.accounts.get(index)
	ctx.hub = async (account, index) => {
		const hub = await hubOf(ctx, account, index)
		return ctx.track(hub)
	}
	ctx.tab = (account, tabOptions) => tabOf(ctx, account, tabOptions)
	ctx.ops = opsOf(ctx)
	ctx.explorer = explorerFor(web, staging)
	return ctx
}
