// A reader of the hub's stream for the conformance check: every frame as it arrived (its text,
// parsed frame, size and arrival time), how the socket closed, or the status a refused upgrade
// read. It runs from the repo root without a dependency of its own: `ws` comes from the local
// package, which serves the stream with it.
import { createRequire } from 'node:module'

const requireFromLocal = createRequire(
	new URL('../../packages/local/package.json', import.meta.url),
)
const { WebSocket } = requireFromLocal('ws')

export const DEFAULT_WAIT_MS = 5000

export function socketUrl(hub, path) {
	const url = new URL(path, hub)
	url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
	return url.href
}

// Connects and records; `outcome` settles with 'open' or the HTTP status of a refused upgrade,
// `closed` with the close code once the socket closed.
export function openReader(url, headers = {}) {
	const socket = new WebSocket(url, { headers })
	const reader = { socket, frames: [], wakers: new Set() }
	reader.outcome = new Promise((resolve, reject) => {
		socket.once('open', () => resolve('open'))
		socket.once('unexpected-response', (_request, response) => {
			response.resume()
			resolve(response.statusCode)
		})
		socket.once('error', reject)
	})
	reader.closed = new Promise(resolve => {
		socket.once('close', code => resolve({ code, at: Date.now() }))
	})
	socket.on('message', raw => {
		const text = raw.toString('utf8')
		reader.frames.push({
			text,
			frame: frameOf(text),
			bytes: raw.length,
			at: Date.now(),
		})
		for (const wake of reader.wakers) wake()
	})
	return reader
}

// A frame the hub sent, or what no frame parses to (the checks then fail on its shape).
function frameOf(text) {
	try {
		return JSON.parse(text)
	} catch {
		return { t: 'unparsable', text }
	}
}

// The first frame at or after index `from` that `predicate` accepts; rejects after `timeoutMs`.
export function waitFor(reader, predicate, options = {}) {
	const { from = 0, timeoutMs = DEFAULT_WAIT_MS, what = 'a frame' } = options
	return new Promise((resolve, reject) => {
		const look = () => {
			const index = reader.frames.findIndex(
				(each, at) => at >= from && predicate(each.frame, each),
			)
			if (index < 0) return false
			finish()
			resolve(reader.frames[index])
			return true
		}
		const timer = setTimeout(() => {
			finish()
			reject(new Error(`no ${what} within ${timeoutMs} ms`))
		}, timeoutMs)
		const finish = () => {
			clearTimeout(timer)
			reader.wakers.delete(look)
		}
		reader.wakers.add(look)
		look()
	})
}

// Resolves once no frame arrived for `quietMs`: the hub has said what it had to say.
export async function settle(reader, quietMs) {
	let seen = -1
	// Sequential by nature: each wait asks whether the one before saw a frame.
	while (seen !== reader.frames.length) {
		seen = reader.frames.length
		await new Promise(resolve => setTimeout(resolve, quietMs))
	}
}

export async function closeReader(reader) {
	reader.socket.close()
	return reader.closed
}

// The close the hub owes, or a failure once `waitMs` passed without it: the socket is cut so a
// reader the hub kept open settles, and the check fails instead of holding the whole run.
export async function closeWithin(reader, waitMs = DEFAULT_WAIT_MS) {
	let timer
	const deadline = new Promise((_resolve, reject) => {
		timer = setTimeout(() => {
			reader.socket.terminate()
			reject(new Error(`not closed within ${waitMs} ms`))
		}, waitMs)
	})
	try {
		return await Promise.race([reader.closed, deadline])
	} finally {
		clearTimeout(timer)
	}
}

// Connects and reads up to `snapshot-end`; the reader keeps recording after it.
export async function readSnapshot(url, headers) {
	const reader = openReader(url, headers)
	const outcome = await reader.outcome
	if (outcome !== 'open')
		throw new Error(`the upgrade was refused (${outcome})`)
	await waitFor(reader, frame => frame?.t === 'snapshot-end', {
		what: 'snapshot-end',
	})
	return reader
}
