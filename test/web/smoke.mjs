#!/usr/bin/env node
// The web's smoke (RFC 0001, phase 2): node test/web/smoke.mjs [--web-port <port>] [--port <hub
// port>] [--spare-port <hub port>] [--cli <path>]. It runs apps/web's build under `wrangler dev`
// (local only) with a scratch D1, signs in through the magic link the Worker prints, pairs a
// scratch local hub with `syneva login`, approves it on the device page, and drives a tab's socket
// and the relay against it, then revokes the hub, logs it out, pairs a second scratch hub past the
// connected cap, trips the breaker and signs out (README.md). One line per check; exit 1 on any
// failure, the scratch directory kept for a look.
import { randomBytes } from 'node:crypto'
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	realpathSync,
	rmSync,
} from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import { startHub } from '../bridge/hub-process.mjs'
import { createReport } from '../stream/report.mjs'

import { checkOtherAccounts } from './account-checks.mjs'
import { checkPairing } from './device-checks.mjs'
import { checkLogout, checkRevoke, checkTab } from './hub-checks.mjs'
import { checkClientLimits } from './limit-checks.mjs'
import { checkOps } from './ops-checks.mjs'
import { checkSignedInPages, checkSignedOutPages } from './page-checks.mjs'
import { checkRelay } from './relay-checks.mjs'
import { checkSignedOut, checkSignIn, checkSignOut } from './session-checks.mjs'
import { checkSecondTab } from './tab-checks.mjs'
import { createBrowser } from './web-client.mjs'
import { startWeb } from './wrangler-dev.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SECRET_BYTES = 32

const { values: options } = parseArgs({
	options: {
		cli: {
			type: 'string',
			default: path.join(ROOT, 'apps/syneva/dist/cli.js'),
		},
		port: { type: 'string', default: '47983' },
		'web-port': { type: 'string', default: '47984' },
		// The second scratch hub's (cap-checks.mjs), started for its check alone.
		'spare-port': { type: 'string', default: '47985' },
	},
})

await preflight()
const scratch = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'syneva-web-')))
const home = path.join(scratch, 'home')
mkdirSync(home)
const spareHome = path.join(scratch, 'spare-home')
mkdirSync(spareHome)
// Every hub and CLI the smoke starts reads this HOME: its bridge.json, its hub lock.
process.env.HOME = home
const secrets = {
	SESSION_SECRET: randomBytes(SECRET_BYTES).toString('hex'),
	OPS_TOKEN: randomBytes(SECRET_BYTES).toString('hex'),
	MAIL_TRANSPORT: 'log',
}
process.stdout.write(`web smoke: scratch ${scratch}\n`)

const report = createReport()
const web = await startWeb({
	scratch,
	port: Number(options['web-port']),
	vars: secrets,
})
const hub = await startHub({
	cli: options.cli,
	home,
	port: Number(options.port),
})
const context = {
	report,
	web,
	hub,
	home,
	secrets,
	cli: options.cli,
	browser: createBrowser(web.origin),
	spareHome,
	sparePort: Number(options['spare-port']),
}
// The tab sockets the run opened, closed whatever happens.
const tabs = []
try {
	await run()
} catch (error) {
	report.check(
		'the smoke ran to its end',
		false,
		error.stack ?? String(error),
	)
} finally {
	for (const tab of tabs) tab.socket.terminate()
	await hub.stop()
	await web.stop()
}

const failures = report.failures()
const kept = failures ? `; scratch kept at ${scratch}` : ''
process.stdout.write(
	`\n${report.total() - failures}/${report.total()} checks passed${kept}\n`,
)
if (failures) process.exit(1)
rmSync(scratch, { recursive: true, force: true })

async function run() {
	await checkSignedOut(context)
	await checkSignedOutPages(context)
	await checkSignIn(context)
	await checkSignedInPages(context)
	await checkClientLimits(context)
	const hubId = await checkPairing(context)
	const tab = hubId ? await checkTab(context, hubId) : null
	if (tab) {
		tabs.push(tab)
		const second = await checkSecondTab(context, { hubId, tab })
		if (second) tabs.push(second)
		await checkRelay(context, { hubId, tab })
	}
	if (hubId) await checkRevoke(context, { hubId, tab })
	await checkLogout(context)
	context.second = await checkOtherAccounts(context)
	await checkOps(context, tab)
	await checkSignOut(context)
}

// The build is there and both ports are free: the smoke never binds a port in use.
async function preflight() {
	const entry = path.join(ROOT, 'apps/web/dist/server/entry.mjs')
	const missing = [entry, options.cli].find(file => !existsSync(file))
	if (missing) stop(`${missing} is missing; run \`pnpm build\` first`)
	const ports = [options.port, options['web-port'], options['spare-port']]
	const taken = await Promise.all(ports.map(port => isFree(Number(port))))
	const busy = ports.find((_, index) => !taken[index])
	if (busy) stop(`port ${busy} is in use; pass another`)
}

function stop(reason) {
	process.stderr.write(`web smoke: ${reason}\n`)
	process.exit(1)
}

function isFree(port) {
	return new Promise(resolve => {
		const server = net.createServer()
		server.once('error', () => resolve(false))
		server.listen(port, '127.0.0.1', () => {
			server.close(() => resolve(true))
		})
	})
}
