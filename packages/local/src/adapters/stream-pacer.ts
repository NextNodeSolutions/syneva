// The coalescer's clock, for a stream queue (core's hub/stream-queue.ts) feeding a socket: the
// local hub's stream and the probe each keep one per socket. One timer, armed for the queue's next
// due time (the next window once frames wait, or a desk's status going stale on its own) and
// never earlier than the timer already armed. The one timer that sends on a stream: the hub
// pushes, nothing here re-asks. `stop` pauses it (the probe stops it while a fresh snapshot is
// read, then starts it again) and `start` resumes it.
import type { StreamQueue } from '@syneva/core/hub/stream-queue'

// Sends one frame; false once the socket can take no more (it closed, or the frame was refused).
export type Send = (text: string) => boolean

export type Pacer = { start(): void; wake(): void; stop(): void }

// `queue` is read on every tick: the probe swaps its queue for a fresh snapshot (`snapshot?`).
export function createPacer(queue: () => StreamQueue, send: Send): Pacer {
	let timer: NodeJS.Timeout | undefined
	let armedFor = Infinity
	let isLive = false
	const fire = (): void => {
		timer = undefined
		armedFor = Infinity
		if (!queue().take(Date.now()).every(send)) return
		wake()
	}
	const wake = (): void => {
		const due = isLive ? queue().dueAt() : null
		if (due === null || due >= armedFor) return
		clearTimeout(timer)
		armedFor = due
		timer = setTimeout(fire, Math.max(0, due - Date.now()))
	}
	return {
		start(): void {
			isLive = true
			wake()
		},
		wake,
		stop(): void {
			isLive = false
			clearTimeout(timer)
		},
	}
}
