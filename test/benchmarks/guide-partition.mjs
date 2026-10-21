// How good and how fast the drafted guide is on a real changeset: builds the review of <base>..<head> as a pr desk would (by ref, nothing checked out, no hub), drafts its guide, and scores the domains against the commits that wrote each changed block (git blame).
// Run from the repo root after `pnpm build`: node test/benchmarks/guide-partition.mjs [--repo <path>] [--base <ref>] [--head <ref>] [--record <id> --note <text>].
import { execFile } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseArgs, promisify } from 'node:util'

import { buildReviewState } from '../../packages/core/dist/application/build.js'
import { changeKey } from '../../packages/core/dist/domain/change-blocks.js'
import { redraftGuide } from '../../packages/core/dist/domain/guide-redraft.js'
import { nodeGit } from '../../packages/local/dist/adapters/outbound/git/repo.js'

import {
	linkCohesion,
	normalizedMutualInformation,
	purity,
} from './partition-metrics.mjs'

const run = promisify(execFile)
const HISTORY = path.join(import.meta.dirname, 'guide-partition.json')
const BLAME_CONCURRENCY = 8
// 256 MiB: a blame of a large generated file runs to tens of megabytes.
const GIT_BUFFER = 268_435_456
const SHORT_SHA = 10
const PRECISION = 1000
const JSON_INDENT = 2
const COMMIT_HEADER = /^([0-9a-f]{40}) \d+ (\d+)/

async function git(root, args) {
	const { stdout } = await run('git', ['-C', root, ...args], {
		maxBuffer: GIT_BUFFER,
	})
	return stdout.trim()
}

// Per line of the file at head, the commit of the range that wrote it; lines older than base are left out.
async function blameLines(root, range, file) {
	const porcelain = await git(root, [
		'blame',
		'--porcelain',
		range,
		'--',
		file,
	])
	const lines = new Map()
	const boundary = new Set()
	let commit = ''
	for (const line of porcelain.split('\n')) {
		if (line === 'boundary') boundary.add(commit)
		const header = COMMIT_HEADER.exec(line)
		if (!header) continue
		const [, sha = '', finalLine = ''] = header
		commit = sha
		lines.set(Number(finalLine), sha)
	}
	return new Map([...lines].filter(([, sha]) => !boundary.has(sha)))
}

// A few blames at a time, each lane taking every BLAME_CONCURRENCY-th file in turn.
async function blameFiles(root, range, files) {
	const blamed = new Map()
	const lanes = Array.from({ length: BLAME_CONCURRENCY }, (_slot, lane) =>
		files.filter((_file, index) => index % BLAME_CONCURRENCY === lane),
	)
	await Promise.all(
		lanes.map(lane =>
			lane.reduce(
				(chain, file) =>
					chain.then(async () =>
						blamed.set(file, await blameLines(root, range, file)),
					),
				Promise.resolve(blamed),
			),
		),
	)
	return blamed
}

// A block's commit is the one that wrote most of its lines; a block of removed lines only has none and is left out of the score.
function commitOf(change, blamed) {
	if (change.side !== 'additions') return undefined
	const lines = blamed.get(change.path)
	const end = change.endLine ?? change.lineNumber
	const votes = new Map()
	for (let line = change.lineNumber; line <= end; line += 1) {
		const sha = lines?.get(line)
		if (sha) votes.set(sha, (votes.get(sha) ?? 0) + 1)
	}
	const [best] = [...votes].toSorted(([, a], [, b]) => b - a)
	return best?.[0]
}

function domainOfKeys(resolution) {
	return new Map(
		Object.entries(resolution.domains).flatMap(([id, entry]) =>
			entry.units.map(unit => [unit.key, id]),
		),
	)
}

async function measure(root, base, head) {
	const started = performance.now()
	const query = {
		mode: 'pr',
		session: 'bench',
		staged: false,
		base,
		head,
		target: head,
	}
	const state = await buildReviewState(root, query, nodeGit)
	if (!state) throw new Error(`No changes between ${base} and ${head}.`)
	const built = performance.now()
	const drafted = redraftGuide({ ...state, guideExpected: true }, undefined)
	const finished = performance.now()
	return {
		state,
		drafted,
		buildMs: Math.round(built - started),
		draftMs: Math.round(finished - built),
	}
}

function score(state, drafted, blamed) {
	const domains = domainOfKeys(drafted.guideResolution)
	const blocks = state.changes.map(change => ({
		domain: domains.get(changeKey(change)) ?? '',
		commit: commitOf(change, blamed),
		node: change.symbol ? `${change.path}#${change.symbol.name}` : '',
		links: change.links ?? [],
	}))
	const pairs = blocks.flatMap(block =>
		block.commit ? [[block.commit, block.domain]] : [],
	)
	const sizes = [...domains.values()].reduce(
		(counts, id) => counts.set(id, (counts.get(id) ?? 0) + 1),
		new Map(),
	)
	const commits = new Set(pairs.map(([commit]) => commit)).size
	// One commit is no reference: every domain agrees with it and none is informative.
	const rounded = metric =>
		commits > 1 ? Math.round(metric * PRECISION) / PRECISION : null
	return {
		blocks: blocks.length,
		scored: pairs.length,
		commits,
		domains: drafted.guide?.domains.length ?? 0,
		largestDomain: Math.max(0, ...sizes.values()),
		unassigned: drafted.guideResolution?.unassigned.units.length ?? 0,
		nmi: rounded(normalizedMutualInformation(pairs)),
		purity: rounded(purity(pairs)),
		linkCohesion: Math.round(linkCohesion(blocks) * PRECISION) / PRECISION,
	}
}

function record(entry) {
	const history = existsSync(HISTORY)
		? JSON.parse(readFileSync(HISTORY, 'utf8'))
		: { runs: [] }
	const runs = [...history.runs.filter(other => other.id !== entry.id), entry]
	writeFileSync(HISTORY, `${JSON.stringify({ runs }, null, '\t')}\n`)
}

const { values } = parseArgs({
	options: {
		repo: { type: 'string', default: process.cwd() },
		base: { type: 'string' },
		head: { type: 'string', default: 'HEAD' },
		record: { type: 'string' },
		note: { type: 'string', default: '' },
	},
})
const root = await git(values.repo, ['rev-parse', '--show-toplevel'])
const head = await git(root, ['rev-parse', values.head])
const base = await git(root, ['merge-base', values.base ?? 'main', head])
const { state, drafted, buildMs, draftMs } = await measure(root, base, head)
const additions = state.changes.filter(change => change.side === 'additions')
const blamed = await blameFiles(root, `${base}..${head}`, [
	...new Set(additions.map(change => change.path)),
])
// A worktree is named after the repository it belongs to, not its own folder.
const commonDir = await git(root, [
	'rev-parse',
	'--path-format=absolute',
	'--git-common-dir',
])
const partition = {
	repo: path.basename(path.dirname(commonDir)),
	base: base.slice(0, SHORT_SHA),
	head: head.slice(0, SHORT_SHA),
	buildMs,
	draftMs,
	...score(state, drafted, blamed),
}
process.stdout.write(`${JSON.stringify(partition, null, JSON_INDENT)}\n`)
if (values.record)
	record({
		id: values.record,
		date: new Date().toISOString(),
		note: values.note,
		...partition,
	})
