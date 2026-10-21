// The HTTP relay end to end (RFC 0001, 4.5): a tab's request through the fake's relay answers
// what the hub answers it locally (a read, a mutation that lands, a file's bytes), a large answer
// comes back in chunks, one past responseBytes as TOO_LARGE, a cancel leaves the hub healthy, and
// the hub routes that name desks and plans answer with web ids.
import { randomBytes } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { isDeepStrictEqual, promisify } from 'node:util'

import { BRIDGE_LIMITS } from '../../packages/contracts/dist/bridge.js'
import { deskApiBase, HUB_PATHS } from '../../packages/contracts/dist/routes.js'

import { HTTP_OK, HTTP_TOO_LARGE } from './http-wire.mjs'
import { webPlan } from './web-ids.mjs'

const MIB = 1_048_576
const SMALL_BYTES = 10_000
const LARGE_MIB = 3
// Over responseBytes (32 MiB).
const HUGE_MIB = 40
const RELAY_SESSION = 'bridge-check-relayed'

export async function checkRelay(context, desk) {
	const { report } = context
	report.section('relay')
	const web = webOf(context)
	const local = (route, init) => fetch(new URL(route, context.hub.url), init)
	const webState = await (
		await web(`${deskApiBase(desk.webId)}/state`)
	).json()
	const localState = await (
		await local(`${deskApiBase(desk.localId)}/state`)
	).json()
	report.check(
		'GET /state through the bridge is the local /state',
		isDeepStrictEqual(webState, localState),
	)
	await checkComment(context, desk, { web, local })
	await checkBlob(context, desk, { web, local })
	await checkLarge(context, desk, web)
	await checkHubRoutes(context, web)
}

// A request to the fake as a tab on the web sends it; hub routes name their hub by header.
export function webOf({ fake, record }) {
	return (route, init = {}) =>
		fetch(new URL(route, fake.origin), {
			...init,
			headers: { 'x-syneva-hub': record.hubId, ...init.headers },
		})
}

// A file of random bytes in the scratch repo, written off the event loop: the fake shares it, and
// a blocked loop would bunch the frames it stamps.
export async function writeRandom(repo, name, size) {
	const bytes = await promisify(randomBytes)(size)
	await fs.writeFile(path.join(repo.root, name), bytes)
	return bytes
}

const postJson = body => ({
	method: 'POST',
	headers: { 'content-type': 'application/json' },
	body: JSON.stringify(body),
})

async function checkComment({ report }, desk, { web, local }) {
	const note = `a reviewer note through the bridge ${Date.now()}`
	const posted = await web(
		`${deskApiBase(desk.webId)}/comment`,
		postJson({
			path: 'a.txt',
			lineNumber: 2,
			side: 'additions',
			body: note,
			role: 'user',
		}),
	)
	const state = await (
		await local(`${deskApiBase(desk.localId)}/state`)
	).text()
	report.check(
		'POST /comment through the bridge lands on the desk',
		posted.status === HTTP_OK && state.includes(note),
		String(posted.status),
	)
}

async function checkBlob({ report, repo }, desk, { web, local }) {
	const bytes = await writeRandom(repo, 'pixel.png', SMALL_BYTES)
	const route = `${deskApiBase(desk.webId)}/blob?path=pixel.png`
	const relayed = await web(route)
	const direct = await local(
		`${deskApiBase(desk.localId)}/blob?path=pixel.png`,
	)
	const [one, two] = await Promise.all([
		relayed.arrayBuffer(),
		direct.arrayBuffer(),
	])
	report.check(
		'GET /blob through the bridge: the same bytes and type as locally',
		Buffer.from(one).equals(Buffer.from(two)) &&
			Buffer.from(one).equals(bytes) &&
			relayed.headers.get('content-type') ===
				direct.headers.get('content-type'),
	)
}

