#!/usr/bin/env node
// The probe's conformance (RFC 0001, phase 1): node test/bridge/conformance.mjs [--cli <path>]
// [--port <hub port>] [--bridge-port <port>]. It starts the fake bridge in process and its own
// scratch hubs (a scratch HOME, spare ports), pairs one with `syneva login`, and checks what the
// probe sends, answers and does on every close (README.md).
import { mkdtempSync, realpathSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import { createDriver, scratchRepo } from '../stream/hub-driver.mjs'
import { createReport } from '../stream/report.mjs'

import { startFakeBridge } from './fake-bridge.mjs'
import { startHub } from './hub-process.mjs'
import { checkRestart, checkStop } from './lifecycle-checks.mjs'
import { checkBurst, checkRates } from './limit-checks.mjs'
import { checkMachine } from './machine-checks.mjs'
import {
	checkLogin,
	checkLoginRefusals,
	checkLogout,
	checkUnpaired,
} from './pairing-checks.mjs'
import { checkPolicy } from './policy-checks.mjs'
import { WAIT_SCALE } from './policy-wire.mjs'
import { checkRelay } from './relay-checks.mjs'
import { checkRelayLog } from './relay-log-checks.mjs'
import { checkRefusals } from './relay-refusals.mjs'
import {
	checkClose,
	checkEvents,
	checkHello,
	checkResnapshot,
	checkTaggedSnapshot,
} from './stream-checks.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
// How long a hub that should not open a socket is watched for one.
const QUIET_MS = 2000

const { values: options } = parseArgs({
	options: {
		cli: {
			type: 'string',
			default: path.join(ROOT, 'apps/syneva/dist/cli.js'),
		},
		port: { type: 'string', default: '47982' },
		'bridge-port': { type: 'string', default: '47981' },
	},
})
// Every hub and CLI the check starts reads this HOME: its bridge.json, its hub lock.
const home = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'syneva-bridge-')))
process.env.HOME = home

const report = createReport()
const fake = await startFakeBridge({ port: Number(options['bridge-port']) })
const base = { report, fake, cli: options.cli, home }
const port = Number(options.port)
process.stdout.write(
	`probe conformance: fake bridge ${fake.origin}, hubs on ${port}, HOME ${home}\n`,
)

report.section('a hub without a pairing')
const hub = await startHub({ ...base, port })
await checkUnpaired(base, hub, QUIET_MS)
await checkLoginRefusals(base)
const record = await checkLogin(base)
const context = {
	...base,
	record,
	hub,
	repo: await scratchRepo(),
	driver: createDriver({ hub: hub.url, cli: options.cli }),
	viaWeb: true,
}
const tab = await checkHello(context)
const opened = await checkEvents(context, tab)
if (opened) {
	await checkResnapshot(context, tab)
	await checkTaggedSnapshot(context, tab, opened.desk)
	await checkRelay(context, opened.desk)
	await checkRefusals(context, opened.desk)
	await checkMachine(context, opened.desk)
	await checkRelayLog(context, opened.desk)
	await checkClose(context, tab, opened)
}
await checkBurst(context)
tab.socket.close()
await checkStop(context, hub)

// The same pairing on a hub whose waits are scaled down: the restart, the client policy, logout.
const since = {
	upgrades: fake.sockets.upgrades.length,
	frames: fake.sockets.frames.length,
}
const scaledHub = await startHub({
	...base,
	port,
	env: { SYNEVA_BRIDGE_WAIT_SCALE: String(WAIT_SCALE) },
})
const paired = {
	...context,
	hub: scaledHub,
	driver: createDriver({ hub: scaledHub.url, cli: options.cli }),
}
await checkRestart(paired, scaledHub, since)
await checkPolicy(paired)
await checkLogout(paired, { hub: scaledHub, record, quietMs: QUIET_MS })
await scaledHub.stop()

report.section('after logout: a hub without a pairing')
const unpaired = await startHub({ ...base, port })
await checkUnpaired(base, unpaired, QUIET_MS)
await unpaired.stop()
checkRates(context)
await fake.close()

const failures = report.failures()
process.stdout.write(`\n${report.total()} checks, ${failures} failed\n`)
// A failed run keeps its HOME (bridge.json, the hubs' logs) for a look; a green one leaves none.
if (!failures) rmSync(home, { recursive: true, force: true })
process.exit(failures ? 1 : 0)
