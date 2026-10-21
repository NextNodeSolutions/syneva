// What the conformance check does to the hub besides reading its stream: the hub's HTTP API (as
// a tab and the CLI see it) and the CLI itself, run against a scratch git repo of its own.
import { execFile } from 'node:child_process'
import { mkdtempSync, realpathSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)

// One session name of its own, so the check never targets a desk someone else opened.
export const SESSION = 'stream-check'

// What a keyed hub's API and stream read: the key as a Bearer.
function bearer(key) {
	if (!key) return undefined
	return { authorization: `Bearer ${key}` }
}

// The CLI's environment: this hub (never one it would start), this key or none.
function cliEnv(hub, key) {
	const env = {
		...process.env,
		SYNEVA_HUB: hub,
		SYNEVA_NO_AUTOSTART: '1',
		SYNEVA_NO_UPDATE_CHECK: '1',
	}
	delete env.SYNEVA_PORT
	delete env.SYNEVA_KEY
	if (key) env.SYNEVA_KEY = key
	return env
}

export function createDriver({ hub, key, cli }) {
	const auth = { ...bearer(key) }
	const env = cliEnv(hub, key)
	const driver = {
		auth,
		async json(route, init = {}) {
			const response = await fetch(new URL(route, hub), {
				...init,
				headers: { ...auth, ...init.headers },
			})
			return { status: response.status, body: await response.json() }
		},
		post(route, body) {
			return driver.json(route, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body),
			})
		},
		async cli(args, cwd) {
			try {
				const { stdout } = await run(process.execPath, [cli, ...args], {
					cwd,
					env,
				})
				return { code: 0, stdout }
			} catch (error) {
				return { code: error.code ?? 1, stdout: error.stdout ?? '' }
			}
		},
	}
	return driver
}

// A git repo with one committed file and one change to it: enough for a repo desk to review.
export async function scratchRepo() {
	const root = realpathSync(
		mkdtempSync(path.join(os.tmpdir(), 'syneva-stream-')),
	)
	const git = args => run('git', args, { cwd: root })
	await git(['init', '-q', '-b', 'main'])
	await git(['config', 'user.email', 'stream@check.invalid'])
	await git(['config', 'user.name', 'stream check'])
	writeFileSync(path.join(root, 'a.txt'), 'line one\nline two\n')
	await git(['add', '.'])
	await git(['commit', '-qm', 'init'])
	writeFileSync(path.join(root, 'a.txt'), 'line one\nline 2 changed\n')
	return {
		root,
		edit(text) {
			writeFileSync(path.join(root, 'a.txt'), text)
		},
	}
}
