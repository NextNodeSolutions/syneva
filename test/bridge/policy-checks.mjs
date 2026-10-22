// The probe's client policy (RFC 0001, 4.3) on a hub started with SYNEVA_BRIDGE_WAIT_SCALE, so
// its waits pass in seconds (unset, they stay the RFC's): a ping every interval, a silent web
// dropped at the pong deadline, the wait each close code and each refused upgrade names, the
// backoff otherwise, and the two stops (4001, a 401 upgrade) that only the reconnect route ends.
import { setTimeout as delay } from 'node:timers/promises'

import {
	BRIDGE_LIMITS,
	CLOSE_CODES,
	TOO_MANY_STATUS,
} from '../../packages/contracts/dist/bridge.js'
import { waitFor } from '../stream/stream-client.mjs'

import {
	HTTP_FORBIDDEN,
	HTTP_TOO_MANY,
	HTTP_UNAUTHORIZED,
	HTTP_UNAVAILABLE,
} from './http-wire.mjs'
import { waitUntil } from './hub-process.mjs'
import { isPairing, readLocal } from './pairing-checks.mjs'
import {
	checkWords,
	control,
	nextUpgrade,
	opened,
	reconnect,
	LATE_MS,
	scaled,
	settledLink,
	SLACK_MS,
	WAIT_SCALE,
} from './policy-wire.mjs'

// A close code no rule names: the backoff.
const OTHER_CODE = 4000
const PINGS_MEASURED = 4
// How long a stopped probe is watched for an attempt it must not make.
const STOP_WATCH_MS = 1500
const MEDIAN = 0.5
const PING_TOLERANCE = 0.5
// How the Hub page says the connected cap, a `tooMany` close (whatever reason text the web gave,
// WEB_REASON) or an upgrade refused with TOO_MANY_STATUS.
const TOO_MANY_WORDS = /^too many hubs connected on this account/
const WEB_REASON = 'a reason of the web'

export async function checkPolicy(context) {
	context.report.section(`policy (every wait at ${WAIT_SCALE} of the RFC's)`)
	await checkPings(context)
	await checkSilence(context)
	const waits = [
		[CLOSE_CODES.rate, BRIDGE_LIMITS.rateWaitMs],
		[CLOSE_CODES.tooMany, BRIDGE_LIMITS.tooManyWaitMs, TOO_MANY_WORDS],
		[CLOSE_CODES.saturated, BRIDGE_LIMITS.saturatedWaitMs],
	]
	await inTurn(waits, ([code, waitMs, words]) =>
		checkCodeWait(context, { code, waitMs, words }),
	)
	await checkBackoff(context)
	const refusals = [
		[HTTP_FORBIDDEN, BRIDGE_LIMITS.saturatedWaitMs],
		[HTTP_TOO_MANY, BRIDGE_LIMITS.saturatedWaitMs],
		[HTTP_UNAVAILABLE, BRIDGE_LIMITS.saturatedWaitMs],
		[TOO_MANY_STATUS, BRIDGE_LIMITS.tooManyWaitMs, TOO_MANY_WORDS],
	]
	await inTurn(refusals, ([status, waitMs, words]) =>
		checkRefusedWait(context, { status, waitMs, words }),
	)
	await checkStop(context, 'unauthorized', async () => {
		await control(context.fake, '/__refuse', { status: HTTP_UNAUTHORIZED })
		await control(context.fake, '/__close', {
			hubId: context.record.hubId,
			code: OTHER_CODE,
		})
	})
	await checkStop(context, 'revoked', () =>
		control(context.fake, '/__close', {
			hubId: context.record.hubId,
			code: CLOSE_CODES.revoked,
		}),
	)
}

async function checkPings(context) {
	const link = await settledLink(context)
	await waitUntil(
		() => link.pings.length > PINGS_MEASURED,
		LATE_MS * PINGS_MEASURED,
		'pings',
	)
	const gaps = link.pings
		.slice(1)
		.map((at, index) => at - link.pings[index])
		.toSorted((a, b) => a - b)
	const median = gaps[Math.floor(gaps.length * MEDIAN)]
	const interval = scaled(BRIDGE_LIMITS.pingIntervalMs)
	context.report.check(
		`a ping every pingIntervalMs (${interval} ms scaled; median ${median} ms)`,
		Math.abs(median - interval) <= interval * PING_TOLERANCE,
	)
}

