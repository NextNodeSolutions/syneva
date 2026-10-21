import { errorMessage } from './errors.js'

// A synchronous event source: `emit` calls every listener, in the order they subscribed, before
// it returns. It holds no timer and no queue (core keeps none: whatever must wait, coalescing or
// batching, is the listening transport's). A listener that throws is cut off from the caller of
// `emit`, a mutation in flight: its failure is logged the first time only, never the failure of
// that mutation, and never keeps the next listener from hearing the event. Its functions are
// fields, not methods: they are handed around bare (`subscribe: emitter.subscribe`).
export type Emitter<E> = {
	emit: (event: E) => void
	// Hands back the unsubscribe; calling it twice is a no-op.
	subscribe: (listener: (event: E) => void) => () => void
}

type Subscription<E> = { listener: (event: E) => void }

export function createEmitter<E>(
	source: string,
	log: (line: string) => void,
): Emitter<E> {
	const subscriptions = new Set<Subscription<E>>()
	const failed = new WeakSet<Subscription<E>>()
	const hear = (subscription: Subscription<E>, event: E): void => {
		try {
			subscription.listener(event)
		} catch (error) {
			if (failed.has(subscription)) return
			failed.add(subscription)
			log(`${source}: a subscriber failed: ${errorMessage(error)}`)
		}
	}
	return {
		emit(event: E): void {
			// A listener may unsubscribe itself or another one mid-emit: walk a copy, skip the gone.
			const currentSubscriptions = [...subscriptions]
			for (const subscription of currentSubscriptions)
				if (subscriptions.has(subscription)) hear(subscription, event)
		},
		subscribe(listener) {
			const subscription = { listener }
			subscriptions.add(subscription)
			return () => {
				subscriptions.delete(subscription)
			}
		},
	}
}
