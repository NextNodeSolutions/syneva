// The web as the smoke runs it: apps/web's built Worker under `wrangler dev` (Miniflare, local
// only: nothing here reaches a Cloudflare account), its D1 migrated first, its state persisted
// under the scratch directory, its secrets passed as --var. The sign-in mail goes to its stdout
// (MAIL_TRANSPORT=log), where `link()` reads it.
import { execFile, spawn } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { promisify } from 'node:util'

import { waitUntil } from '../bridge/hub-process.mjs'

const run = promisify(execFile)
const WEB_DIR = path.join(
	path.dirname(new URL(import.meta.url).pathname),
	'..',
	'..',
	'apps',
	'web',
)
const CONFIG = path.join(WEB_DIR, 'wrangler.jsonc')
const STARTUP_MS = 60_000
const STOP_MS = 10_000
const LINK_MS = 5000
const LINK_LINE = /\{"event":"magic-link","link":"([^"]+)"\}/g

function wranglerBin() {
	const require = createRequire(path.join(WEB_DIR, 'package.json'))
	const manifest = require.resolve('wrangler/package.json')
	const { bin } = JSON.parse(readFileSync(manifest, 'utf8'))
	return path.join(path.dirname(manifest), bin.wrangler)
}

function wranglerEnv(scratch) {
	return {
		...process.env,
		WRANGLER_SEND_METRICS: 'false',
		WRANGLER_LOG_PATH: path.join(scratch, 'wrangler-logs'),
		XDG_CONFIG_HOME: path.join(scratch, 'xdg'),
	}
}

export async function startWeb({ scratch, port, vars }) {
	const bin = wranglerBin()
	const persist = path.join(scratch, 'state')
	const env = wranglerEnv(scratch)
	await run(
		process.execPath,
		[
			bin,
			'd1',
			'migrations',
			'apply',
			'DB',
			'--local',
			'--config',
			CONFIG,
			'--persist-to',
			persist,
		],
		{ cwd: WEB_DIR, env },
	)
	const origin = `http://127.0.0.1:${port}`
	const dev = { bin, env, port, persist, vars: { ...vars, SITE_URL: origin } }
	let running = spawnDev(dev)
	const ready = () =>
		waitUntil(
			async () => {
				const response = await fetch(`${origin}/api/hub/health`).catch(
					() => null,
				)
				return response?.ok === true
			},
			STARTUP_MS,
			'wrangler dev to answer',
		)
	await ready()
	return {
		origin,
		get output() {
			return running.output
		},
		links: () => running.links(),
		link: seen => running.link(seen),
		stop: () => running.stop(),
		// The same Worker over the same state and secrets, as after a deploy: every socket drops
		// (the cost tests' deploy drill, T7).
		async restart() {
			await running.stop()
			running = spawnDev(dev)
			await ready()
		},
		...localState({ bin, env, persist }),
	}
}

// What the Worker left in its local state, read from outside it.
function localState({ bin, env, persist }) {
	return {
		// Rows of the scratch D1, read as `wrangler d1 execute --local` reads them.
		async query(sql) {
			const { stdout } = await run(
				process.execPath,
				[
					bin,
					'd1',
					'execute',
					'DB',
					'--local',
					'--config',
					CONFIG,
					'--persist-to',
					persist,
					'--json',
					'--command',
					sql,
				],
				{ cwd: WEB_DIR, env },
			)
			const [answer] = JSON.parse(stdout)
			return answer?.results ?? []
		},
		// Whether any file of the local state (D1's database and its WAL, the objects') holds
		// `text`'s bytes: a row cleared or deleted can stay in a page, so this reads the files.
		stateHolds(text) {
			const files = readdirSync(persist, {
				recursive: true,
				withFileTypes: true,
			}).filter(entry => entry.isFile())
			return files.some(entry =>
				readFileSync(path.join(entry.parentPath, entry.name)).includes(
					text,
				),
			)
		},
	}
}

// Local only (Miniflare), on loopback, its state and secrets the smoke's own.
function devArgs({ port, persist, vars }) {
	const varArgs = Object.entries(vars).flatMap(([name, setting]) => [
		'--var',
		`${name}:${setting}`,
	])
	return [
		'dev',
		'--config',
		CONFIG,
		'--ip',
		'127.0.0.1',
		'--port',
		String(port),
		'--persist-to',
		persist,
		'--show-interactive-dev-session=false',
		...varArgs,
	]
}

// `wrangler dev` left running: what it printed so far, the sign-in links in it, its stop.
function spawnDev({ bin, env, ...dev }) {
	const child = spawn(process.execPath, [bin, ...devArgs(dev)], {
		cwd: WEB_DIR,
		env,
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	const output = { text: '' }
	const collect = part => {
		output.text += part.toString('utf8')
	}
	child.stdout.on('data', collect)
	child.stderr.on('data', collect)
	const exited = new Promise(resolve => {
		child.once('exit', code => resolve(code))
	})
	const links = () =>
		[...output.text.matchAll(LINK_LINE)].map(match => match[1])
	return {
		output,
		// The sign-in links the Worker printed so far.
		links,
		// The next link printed after the `seen` ones.
		async link(seen) {
			await waitUntil(
				() => links().length > seen,
				LINK_MS,
				'sign-in link on stdout',
			)
			return links()[seen]
		},
		async stop() {
			child.kill('SIGTERM')
			const stopped = await Promise.race([
				exited,
				delay(STOP_MS, 'timeout'),
			])
			if (stopped === 'timeout') child.kill('SIGKILL')
		},
	}
}