// The web stops answering pings: the probe drops the socket at the pong deadline after its next
// ping, says why, and connects again.
async function checkSilence(context) {
	const { report, fake, record, hub } = context
	const link = await settledLink(context)
	const local = await readLocal(hub)
	const frames = local.frames.length
	const from = fake.sockets.upgrades.length
	const silentAt = Date.now()
	await control(fake, '/__silence', { hubId: record.hubId })
	const deadline =
		scaled(BRIDGE_LIMITS.pingIntervalMs + BRIDGE_LIMITS.pongTimeoutMs) +
		SLACK_MS
	await report.step(
		`a silent web is dropped within a ping and its pong deadline (${deadline} ms)`,
		() =>
			waitUntil(
				() => link.closed && link.closed.at - silentAt <= deadline,
				deadline,
				'the drop',
			),
	)
	await report.step(
		"the hub's tabs read why: the web stopped answering pings",
		() =>
			waitFor(
				local,
				isPairing(pairing =>
					/stopped answering pings/.test(
						pairing.lastClose?.reason ?? '',
					),
				),
				{ from: frames },
			),
	)
	local.socket.close()
	const next = await nextUpgrade(
		fake,
		from,
		scaled(BRIDGE_LIMITS.backoffMaxMs) + SLACK_MS,
	)
	report.check('and it connects again', opened(next))
}

// `words`, when given: how the hub's tabs read that close (the Hub page's last close).
async function checkCodeWait(context, { code, waitMs, words }) {
	const { report, fake, record, hub } = context
	await settledLink(context)
	const local = words ? await readLocal(hub) : null
	const from = fake.sockets.upgrades.length
	const closedAt = Date.now()
	await control(fake, '/__close', {
		hubId: record.hubId,
		code,
		reason: WEB_REASON,
	})
	const wait = scaled(waitMs)
	const next = await nextUpgrade(fake, from, wait + LATE_MS)
	const gap = next.at - closedAt
	report.check(
		`${code}: the next attempt after its wait (${wait} ms scaled; ${gap} ms)`,
		gap >= wait && gap <= wait + SLACK_MS && opened(next),
	)
	if (!local) return
	checkWords(context, local, {
		what: `${code}`,
		ended: lastClose => lastClose?.code === code,
		words,
	})
}

async function checkBackoff(context) {
	const { report, fake, record } = context
	await settledLink(context)
	const from = fake.sockets.upgrades.length
	const closedAt = Date.now()
	await control(fake, '/__close', { hubId: record.hubId, code: OTHER_CODE })
	const bound = scaled(BRIDGE_LIMITS.backoffMaxMs)
	const next = await nextUpgrade(fake, from, bound + LATE_MS)
	const gap = next.at - closedAt
	report.check(
		`any other code (${OTHER_CODE}): the backoff, under backoffMaxMs (${bound} ms scaled; ${gap} ms)`,
		gap <= bound + SLACK_MS && opened(next),
	)
}

// An upgrade refused with `status`: the next attempt waits `waitMs`; `words`, when given, how the
// hub's tabs read that refusal.
async function checkRefusedWait(context, { status, waitMs, words }) {
	const { report, fake, record, hub } = context
	await settledLink(context)
	const local = words ? await readLocal(hub) : null
	await control(fake, '/__refuse', { status })
	const from = fake.sockets.upgrades.length
	await control(fake, '/__close', { hubId: record.hubId, code: OTHER_CODE })
	const wait = scaled(waitMs)
	const first = await nextUpgrade(
		fake,
		from,
		scaled(BRIDGE_LIMITS.backoffMaxMs) + LATE_MS,
	)
	const second = await nextUpgrade(fake, from + 1, wait + LATE_MS)
	await control(fake, '/__refuse', { status: 0 })
	const gap = second.at - first.at
	report.check(
		`an upgrade refused with ${status}: the next attempt after ${wait} ms scaled (${gap} ms)`,
		first.status === status && gap >= wait && gap <= wait + SLACK_MS,
	)
	const after = fake.sockets.upgrades.indexOf(second) + 1
	const reopened = await nextUpgrade(fake, after, wait + LATE_MS)
	report.check(
		`once lifted, the attempt after opens (${status})`,
		opened(reopened),
	)
	if (!local) return
	checkWords(context, local, {
		what: `HTTP ${status}`,
		ended: lastClose => lastClose?.status === status,
		words,
	})
}

// The probe stops for `reason`: its tabs read it, it makes no attempt, and the reconnect route
// (what `syneva login` calls) starts it again.
async function checkStop(context, reason, provoke) {
	const { report, fake, hub } = context
	await settledLink(context)
	const local = await readLocal(hub)
	const frames = local.frames.length
	await provoke()
	await report.step(`stopped (${reason}): the hub's tabs read it`, () =>
		waitFor(
			local,
			isPairing(
				pairing =>
					pairing.link?.state === 'stopped' &&
					pairing.link.reason === reason,
			),
			{ from: frames },
		),
	)
	local.socket.close()
	const count = fake.sockets.upgrades.length
	await delay(STOP_WATCH_MS)
	report.check(
		`stopped (${reason}): no attempt since`,
		fake.sockets.upgrades.length === count,
	)
	await control(fake, '/__refuse', { status: 0 })
	const { pairing } = await reconnect(hub)
	report.check(
		`stopped (${reason}): the reconnect route connects it again`,
		pairing?.link?.state === 'connected',
	)
}

// One check after the other: each closes the socket the next one needs settled.
async function inTurn(cases, check) {
	await cases.reduce(async (previous, each) => {
		await previous
		await check(each)
	}, Promise.resolve())
}
