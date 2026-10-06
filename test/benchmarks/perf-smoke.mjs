import assert from 'node:assert/strict'
// Perf regression gate: a throwaway ~1,000-file git repo (every file edited, one oversized generated file) against a real hub on dist/, the PRD's budgets asserted with CI-safe margins.
// Catches order-of-magnitude regressions, not ms drift. Run: pnpm build && pnpm perf-smoke.
import { execFileSync, spawn } from 'node:child_process'
import {
	mkdtempSync,
	writeFileSync,
	readFileSync,
	statSync,
	rmSync,
	mkdirSync,
	readdirSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import {
	checkBundleBudget,
	INITIAL_UI_BYTES_LIMIT,
} from '../../packages/frontend/scripts/bundle-budget.mjs'

const ID = 'perf-smoke'
// The desk under test runs from the assembled published package (apps/syneva/scripts/build-dist.mjs);
// run from the repo root.
const CLI = path.join(process.cwd(), 'apps', 'syneva', 'dist', 'cli.js')
const UI_MANIFEST = path.join(
	process.cwd(),
	'apps',
	'syneva',
	'dist',
	'ui-manifest.json',
)
const FILE_COUNT = 1000
const DESK_URL_TIMEOUT_MS = 30_000
const POLL_ATTEMPTS = 150
const POLL_INTERVAL_MS = 100
const JSON_INDENT = 2
// Bound lazily from the hub's startup line (see waitForDeskUrl); the hub runs on `--port 0` (a
// random free port) so the gate never collides with a developer's own hub. HUB keeps its trailing
// slash; BASE is the opened desk's API base (HUB + api/desks/<id>).
let HUB
let BASE
const sleep = ms => new Promise(r => setTimeout(r, ms))

// The oversized generated fixture: >5000 changed lines, shared by the committed + working writes.
const bigLines = tag =>
	`${Array.from({ length: 6000 }, (_, i) => `${tag} line ${i}`).join('\n')}\n`

// Read the hub's `Syneva hub: http://127.0.0.1:<port>/` startup line (accumulating chunks; it can
// arrive split) and return the origin without the trailing slash.
const waitForDeskUrl = child =>
	new Promise((resolve, reject) => {
		let buf = ''
		const timer = setTimeout(() => {
			cleanupListeners()
			reject(new Error('timed out waiting for the desk to print its URL'))
		}, DESK_URL_TIMEOUT_MS)
		const onData = d => {
			buf += d
			const m = buf.match(/http:\/\/127\.0\.0\.1:\d+/)
			if (m) {
				cleanupListeners()
				resolve(m[0])
			}
		}
		const onExit = () => {
			cleanupListeners()
			reject(new Error('desk exited before printing its URL'))
		}
		const cleanupListeners = () => {
			clearTimeout(timer)
			child.stderr.off('data', onData)
			child.off('exit', onExit)
		}
		child.stderr.on('data', onData)
		child.once('exit', onExit)
	})
const cli = (...args) =>
	execFileSync('node', [CLI, ...args], { encoding: 'utf8' }).trim()
const getText = async p => (await fetch(BASE + p)).text()

// Budgets: generous CI margins over local reality (noted per-assert below).
const BYTES_PER_KIB = 1024
const MIB = BYTES_PER_KIB * BYTES_PER_KIB
const BUDGET_STARTUP_MS = 15_000 // local ~2s
const STATE_BUDGET_MIB = 10
const PERSISTED_BUDGET_MIB = 10
const BUDGET_STATE_BYTES = STATE_BUDGET_MIB * MIB
const BUDGET_PERSISTED_BYTES = PERSISTED_BUDGET_MIB * MIB
const BUDGET_RELOAD_MS = 10_000 // local ~280ms

let desk, tmp, homeDir
const oldHome = process.env.HOME
const cleanup = () => {
	try {
		desk?.kill()
	} catch {}
	try {
		if (tmp) rmSync(tmp, { recursive: true, force: true })
	} catch {}
	try {
		if (homeDir) rmSync(homeDir, { recursive: true, force: true })
	} catch {}
	process.env.HOME = oldHome
}
process.on('exit', cleanup)

function budget({ name, actual, limit, unit, note }) {
	const ok = actual < limit
	process.stdout.write(
		`  ${ok ? '✓' : '✗'} ${name}: ${actual}${unit} (budget < ${limit}${unit}) ${note}\n`,
	)
	if (!ok)
		throw new Error(
			`perf budget violated: ${name} = ${actual}${unit} (budget < ${limit}${unit})`,
		)
}

// Poll the hub's health until it answers; sequential by design (each probe depends on the
// previous), so it recurses instead of awaiting inside a loop.
async function waitForPoll(base, attemptsLeft) {
	try {
		const res = await fetch(`${base}/api/hub/health`)
		if (res.ok) return true
	} catch {}
	if (attemptsLeft <= 0) return false
	await sleep(POLL_INTERVAL_MS)
	return waitForPoll(base, attemptsLeft - 1)
}

try {
	// Point HOME at a throwaway dir so the persisted review file and the hub's registry land somewhere
	// we control and clean up.
	homeDir = mkdtempSync(path.join(tmpdir(), 'syneva-perf-home-'))
	process.env.HOME = homeDir

	// Throwaway ~1,000-file repo: committed base, then every file edited in the working tree, plus
	// one oversized generated file (>5000 changed lines).
	tmp = mkdtempSync(path.join(tmpdir(), 'syneva-perf-repo-'))
	const git = (...a) => execFileSync('git', a, { cwd: tmp, stdio: 'ignore' })
	git('init', '-q')
	git('config', 'user.email', 's@s.dev')
	git('config', 'user.name', 'perf-smoke')

	const dirA = path.join(tmp, 'src')
	mkdirSync(dirA, { recursive: true })
	for (let i = 0; i < FILE_COUNT; i++) {
		writeFileSync(
			path.join(dirA, `file-${i}.txt`),
			`line one ${i}\nline two ${i}\nline three ${i}\n`,
		)
	}
	writeFileSync(path.join(tmp, 'generated-bundle.txt'), bigLines('orig'))
	git('add', '-A')
	git('commit', '-q', '-m', 'init')

	for (let i = 0; i < FILE_COUNT; i++) {
		writeFileSync(
			path.join(dirA, `file-${i}.txt`),
			`line one ${i} CHANGED\nline two ${i}\nline three ${i}\n`,
		)
	}
	writeFileSync(path.join(tmp, 'generated-bundle.txt'), bigLines('edited'))

	const startedAt = Date.now()
	desk = spawn('node', [CLI, 'start', '--port', '0', '--no-open'], {
		// stderr piped so we can read the bound URL; stdout ignored.
		stdio: ['ignore', 'ignore', 'pipe'],
		env: { ...process.env, SYNEVA_NO_UPDATE_CHECK: '1' },
	})
	const origin = await waitForDeskUrl(desk)
	HUB = `${origin}/`
	const isUp = await waitForPoll(origin, POLL_ATTEMPTS)
	assert.ok(isUp, 'hub answered /api/hub/health before the poll loop gave up')
	const opened = JSON.parse(
		cli('open', '--hub', HUB, '--repo', tmp, '--session', ID, '--no-open'),
	)
	assert.ok(opened.ok, 'open accepted')
	BASE = `${HUB}api/desks/${opened.deskId}`
	const startupMs = Date.now() - startedAt
	budget({
		name: 'startup',
		actual: startupMs,
		limit: BUDGET_STARTUP_MS,
		unit: 'ms',
		note: '(hub start → desk opened on it)',
	})

	const stateText = await getText('/state')
	const state = JSON.parse(stateText)
	assert.equal(state.mode, 'repo')
	assert.ok(
		state.changes.length >= FILE_COUNT,
		`desk has ${FILE_COUNT}+ changes to review`,
	)
	const stateBytes = Buffer.byteLength(stateText, 'utf8')
	budget({
		name: '/api/state size',
		actual: stateBytes,
		limit: BUDGET_STATE_BYTES,
		unit: ' bytes',
		note: '',
	})
	assert.equal('rawDiff' in state, false, 'rawDiff stays backend-only')
	assert.ok(
		state.files.every(
			f => !('hunks' in f) && !('oldFile' in f) && !('newFile' in f),
		),
		'no diff bodies ride /api/state',
	)
	assert.ok(
		state.files.every(f => typeof f.hasHunks === 'boolean'),
		'every file has a hunk-presence summary',
	)
	assert.ok(!stateText.includes('"contents"'), 'state has no contents field')
	const oversized = state.files.find(f => f.path === 'generated-bundle.txt')
	assert.equal(
		oversized?.oversized,
		true,
		'the oversized generated file is stamped',
	)
	assert.ok(
		state.files.every(f => typeof f.changeKind === 'string'),
		'every file carries a changeKind stamp',
	)

	const [repoHashDir] = readdirSync(path.join(homeDir, '.syneva'))
	const sessionDir = path.join(homeDir, '.syneva', repoHashDir, ID)
	const persistedName = readdirSync(sessionDir).find(n => n.endsWith('.json'))
	assert.ok(persistedName, 'a persisted review file exists under ~/.syneva')
	const persistedPath = path.join(sessionDir, persistedName)
	const persistedBytes = statSync(persistedPath).size
	budget({
		name: 'persisted review file size',
		actual: persistedBytes,
		limit: BUDGET_PERSISTED_BYTES,
		unit: ' bytes',
		note: '',
	})
	const persistedText = readFileSync(persistedPath, 'utf8')
	assert.ok(
		!persistedText.includes('"oldFile"'),
		'persisted file has no oldFile field',
	)
	assert.ok(
		!persistedText.includes('"newFile"'),
		'persisted file has no newFile field',
	)
	assert.ok(
		!persistedText.includes('"contents"'),
		'persisted file has no contents field',
	)
	process.stdout.write('  ✓ persisted review file is content-free\n')

	const uiOutputs = JSON.parse(readFileSync(UI_MANIFEST, 'utf8'))
	const { initial: bundleBytes } = checkBundleBudget(uiOutputs, 'dist/ui.js')
	budget({
		name: 'initial UI module graph size',
		actual: bundleBytes,
		limit: INITIAL_UI_BYTES_LIMIT,
		unit: ' bytes',
		note: '(belt-and-suspenders with the build gate)',
	})

	// `syneva reload` after a working-tree touch.
	writeFileSync(
		path.join(dirA, 'file-0.txt'),
		`line one 0 CHANGED AGAIN\nline two 0\nline three 0\n`,
	)
	const reloadStart = Date.now()
	const reloaded = JSON.parse(
		cli('reload', '--hub', HUB, '--repo', tmp, '--session', ID),
	)
	const reloadMs = Date.now() - reloadStart
	assert.ok(reloaded.ok, 'reload accepted')
	budget({
		name: 'reload',
		actual: reloadMs,
		limit: BUDGET_RELOAD_MS,
		unit: 'ms',
		note: '',
	})

	const closed = JSON.parse(
		cli('close', '--hub', HUB, '--repo', tmp, '--session', ID),
	)
	assert.ok(closed.ok, 'close acked')

	process.stdout.write('\nPERF SMOKE PASS\n')
	process.stdout.write(
		`${JSON.stringify({ startupMs, stateBytes, persistedBytes, bundleBytes, reloadMs }, null, JSON_INDENT)}\n`,
	)
} catch (error) {
	process.stderr.write(
		`\nPERF SMOKE FAIL: ${error instanceof Error ? error.message : String(error)}\n`,
	)
	process.exitCode = 1
} finally {
	cleanup()
}
