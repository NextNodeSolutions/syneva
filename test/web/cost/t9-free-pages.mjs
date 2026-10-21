// T9 free pages (RFC 0001, 6.7; guards R9, 6.1 B6): the bundle is served by the asset layer and
// never invokes the Worker, so loading `/`, `/reviews` and `/d/<id>/` fifty times moves the
// Worker's invocation count by the page shells only. On a deployed Worker that is an Analytics
// read (invocations against asset requests); locally `wrangler dev` records every Worker
// invocation as a root span, and a request an asset answered makes none. Note that its stdout
// prints a request line for assets too, so it cannot tell them apart.
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { delay } from './fakes/timing.mjs'
import { iso } from './hold.mjs'
import { describeRequests, invocationTotal } from './observe.mjs'

const CLIENT = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	'..',
	'..',
	'..',
	'apps/web/dist/client',
)
const LOADS = 50
const BATCH = 10
const ROUNDS = 3
const SETTLE_MS = 400
const HTTP_OK = 200
const HTTP_MOVED = 301
const HTTP_NOT_MODIFIED = 304

async function run(ctx) {
	const { report } = ctx
	const account = await ctx.account(0)
	const hub = await ctx.hub(account, 0)
	const font = readdirSync(path.join(CLIENT, 'fonts')).find(name =>
		name.endsWith('.woff2'),
	)
	const assets = ['/ui.js', '/dashboard.js', '/styles.css', `/fonts/${font}`]
	const shells = ['/', '/reviews', `/d/${hub.hubId}cafe/`]
	await delay(SETTLE_MS)
	const stdoutFrom = ctx.web.output.text.length
	const first = await loadRound(ctx, account, [...assets, ...shells])
	if (!ctx.staging) noteStdout(ctx, stdoutFrom, assets)
	for (const route of assets)
		assetHeaders(report, route, first.served.get(route))
	for (const route of shells)
		shellHeaders(report, route, first.served.get(route))
	await conditional(ctx, account, assets[0])
	if (!ctx.staging)
		await invocationsOnlyByShells(ctx, account, { assets, shells, first })
	ctx.printReads('T9', {
		from: iso(first.startedAt),
		to: iso(first.endedAt),
		pageRequests: shells.length * LOADS,
	})
}

// Every route loaded LOADS times, a few at a time. Locally each batch waits for the Explorer to
// record it before the next goes: its collector drops records when it falls behind.
async function loadRound(ctx, account, routes) {
	const startedAt = Date.now()
	const served = new Map()
	for (const route of routes)
		served.set(route, await loadMany(ctx, account, { route, startedAt }))
	return { startedAt, endedAt: Date.now(), served }
}

// The Worker's invocations over a round of loads, per path: the shells ran it once a load, no asset
// ran it. The Explorer is a lossy instrument under load (it once recorded 37 of 150 shell loads
// after the other tests), so a round is evidence only when it recorded every shell load: then it
// would have recorded an asset that ran the Worker too. Up to ROUNDS rounds, the first included.
async function invocationsOnlyByShells(
	ctx,
	account,
	{ assets, shells, first },
) {
	const expected = shells.length * LOADS
	let round = first
	for (let at = 1; at <= ROUNDS; at += 1) {
		const seen = await ctx.explorer.settledRequests(
			round.startedAt,
			round.endedAt,
		)
		if (seen === null)
			return ctx.notMeasured(
				'T9: the Worker invocations per path',
				'no local Explorer answered',
			)
		const recorded = shells.map(route => seen.get(`GET ${route}`) ?? 0)
		if (recorded.every(count => count >= LOADS))
			return judgeInvocations(ctx, seen, { assets, expected })
		ctx.note(
			`round ${at}: the Explorer recorded ${recorded.reduce((sum, count) => sum + count, 0)} of ${expected} shell loads (it fell behind), so it could have missed an asset's too`,
		)
		if (at < ROUNDS)
			round = await loadRound(ctx, account, [...assets, ...shells])
	}
	return ctx.notMeasured(
		'T9: the Worker invocations per path',
		`the Explorer missed shell loads in each of ${ROUNDS} rounds, so its count is no evidence`,
	)
}

function judgeInvocations({ report }, seen, { assets, expected }) {
	const moved = invocationTotal(seen)
	const byAssets = assets.filter(route => seen.has(`GET ${route}`))
	report.check(
		`${assets.length * LOADS} asset requests and ${expected} page-shell requests moved the Worker's invocations by ${moved}: exactly the shells, so no asset ran the Worker`,
		moved === expected && !byAssets.length,
		describeRequests(seen),
	)
}

// `wrangler dev` prints a request line for an asset as for a page: stdout cannot tell them apart.
function noteStdout(ctx, from, assets) {
	const lines = ctx.web.output.text.slice(from).split('\n')
	const count = route =>
		lines.filter(line => line.includes(`] GET ${route} `)).length
	ctx.note(
		`wrangler dev's stdout has a request line for assets too (${assets.map(route => `${route} x${count(route)}`).join(', ')}): the Worker's invocations are read from its Explorer instead`,
	)
}

// `LOADS` GETs of one route, a few at a time; the last response's headers and the statuses.
async function loadMany(ctx, account, { route, startedAt }) {
	const statuses = []
	let last = null
	for (let at = 0; at < LOADS; at += BATCH) {
		const batch = await Promise.all(
			Array.from({ length: BATCH }, () => account.browser.fetch(route)),
		)
		for (const response of batch) {
			statuses.push(response.status)
			last = response
			await response.arrayBuffer()
		}
		if (!ctx.staging)
			await ctx.explorer.settledRequests(startedAt, Date.now())
	}
	return { statuses, headers: last.headers }
}

function assetHeaders(report, route, { statuses, headers }) {
	const cache = headers.get('cache-control') ?? ''
	report.check(
		`${LOADS} loads of ${route}: all ${HTTP_OK}, served with the assets' headers (an etag, no no-store, no cookie)`,
		statuses.every(status => status === HTTP_OK) &&
			Boolean(headers.get('etag')) &&
			!cache.includes('no-store') &&
			!headers.get('set-cookie'),
		`${[...new Set(statuses)].join(',')} cache-control "${cache}" etag ${headers.get('etag')}`,
	)
}

function shellHeaders(report, route, { statuses, headers }) {
	report.check(
		`${LOADS} loads of ${route}: the Worker's page shell (a 200 or a redirect, never cached)`,
		statuses.every(status => status === HTTP_OK || status === HTTP_MOVED) &&
			(headers.get('cache-control') ?? '').includes('no-store'),
		`${[...new Set(statuses)].join(',')} cache-control "${headers.get('cache-control')}"`,
	)
}

// The asset layer answers a conditional request by itself.
async function conditional(ctx, account, route) {
	const first = await account.browser.fetch(route)
	await first.arrayBuffer()
	const again = await account.browser.fetch(route, {
		headers: { 'if-none-match': first.headers.get('etag') ?? '' },
	})
	ctx.report.check(
		`${route} with If-None-Match is ${HTTP_NOT_MODIFIED}`,
		again.status === HTTP_NOT_MODIFIED,
		`${again.status}`,
	)
}

export const t9 = {
	id: 'T9',
	title: 'free pages',
	where: 'staging',
	run,
	dryRun: run,
}
