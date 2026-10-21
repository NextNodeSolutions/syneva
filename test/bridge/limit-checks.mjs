// The probe's bounds as the web measures them (RFC 0001, 4.4): a busy agent's 50 comments raise
// coalesced frames, and nothing the hub sent - stream, pings aside, and relays alike - ever went
// past framesPerSecond or bytesPerSecond in any one second at the fake, whose token bucket (the
// object's) never closed the socket with `rate`.
import { setTimeout as delay } from 'node:timers/promises'

import { BRIDGE_LIMITS } from '../../packages/contracts/dist/bridge.js'

import { isJournal } from './web-ids.mjs'

const COMMENTS = 50
// Comments in flight at once: a busy loop of CLI calls.
const CONCURRENCY = 10
const SESSION = 'bridge-check-burst'
const MS_PER_S = 1000
const QUIET_WINDOWS = 4

// One comment of the burst, as an agent writes it.
function note(at) {
	return [
		'comment',
		'--path',
		'a.txt',
		'--line',
		'2',
		'--body',
		`burst ${at}`,
	]
}

export async function checkBurst(context) {
	const { report, driver, repo, record, fake } = context
	report.section('limits')
	const cli = args => driver.cli([...args, '--session', SESSION], repo.root)
	await cli(['open', '--no-open', '--no-guide'])
	const { body } = await driver.json('/api/hub/desks')
	const local = body.desks.find(each => each.session === SESSION)
	const webId = `${record.hubId}${local?.id}`
	const from = fake.sockets.frames.length
	const lanes = Array.from({ length: CONCURRENCY }, (_lane, lane) =>
		runLane(cli, lane),
	)
	const codes = (await Promise.all(lanes)).flat()
	await delay(BRIDGE_LIMITS.coalesceMs * QUIET_WINDOWS)
	const frames = fake.sockets.frames.slice(from)
	const replies = frames
		.filter(each => isJournal('agent-replied', webId)(each.frame))
		.flatMap(each => each.frame.events)
		.filter(
			event => event.kind === 'agent-replied' && event.deskId === webId,
		)
	report.check(
		`${COMMENTS} CLI comments in a busy loop: every one sent, every one on the web (${replies.length})`,
		codes.every(code => code === 0) && replies.length === COMMENTS,
	)
	const peak = peaks(frames)
	report.check(
		`their frames stay under the limits (peak ${peak.frames} frames, ${peak.bytes} bytes in a second)`,
		peak.frames <= BRIDGE_LIMITS.framesPerSecond &&
			peak.bytes <= BRIDGE_LIMITS.bytesPerSecond,
	)
	await cli(['close'])
}

async function runLane(cli, lane) {
	const codes = []
	const next = async at => {
		if (at >= COMMENTS) return
		const { code } = await cli(note(at))
		codes.push(code)
		await next(at + CONCURRENCY)
	}
	await next(lane)
	return codes
}

// Over the whole run: the most frames and bytes any one second held, at the fake.
export function checkRates({ report, fake }) {
	report.section('rates over the whole run')
	const peak = peaks(fake.sockets.frames)
	report.check(
		`never past framesPerSecond (${BRIDGE_LIMITS.framesPerSecond}): peak ${peak.frames} in any second`,
		peak.frames <= BRIDGE_LIMITS.framesPerSecond,
	)
	report.check(
		`never past bytesPerSecond (${BRIDGE_LIMITS.bytesPerSecond}): peak ${peak.bytes} in any second`,
		peak.bytes <= BRIDGE_LIMITS.bytesPerSecond,
		peak.window?.join(' '),
	)
	report.check(
		"the object's bucket never closed a hub with rate",
		!fake.sockets.violations.length,
		JSON.stringify(fake.sockets.violations),
	)
}

// The most frames and bytes in any window of one second, by arrival, per hub socket's frames.
function peaks(frames) {
	let start = 0
	let bytes = 0
	const peak = { frames: 0, bytes: 0 }
	frames.forEach((each, end) => {
		bytes += each.bytes
		while (each.at - frames[start].at >= MS_PER_S) {
			bytes -= frames[start].bytes
			start += 1
		}
		peak.frames = Math.max(peak.frames, end - start + 1)
		if (bytes > peak.bytes) {
			peak.bytes = bytes
			peak.window = frames
				.slice(start, end + 1)
				.map(
					one =>
						`${one.at - frames[0].at}:${one.frame?.t}:${one.bytes}`,
				)
		}
	})
	return peak
}
