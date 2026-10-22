// T2 flood (RFC 0001, 6.7; guards R6, 6.1 B1, B2): a hub socket past its budget is closed `rate`
// within a second, a tab that says anything but a ping `malformed`, a frame the object cannot
// trust `malformed` or `rate`, the 9th hub's and the 33rd tab's upgrades refused - and none of it
// touches the person's other sockets.
import {
	BRIDGE_LIMITS,
	CLOSE_CODES,
	PING_TEXT,
	PONG_TEXT,
	TOO_MANY_STATUS,
} from '../../../packages/contracts/dist/bridge.js'

import { delay, within } from './fakes/timing.mjs'
import { closeOf, describeClose, isOpen, openHub } from './sockets.mjs'

const CONTROL_HUB = 5
const FLOOD_PER_SECOND = 1000
const CLOSE_WITHIN_MS = 1000
const BIG_FRAME_BYTES = 900 * 1024
const BIG_FRAMES = 3
const CLOSE_WAIT_MS = 5000
const EXTRA_TABS = BRIDGE_LIMITS.tabsPerUser - 1

async function run(ctx) {
	const { report } = ctx
	const account = await ctx.account(0)
	const control = {
		hub: await openHub(ctx, account, CONTROL_HUB, {
			pingMs: BRIDGE_LIMITS.pingIntervalMs,
		}),
		tab: await ctx.tab(account, { pingMs: BRIDGE_LIMITS.pingIntervalMs }),
	}
	const untouched = what =>
		report.check(
			`after ${what}, the person's other hub and tab are still open`,
			isOpen(control.hub, control.tab),
			`hub ${control.hub.isOpen}, tab ${control.tab.isOpen}`,
		)
	await frameFlood(ctx, account, untouched)
	await byteFlood(ctx, account, untouched)
	await hubBreaks(ctx, account, untouched)
	await tabBreaks(ctx, account, untouched)
	await caps(ctx, account, control, untouched)
	ctx.printReads('T2', { from: null, to: null })
}

// 1,000 valid `pulse` frames a second: closed within a second.
async function frameFlood(ctx, account, untouched) {
	const hub = await openHub(ctx, account, 0)
	const flood = hub.flood({ perSecond: FLOOD_PER_SECOND, seconds: 3 })
	const closed = await closeOf(hub, CLOSE_WAIT_MS)
	const { sent, startedAt } = await flood
	ctx.report.check(
		`a hub sending ${FLOOD_PER_SECOND} frames/s is closed ${CLOSE_CODES.rate} (rate)`,
		closed?.code === CLOSE_CODES.rate,
		describeClose(closed),
	)
	ctx.report.check(
		`... within ${CLOSE_WITHIN_MS} ms of its first frame (${sent} sent)`,
		Boolean(closed) && closed.at - startedAt <= CLOSE_WITHIN_MS,
		`${closed ? closed.at - startedAt : '-'} ms`,
	)
	untouched('the frame flood')
}

// Few, large frames: three of 900 KiB are over 2 MiB in a second.
async function byteFlood(ctx, account, untouched) {
	const hub = await openHub(ctx, account, 1)
	const startedAt = Date.now()
	for (let sent = 0; sent < BIG_FRAMES; sent += 1)
		hub.send(hub.pulse(BIG_FRAME_BYTES))
	const closed = await closeOf(hub, CLOSE_WAIT_MS)
	ctx.report.check(
		`${BIG_FRAMES} frames of ${BIG_FRAME_BYTES / 1024} KiB (over ${BRIDGE_LIMITS.bytesPerSecond / 1_048_576} MiB/s) close the hub ${CLOSE_CODES.rate}`,
		closed?.code === CLOSE_CODES.rate,
		describeClose(closed),
	)
	ctx.report.check(
		`... within ${CLOSE_WITHIN_MS} ms`,
		Boolean(closed) && closed.at - startedAt <= CLOSE_WITHIN_MS,
		`${closed ? closed.at - startedAt : '-'} ms`,
	)
	untouched('the byte flood')
}

