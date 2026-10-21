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

const CLIENT = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	'..',
	'..',
	'..',
	'apps/web/dist/client',
)
const LOADS = 50
const BATCH = 10
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
	const before = await ctx.explorer.baseline()
	const startedAt = Date.now()
	const stdoutFrom = ctx.web.output.text.length
	const served = new Map()
	for (const route of [...assets, ...shells])
		served.set(route, await loadMany(account, route))
	const endedAt = Date.now()
	await delay(SETTLE_MS)
	if (!ctx.staging) noteStdout(ctx, stdoutFrom, assets)
	const after = await ctx.explorer.settledInvocations()
	for (const route of assets) assetHeaders(report, route, served.get(route))
	for (const route of shells) shellHeaders(report, route, served.get(route))
	await conditional(ctx, account, assets[0])
	const pageRequests = shells.length * LOADS
	if (before === null || after === null) {
		ctx.note(
			'no local Explorer: the invocation count was not read here (staging: the Analytics read below)',
		)
	} else {
		const moved = after - before
		report.check(
			`${assets.length * LOADS} asset requests and ${pageRequests} page-shell requests moved the Worker's invocations by ${moved}: exactly the shells, so no asset ran the Worker`,
			moved === pageRequests,
			`${moved} invocations, ${pageRequests} shell requests`,
		)
		if (moved < pageRequests)
			ctx.note(
				`incomplete evidence: the Explorer recorded ${moved} of ${pageRequests} shell invocations; repeat with a complete Analytics read`,
			)
	}
	ctx.printReads('T9', {
		from: iso(startedAt),
		to: iso(endedAt),
		pageRequests,
	})
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
async function loadMany(account, route) {
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
