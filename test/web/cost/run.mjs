#!/usr/bin/env node
// The cost acceptance tests of RFC 0001, 6.7 (T1 to T10) for apps/web:
//   node test/web/cost/run.mjs [--only T2,T4] [--web-port 47994] [--port 47993] [--cli <path>]
//        [--staging <origin> --cookie <session> ... --ops-token <token>]
// It starts one `wrangler dev` (nothing touches a Cloudflare account), runs the selected tests
// against it and prints one line per check. A test that only a deployed Worker can settle runs its
// local dry run, or reports `skip (staging)`; against `--staging` it drives what HTTP and
// WebSocket can and prints the Analytics reads a person makes for the rest (README.md).
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

import { createReport } from '../../stream/report.mjs'
import { startWeb } from '../wrangler-dev.mjs'

import { createContext } from './context.mjs'
import { TESTS } from './tests.mjs'

const ROOT = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	'..',
	'..',
	'..',
)
const SECRET_BYTES = 32

const { values: options } = parseArgs({
	options: {
		only: { type: 'string' },
		'web-port': { type: 'string', default: '47994' },
		port: { type: 'string', default: '47993' },
		cli: {
			type: 'string',
			default: path.join(ROOT, 'apps/syneva/dist/cli.js'),
		},
		staging: { type: 'string' },
		cookie: { type: 'string', multiple: true, default: [] },
		'ops-token': { type: 'string' },
		minutes: { type: 'string' },
		hubs: { type: 'string' },
		tabs: { type: 'string' },
		seconds: { type: 'string' },
		'offline-ms': { type: 'string' },
		full: { type: 'boolean', default: false },
		procedures: { type: 'boolean', default: false },
		restart: { type: 'boolean', default: false },
	},
})

const selected = select(options.only, Boolean(options.staging))
await preflight()
const scratch = realpathSync(
	mkdtempSync(path.join(os.tmpdir(), 'syneva-cost-')),
)
const home = path.join(scratch, 'home')
mkdirSync(home)
process.env.HOME = home
const secrets = {
	SESSION_SECRET: randomBytes(SECRET_BYTES).toString('hex'),
	OPS_TOKEN:
		options['ops-token'] ?? randomBytes(SECRET_BYTES).toString('hex'),
	MAIL_TRANSPORT: 'log',
}
process.stdout.write(`cost tests: scratch ${scratch}\n`)

const report = createReport()
const web = options.staging
	? stagingWeb(options.staging)
	: await startWeb({
			scratch,
			port: Number(options['web-port']),
			vars: secrets,
		})
if (options.staging) secrets.OPS_TOKEN = options['ops-token'] ?? ''
const ctx = createContext({
	options,
	report,
	web,
	secrets,
	staging: options.staging ?? null,
	scratch,
})
const skipped = []
try {
	for (const test of selected) await runOne(test)
} finally {
	await ctx.cleanup()
	if (!options.staging) await web.stop()
}

const failures = report.failures()
if (failures && !options.staging) printWorkerErrors()
const note = skipped.length
	? `, ${skipped.length} skipped (${skipped.join(', ')})`
	: ''
const kept = failures ? `; scratch kept at ${scratch}` : ''
process.stdout.write(
	`\n${report.total() - failures}/${report.total()} checks passed${note}${kept}\n`,
)
if (failures) process.exit(1)
rmSync(scratch, { recursive: true, force: true })

// What the Worker itself logged that looks like a fault, for the failures above to be read against.
function printWorkerErrors() {
	const lines = web.output.text
		.split('\n')
		.filter(line => /error|unexpected|exception/i.test(line))
		.slice(-20)
	if (lines.length)
		process.stdout.write(`\nworker log:\n${lines.join('\n')}\n`)
}

async function runOne(test) {
	const where = test.where === 'staging' ? 'needs staging' : 'local'
	report.section(`${test.id} ${test.title} (${where})`)
	const isLocalRun = !options.staging
	try {
		if (isLocalRun && test.where === 'staging') {
			if (
				!test.dryRun ||
				(test.dryRunNeeds && !options[test.dryRunNeeds])
			) {
				const hint = test.skipHint ? `; ${test.skipHint}` : ''
				process.stdout.write(`skip (staging)${hint}\n`)
				if (options.procedures) test.procedure?.(ctx)
				skipped.push(test.id)
				return
			}
			process.stdout.write(
				'local dry run; the acceptance is on staging\n',
			)
			await test.dryRun(ctx)
		} else await test.run(ctx)
	} catch (error) {
		report.check(
			`${test.id} ran to its end`,
			false,
			error.stack ?? String(error),
		)
	} finally {
		await ctx.cleanup()
	}
}

function select(only, isStaging) {
	if (only) {
		const ids = only.split(',').map(id => id.trim().toUpperCase())
		const unknown = ids.filter(id => !TESTS.some(test => test.id === id))
		if (unknown.length) stop(`unknown test ${unknown.join(', ')}`)
		return TESTS.filter(test => ids.includes(test.id))
	}
	if (isStaging) return TESTS.filter(test => test.where === 'staging')
	return TESTS
}

function stagingWeb(origin) {
	return {
		origin: origin.replace(/\/$/, ''),
		output: { text: '' },
		links: () => [],
	}
}

async function preflight() {
	const built = path.join(ROOT, 'apps/web/dist/server/entry.mjs')
	if (!existsSync(built))
		stop(`${built} is missing; run \`pnpm build\` first`)
	if (options.staging) {
		if (!options.cookie.length)
			stop('--staging needs at least one --cookie')
		return
	}
	const busy = []
	for (const port of [options['web-port']])
		if (!(await isFree(Number(port)))) busy.push(port)
	if (busy.length) stop(`port ${busy.join(', ')} is in use; pass another`)
}

function stop(reason) {
	process.stderr.write(`cost tests: ${reason}\n`)
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