// Over chunkBytes: `res { more }` without a body, then chunks of at most chunkBytes of base64,
// every frame under frameBytes, the bytes whole once reassembled. Over responseBytes: one
// `err TOO_LARGE`, 413 at the tab.
async function checkLarge({ report, repo, fake, record }, desk, web) {
	const large = await writeRandom(repo, 'large.bin', LARGE_MIB * MIB)
	const from = fake.sockets.frames.length
	const raw = fake.relay.raw(record.hubId, {
		method: 'GET',
		path: `${deskApiBase(desk.webId)}/blob`,
		query: '?path=large.bin',
	})
	const frames = await raw.done
	const [head, ...chunks] = frames
	const sizes = fake.sockets.frames
		.slice(from)
		.filter(each => each.frame?.id === raw.id)
	report.check(
		`a ${LARGE_MIB} MiB answer: res { more } then ${chunks.length} chunks under chunkBytes, reassembled whole`,
		head?.t === 'res' &&
			head.more === true &&
			!('body' in head) &&
			chunks.length > 1 &&
			chunks.every(
				chunk =>
					chunk.t === 'chunk' &&
					chunk.data.length <= BRIDGE_LIMITS.chunkBytes,
			) &&
			sizes.every(each => each.bytes <= BRIDGE_LIMITS.frameBytes) &&
			Buffer.concat(
				chunks.map(chunk => Buffer.from(chunk.data, 'base64')),
			).equals(large),
	)
	const relayed = Buffer.from(
		await (
			await web(`${deskApiBase(desk.webId)}/blob?path=large.bin`)
		).arrayBuffer(),
	)
	report.check(
		'the same answer through the fake relay reads whole',
		relayed.equals(large),
	)
	await checkTooLarge({ report, repo, fake, record }, desk, web)
}

async function checkTooLarge({ report, repo, fake, record }, desk, web) {
	await writeRandom(repo, 'huge.bin', HUGE_MIB * MIB)
	const huge = fake.relay.raw(record.hubId, {
		method: 'GET',
		path: `${deskApiBase(desk.webId)}/blob`,
		query: '?path=huge.bin',
	})
	const failed = await huge.done
	const tab = await web(`${deskApiBase(desk.webId)}/blob?path=huge.bin`)
	report.check(
		`a ${HUGE_MIB} MiB answer is one err TOO_LARGE (413 at the tab)`,
		failed.length === 1 &&
			failed[0].t === 'err' &&
			failed[0].code === 'TOO_LARGE' &&
			tab.status === HTTP_TOO_LARGE,
		JSON.stringify(failed.map(frame => frame.t)),
	)
}

// The hub routes the web relays name their desk and plan by web id: an open answers the desk's
// web id and page, a close its web id; the plan list is /api/hub/plans with web ids.
async function checkHubRoutes({ report, repo, record, driver }, web) {
	const opened = await web(
		HUB_PATHS.desks,
		postJson({
			root: repo.root,
			session: RELAY_SESSION,
			noGuide: true,
			hubId: record.hubId,
		}),
	)
	const { desk } = await opened.json()
	const isWebId =
		desk?.id?.startsWith(record.hubId) && desk.path === `/d/${desk.id}/`
	report.check(
		'POST /api/hub/desks through the bridge answers the web id and page',
		opened.status === HTTP_OK && isWebId,
	)
	const closed = await web(`${HUB_PATHS.desks}/${desk?.id}`, {
		method: 'DELETE',
	})
	const body = await closed.json()
	report.check(
		'DELETE /api/hub/desks/<web id> closes it and answers its web id',
		closed.status === HTTP_OK &&
			body.closed === true &&
			body.id === desk?.id,
	)
	const plans = await (await web(HUB_PATHS.plans)).json()
	const { body: listed } = await driver.json(HUB_PATHS.plans)
	report.check(
		'GET /api/hub/plans through the bridge: the plans with web ids',
		listed.plans.length > 0 &&
			isDeepStrictEqual(
				plans.plans,
				listed.plans.map(plan => webPlan(record.hubId, plan)),
			),
	)
}
