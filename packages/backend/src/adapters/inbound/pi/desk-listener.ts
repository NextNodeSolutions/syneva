import { TransientDeskError } from './desk-connection.js'

// A received event envelope, as receiveDeskEvent hands it over: the saved JSON
// file's path (what the agent got pointed at) plus its kind, so the listener can
// recognize the terminal `closed` event without reading the file back.
export type DeskEventEnvelope = { eventPath: string; kind: string }

type DeskListener = {
	signal: AbortSignal
	receive: (signal: AbortSignal) => Promise<string | DeskEventEnvelope>
	deliver: (event: string | DeskEventEnvelope) => void
	// Test seam: the pause between retries of a transient transport failure.
	retryDelayMs?: number | undefined
}

// A hub restart takes a few seconds; `syneva hub stop` + `syneva start` by hand a little
// longer. Ride out about a minute of silence before declaring the attachment lost.
const RETRY_DELAY_MS = 3000
const MAX_TRANSIENT_FAILURES = 20

// The attachment, not an LLM turn or a one-shot child, owns this loop. Empty 204s
// rearm it; a `closed` event ends it (the human ended the review in the browser);
// a transient transport failure (the hub restarting) is retried with a pause, up to the
// cap, before it is reported; an abort before delivery, or any other failure, stops.
export async function startDeskListener(listener: DeskListener): Promise<void> {
	try {
		await listenUntilClosed(listener)
	} catch (error) {
		if (!listener.signal.aborted) throw error
	}
}

async function listenUntilClosed(listener: DeskListener): Promise<void> {
	let failures = 0
	// The abort re-check comes BEFORE the cycle so an abort during delivery never reruns
	// receive: a replaced attachment's loop must not read another event.
	while (!listener.signal.aborted) {
		const outcome = await listenOnce(listener)
		if (outcome === 'stop') return
		if (outcome === 'delivered') {
			failures = 0
			continue
		}
		failures += 1
		if (failures > MAX_TRANSIENT_FAILURES) throw outcome.error
		await pause(listener.retryDelayMs ?? RETRY_DELAY_MS, listener.signal)
	}
}

type ListenOutcome = 'delivered' | 'stop' | { error: TransientDeskError }

// One receive→deliver cycle. 'delivered' to keep listening: a timeout (no event) rearms,
// a normal event delivers. 'stop': an abort before delivery, or `closed`. A transient
// transport failure comes back as a value so the loop can count and pace the retries.
async function listenOnce(listener: DeskListener): Promise<ListenOutcome> {
	let event: string | DeskEventEnvelope
	try {
		event = await listener.receive(listener.signal)
	} catch (error) {
		if (error instanceof TransientDeskError && !listener.signal.aborted)
			return { error }
		throw error
	}
	if (listener.signal.aborted) return 'stop'
	if (!event) return 'delivered'
	listener.deliver(event)
	return isClosed(event) ? 'stop' : 'delivered'
}

function pause(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise(resolve => {
		const timer = setTimeout(resolve, ms)
		signal.addEventListener(
			'abort',
			() => {
				clearTimeout(timer)
				resolve()
			},
			{ once: true },
		)
	})
}

function isClosed(event: string | DeskEventEnvelope): boolean {
	return typeof event === 'object' && event.kind === 'closed'
}