// What a hub must never send: another hub's frame (rate), a frame over frameBytes, text that is
// no frame, a binary frame, a kind only the object sends (malformed).
async function hubBreaks(ctx, account, untouched) {
	const cases = [
		{
			name: "a frame naming another hub's id",
			code: CLOSE_CODES.rate,
			act: hub =>
				hub.sendJson({
					t: 'pulse',
					hubId: foreign(hub.hubId),
					deskId: 'cafe',
					pulse: {},
				}),
		},
		{
			name: `a frame of frameBytes + 1 (${BRIDGE_LIMITS.frameBytes + 1} bytes)`,
			code: CLOSE_CODES.malformed,
			act: hub => hub.send('x'.repeat(BRIDGE_LIMITS.frameBytes + 1)),
		},
		{
			name: 'text that is no frame',
			code: CLOSE_CODES.malformed,
			act: hub => hub.send('this is not json'),
		},
		{
			name: 'a binary frame',
			code: CLOSE_CODES.malformed,
			act: hub => hub.sendBinary(),
		},
		{
			name: 'a `hub` frame (a kind only the object sends)',
			code: CLOSE_CODES.malformed,
			act: hub =>
				hub.sendJson({
					t: 'hub',
					hubId: hub.hubId,
					name: 'x',
					online: true,
				}),
		},
	]
	for (const [at, each] of cases.entries()) {
		const hub = await openHub(ctx, account, 2 + (at % 3))
		each.act(hub)
		const closed = await closeOf(hub, CLOSE_WAIT_MS)
		ctx.report.check(
			`a hub sending ${each.name} is closed ${each.code}`,
			closed?.code === each.code,
			describeClose(closed),
		)
		untouched(each.name)
	}
}

function foreign(hubId) {
	return `${hubId[0] === '0' ? '1' : '0'}${hubId.slice(1)}`
}

// A tab says nothing but a ping: text, binary - closed `malformed`; a ping is answered.
async function tabBreaks(ctx, account, untouched) {
	const text = await ctx.tab(account)
	text.send('{"t":"snapshot?"}')
	const closedText = await closeOf(text, CLOSE_WAIT_MS)
	ctx.report.check(
		`a tab sending a non-ping text frame is closed ${CLOSE_CODES.malformed}`,
		closedText?.code === CLOSE_CODES.malformed,
		describeClose(closedText),
	)
	untouched('a tab sent text')
	const binary = await ctx.tab(account)
	binary.sendBinary()
	const closedBinary = await closeOf(binary, CLOSE_WAIT_MS)
	ctx.report.check(
		`a tab sending a binary frame is closed ${CLOSE_CODES.malformed}`,
		closedBinary?.code === CLOSE_CODES.malformed,
		describeClose(closedBinary),
	)
	untouched('a tab sent binary')
	const polite = await ctx.tab(account)
	const asked = polite.frames.length
	polite.send(PING_TEXT)
	await delay(500)
	ctx.report.check(
		'a tab pinging is answered with the pong and stays open',
		polite.isOpen &&
			polite.frames.slice(asked).some(each => each.text === PONG_TEXT),
		`${polite.frames.length - asked} frames`,
	)
	polite.close()
}

// hubsPerUser hubs fit; the next upgrade is refused with TOO_MANY_STATUS, where R6 closes it
// `tooMany`: a close the object issues as it accepts a socket never reaches the client under
// workerd, so it accepts none (RFC 0001, 12.3). Likewise tabsPerUser tabs.
async function caps(ctx, account, control, untouched) {
	const hubs = [control.hub]
	for (let index = 0; index < BRIDGE_LIMITS.hubsPerUser; index += 1)
		if (index !== CONTROL_HUB) hubs.push(await openHub(ctx, account, index))
	ctx.report.check(
		`${BRIDGE_LIMITS.hubsPerUser} hubs of one person are open together`,
		isOpen(...hubs),
		`${hubs.filter(hub => hub.isOpen).length} open`,
	)
	const ninth = await ctx.hub(account, BRIDGE_LIMITS.hubsPerUser)
	const outcome = await within(
		10_000,
		'the 9th hub upgrade',
		ninth.connect({ answerSnapshots: false }),
	)
	ctx.report.check(
		`the ${BRIDGE_LIMITS.hubsPerUser + 1}th hub's upgrade is refused ${TOO_MANY_STATUS} (too many)`,
		outcome === TOO_MANY_STATUS,
		`${outcome}`,
	)
	ctx.report.check(
		'... and the eight before it are still open',
		isOpen(...hubs),
		`${hubs.filter(hub => hub.isOpen).length} open`,
	)
	const tabs = [control.tab]
	for (let count = 0; count < EXTRA_TABS; count += 1)
		tabs.push(await ctx.tab(account))
	ctx.report.check(
		`${BRIDGE_LIMITS.tabsPerUser} tabs of one person are open together`,
		isOpen(...tabs),
		`${tabs.filter(tab => tab.isOpen).length} open`,
	)
	const last = await ctx.tab(account, { connect: false })
	const lastOutcome = await last.connect()
	ctx.report.check(
		`the ${BRIDGE_LIMITS.tabsPerUser + 1}rd tab's upgrade is refused ${TOO_MANY_STATUS}`,
		lastOutcome === TOO_MANY_STATUS,
		`${lastOutcome}`,
	)
	ctx.report.check(
		'... and the 32 before it are still open',
		isOpen(...tabs),
		`${tabs.filter(tab => tab.isOpen).length} open`,
	)
	untouched('the caps')
}

export const t2 = {
	id: 'T2',
	title: 'flood',
	where: 'local',
	run,
}
