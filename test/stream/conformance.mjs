#!/usr/bin/env node
// The hub stream's frame conformance: node test/stream/conformance.mjs --hub <url> [--key <key>]
// [--cli <path>] [--shutdown]. Run it against a scratch hub (README.md): it opens and closes desks
// of its own, opens tabsPerUser sockets, and with --shutdown stops the hub.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import { HUB_PATHS } from '../../packages/contracts/dist/routes.js'

import { checkEvents, PLAN_SESSION } from './event-checks.mjs'
import { createDriver, scratchRepo } from './hub-driver.mjs'
import { checkGuards, checkLimits, checkShutdown } from './limit-checks.mjs'
import { checkOversize } from './oversize-checks.mjs'
import { createReport } from './report.mjs'
import { checkResets } from './reset-checks.mjs'
import { checkSilence, startSilence } from './silence-checks.mjs'
import { checkSnapshot } from './snapshot-checks.mjs'
import { closeReader, socketUrl } from './stream-client.mjs'

const USAGE_EXIT = 2
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

const { values: options } = parseArgs({
	options: {
		hub: { type: 'string' },
		key: { type: 'string' },
		cli: {
			type: 'string',
			default: path.join(ROOT, 'apps/syneva/dist/cli.js'),
		},
		shutdown: { type: 'boolean', default: false },
	},
})
if (!options.hub) {
	process.stderr.write(
		'usage: conformance.mjs --hub <url> [--key <key>] [--cli <path>] [--shutdown]\n',
	)
	process.exit(USAGE_EXIT)
}

const report = createReport()
const driver = createDriver(options)
const context = {
	report,
	driver,
	hub: options.hub,
	key: options.key,
	url: socketUrl(options.hub, HUB_PATHS.hubSocket),
	headers: driver.auth,
}
process.stdout.write(
	`stream conformance against ${context.url}${options.key ? ' (keyed)' : ''}\n`,
)

await checkGuards(context)
await checkResets(context)
const silence = await startSilence(context)
const first = await checkSnapshot(context, 'on connect')
const repo = await scratchRepo()
await checkEvents({ ...context, reader: first.reader, snapshot: first, repo })
const second = await checkSnapshot(context, 'after the events')
checkDedupe(first, second)
await Promise.all([closeReader(first.reader), closeReader(second.reader)])
await driver.cli(['close', '--session', PLAN_SESSION], repo.root)
await checkOversize({ ...context, repo })
await checkSilence(context, silence)
await checkLimits(context)
if (options.shutdown) await checkShutdown(context)

const failures = report.failures()
process.stdout.write(`\n${report.total()} checks, ${failures} failed\n`)
process.exit(failures ? 1 : 0)

// Two readers' journals deduplicate by (hubId, seq): a key both hold is the same event, and the
// second's tail ends where the first's stream did.
function checkDedupe(one, two) {
	const held = journalOf(one.reader)
	const replayed = journalOf(two.reader)
	const shared = [...replayed.keys()].filter(key => held.has(key))
	report.check(
		`a second reader's tail deduplicates by (hubId, seq) (${shared.length} shared)`,
		shared.length > 0 &&
			shared.every(
				key =>
					JSON.stringify(held.get(key)) ===
					JSON.stringify(replayed.get(key)),
			) &&
			Math.max(...[...held.values()].map(event => event.seq)) ===
				two.latestSeq,
	)
}

// A reader's journal events by their (hubId, seq) key.
function journalOf(reader) {
	return new Map(
		reader.frames
			.filter(each => each.frame.t === 'journal')
			.flatMap(each =>
				each.frame.events.map(event => [
					`${each.frame.hubId}:${event.seq}`,
					event,
				]),
			),
	)
}
