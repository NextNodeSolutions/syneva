// The scratch hubs the probe's conformance runs: started from the CLI build under the scratch
// HOME the check set (so they read its bridge.json), stopped through the hub's own route, and the
// CLI run against them - `login` read line by line while it waits for the person.
import { execFile, spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { promisify } from 'node:util'

import { HUB_PATHS } from '../../packages/contracts/dist/routes.js'

const run = promisify(execFile)
const STARTUP_MS = 15_000
const STEP_MS = 100

// The environment of every hub and CLI the check starts: the scratch HOME, no other hub named.
export function scratchEnv(home, extra = {}) {
	const inherited = Object.entries(process.env).filter(
		([name]) => !OTHER_HUB.has(name),
	)
	return {
		...Object.fromEntries(inherited),
		HOME: home,
		SYNEVA_NO_UPDATE_CHECK: '1',
		SYNEVA_NO_AUTOSTART: '1',
		...extra,
	}
}

const OTHER_HUB = new Set([
	'SYNEVA_HUB',
	'SYNEVA_PORT',
	'SYNEVA_KEY',
	'SYNEVA_WEB_URL',
	'SYNEVA_BRIDGE_WAIT_SCALE',
])

export async function startHub({ cli, home, port, env = {} }) {
	const url = `http://127.0.0.1:${port}`
	const log = createWriteStream(path.join(home, `hub-${port}.log`), {
		flags: 'a',
	})
	const child = spawn(
		process.execPath,
		[cli, 'start', '--port', String(port), '--no-open'],
		{ env: scratchEnv(home, env), stdio: ['ignore', 'pipe', 'pipe'] },
	)
	child.stdout.pipe(log)
	child.stderr.pipe(log)
	const exited = new Promise(resolve => {
		child.once('exit', code => resolve(code))
	})
	await waitUntil(
		async () => (await health(url)) !== null,
		STARTUP_MS,
		'the hub to answer',
	)
	return {
		url,
		exited,
		health: () => health(url),
		// POST /api/hub/shutdown, as `syneva hub stop` sends it; settles once the process exited.
		async stop() {
			await fetch(new URL(HUB_PATHS.shutdown, url), {
				method: 'POST',
				headers: { origin: url },
			}).catch(() => undefined)
			return exited
		},
	}
}

async function health(url) {
	try {
		const response = await fetch(new URL(HUB_PATHS.health, url))
		if (!response.ok) return null
		return await response.json()
	} catch {
		return null
	}
}

// Resolves once `test` holds, looking again every STEP_MS; rejects after `timeoutMs` naming
// `what`.
export async function waitUntil(test, timeoutMs, what) {
	const deadline = Date.now() + timeoutMs
	const look = async () => {
		if (await test()) return
		if (Date.now() > deadline)
			throw new Error(`no ${what} within ${timeoutMs} ms`)
		await delay(STEP_MS)
		await look()
	}
	await look()
}

// One CLI command to its exit: its code and both outputs.
export async function runCli({ cli, home }, args, cwd = home) {
	try {
		const { stdout, stderr } = await run(process.execPath, [cli, ...args], {
			cwd,
			env: scratchEnv(home),
		})
		return { code: 0, stdout, stderr }
	} catch (error) {
		return {
			code: error.code ?? 1,
			stdout: error.stdout ?? '',
			stderr: error.stderr ?? '',
		}
	}
}

// A CLI command left running: its stderr as it grows, a line awaited, its exit.
export function spawnCli({ cli, home }, args) {
	const child = spawn(process.execPath, [cli, ...args], {
		cwd: home,
		env: scratchEnv(home),
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	const output = { stdout: '', stderr: '' }
	child.stdout.on('data', part => {
		output.stdout += part.toString('utf8')
	})
	child.stderr.on('data', part => {
		output.stderr += part.toString('utf8')
	})
	const exited = new Promise(resolve => {
		child.once('exit', code => resolve({ code, ...output }))
	})
	return {
		output,
		exited,
		async line(pattern, timeoutMs) {
			await waitUntil(
				() => pattern.test(output.stderr),
				timeoutMs,
				`${pattern}`,
			)
			return output.stderr.match(pattern)
		},
	}
}
