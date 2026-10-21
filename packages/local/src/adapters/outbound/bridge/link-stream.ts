// The hub's stream as the probe sends it up its socket (RFC 0001, 4.4 and 4.6): `hello`, the
// snapshot, then every hub signal coalesced exactly as the local stream coalesces it (core's
// stream queue, the shared pacer), every hub and desk named by its web id (the source's identity
// is the web hub id). A tagged `snapshot?` (a tab that connected) is answered with a snapshot
// read for that tab alone, every frame tagged, while the live stream keeps its queue: it waits
// while the snapshot goes up, so what moved meanwhile follows it, newer. An untagged one (a web
// before tags) starts over with a fresh queue: `hello`, a whole snapshot, then the events after.
import { BRIDGE_LIMITS } from '@syneva/contracts/bridge'
import { createStreamQueue } from '@syneva/core/hub/stream-queue'

import { createPacer } from '../../stream-pacer.js'

import type { StreamSource } from '@syneva/core/hub/stream-frames'
import type { StreamQueue } from '@syneva/core/hub/stream-queue'
import type { Send } from '../../stream-pacer.js'
import type { Outbox } from './outbox.js'

export type LinkStream = {
	// The web asked for a snapshot: for the tab `tag` names, else for every tab.
	resnapshot: (tag?: string) => void
	stop: () => void
}

// A frame is named by its head (its kind, hub and desk ids), never its content.
const FRAME_HEAD_CHARS = 96

export function startLinkStream(
	source: StreamSource,
	outbox: Outbox,
	log: (line: string) => void,
): LinkStream {
	let queue = createStreamQueue(source)
	let isStopped = false
	const send = sender(outbox, log, () => isStopped)
	const pacer = createPacer(() => queue, send)
	const unsubscribe = source.hub.subscribe(signal => {
		queue.note(signal)
		pacer.wake()
	})
	// Snapshots go one after the other: a `snapshot?` that arrives while one is read waits for it.
	// The live frames wait for each: a frame of a desk sent while its snapshot line is read would
	// reach the tab before that line, older.
	let snapshots = Promise.resolve()
	const sendSnapshot = async (
		previous: Promise<void>,
		read: { fresh: StreamQueue; isLive: boolean },
	): Promise<void> => {
		await previous
		pacer.stop()
		if (read.isLive) queue = read.fresh
		if (!send(read.fresh.hello())) return
		for (const text of await readSnapshot(read.fresh, log)) send(text)
		if (!isStopped) pacer.start()
	}
	const snapshot = (read: { fresh: StreamQueue; isLive: boolean }): void => {
		snapshots = sendSnapshot(snapshots, read)
	}
	snapshot({ fresh: queue, isLive: true })
	return {
		resnapshot: tag => {
			// A tab's own snapshot is read once and dropped; the live queue stays the stream's.
			const fresh = createStreamQueue(tag ? { ...source, tag } : source)
			snapshot({ fresh, isLive: !tag })
		},
		stop(): void {
			isStopped = true
			unsubscribe()
			pacer.stop()
		},
	}
}

// A snapshot that cannot be read leaves the web without one until it asks again: the events
// keep flowing, and a tab that connects asks for the next one.
async function readSnapshot(
	queue: StreamQueue,
	log: (line: string) => void,
): Promise<string[]> {
	try {
		return await queue.snapshot()
	} catch (error) {
		log(`bridge: snapshot failed: ${String(error)}`)
		return []
	}
}

// Core shapes every frame under `frameBytes` (a pulse past it travels partial, read whole over
// the relay at /pulse; the journal splits its batches), so a frame past it is a hub bug. It is
// never sent - the web would close the socket on it, and again on every reconnect - and said
// once per head.
function sender(
	outbox: Outbox,
	log: (line: string) => void,
	isStopped: () => boolean,
): Send {
	const said = new Set<string>()
	return text => {
		if (isStopped()) return false
		if (Buffer.byteLength(text) <= BRIDGE_LIMITS.frameBytes) {
			outbox.send(text)
			return true
		}
		const head = text.slice(0, FRAME_HEAD_CHARS)
		if (!said.has(head))
			log(
				`bridge: a frame over ${BRIDGE_LIMITS.frameBytes} bytes is never sent (${head}...)`,
			)
		said.add(head)
		return true
	}
}
