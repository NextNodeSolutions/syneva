// A reader that stops reading while the hub keeps sending: once it leaves more than
// `bufferedBytes` unread, the hub closes it with `slow` (it reads the code once it reads again),
// while a reader that keeps up with the same frames stays open. The frames are a desk's whole
// pulses, each near a frame's bound, one per window as its status line moves.
import {
	BRIDGE_LIMITS,
	CLOSE_CODES,
} from '../../packages/contracts/dist/bridge.js'

import { comment, deskPost, openDesk } from './desk-steps.mjs'
import { SESSION } from './hub-driver.mjs'
import { readPulse } from './pulse-oracle.mjs'
import { closeReader, readSnapshot } from './stream-client.mjs'

const SLOW_SESSION = `${SESSION}-slow`
const COMMENT_CHARS = 200_000
// The pulse grows a comment at a time until it is within one comment of frameBytes (still whole).
const PULSE_FLOOR = BRIDGE_LIMITS.frameBytes - COMMENT_CHARS
// Frames sent while the reader reads nothing: past bufferedBytes with room for what the kernel's
// socket buffers hold on both ends, and over before ws's close timeout drops the reader unread.
const MOVES = 24
// A move per window, with a margin for the hub's timer.
const WINDOW_MARGIN_MS = 50
const WINDOW_MS = BRIDGE_LIMITS.coalesceMs + WINDOW_MARGIN_MS
const CLOSE_WITHIN_MS = 5000

export async function checkSlow(context) {
	const { report, driver, repo, url, headers } = context
	report.section('a slow reader')
	const desk = await report.step(
		'a desk whose pulse is near frameBytes, whole',
		() => openHeavyDesk(driver, repo),
	)
	if (desk)
		await report.step(
			`a reader that stops reading closes with slow (${CLOSE_CODES.slow}) past bufferedBytes (${BRIDGE_LIMITS.bufferedBytes} bytes), one that reads stays`,
			async () => {
				const [stalled, reading] = await Promise.all([
					readSnapshot(url, headers),
					readSnapshot(url, headers),
				])
				stalled.socket.pause()
				await moveStatus(driver, desk.id)
				stalled.socket.resume()
				const closed = await within(stalled.closed, CLOSE_WITHIN_MS)
				const isReadingOpen =
					reading.socket.readyState === reading.socket.OPEN
				await Promise.all([closeReader(stalled), closeReader(reading)])
				if (closed?.code !== CLOSE_CODES.slow)
					throw new Error(
						`the stalled reader closed with ${closed?.code}`,
					)
				if (!isReadingOpen) throw new Error('the reading reader closed')
			},
		)
	await driver.cli(['close', '--session', SLOW_SESSION], repo.root)
}

async function openHeavyDesk(driver, repo) {
	const desk = await openDesk(driver, repo, SLOW_SESSION)
	let bytes = 0
	// Sequential by nature: each comment is sized against the pulse the one before left.
	for (let count = 1; bytes < PULSE_FLOOR; count++) {
		await comment(driver, desk.id, `${count} ${'y'.repeat(COMMENT_CHARS)}`)
		const { body } = await readPulse(driver, desk.id)
		bytes = Buffer.byteLength(JSON.stringify(body))
	}
	if (bytes > BRIDGE_LIMITS.frameBytes)
		throw new Error(`its pulse is ${bytes} bytes`)
	return desk
}

// One status line per coalescing window: each sends the desk's whole pulse again.
async function moveStatus(driver, deskId) {
	for (let move = 0; move < MOVES; move++) {
		await deskPost(driver, deskId, 'status', { body: `move ${move}` })
		await new Promise(resolve => {
			setTimeout(resolve, WINDOW_MS)
		})
	}
}

function within(promise, ms) {
	return Promise.race([
		promise,
		new Promise(resolve => {
			setTimeout(resolve, ms, null)
		}),
	])
}
