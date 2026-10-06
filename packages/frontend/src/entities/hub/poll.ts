// The dashboard refreshes on the desk's own cadence class: often enough that an agent
// attaching, a Send queueing or a desk closing shows within a couple of seconds.
const HUB_POLL_MS = 2000

// A read the hub has not answered within two cadences is abandoned: a hub that takes
// connections and never answers (a machine asleep, a stalled process) reads as not answering
// instead of queueing a request per tick.
const READ_TIMEOUT_CADENCES = 2
export const READ_TIMEOUT_MS = READ_TIMEOUT_CADENCES * HUB_POLL_MS

// Run `tick` now, then every HUB_POLL_MS while the tab is visible; a hidden tab pauses the
// timer, a shown one ticks at once. A tick still out when the next is due is skipped. Returns
// the teardown.
export function pollWhileVisible(tick: () => Promise<void>): () => void {
	let timer: ReturnType<typeof setInterval> | undefined
	let isTicking = false
	const tickOnce = async (): Promise<void> => {
		if (isTicking) return
		isTicking = true
		try {
			await tick()
		} finally {
			isTicking = false
		}
	}
	const start = (): void => {
		timer ??= setInterval(() => void tickOnce(), HUB_POLL_MS)
	}
	const stop = (): void => {
		clearInterval(timer)
		timer = undefined
	}
	const onVisibility = (): void => {
		if (document.hidden) {
			stop()
			return
		}
		void tickOnce()
		start()
	}
	void tickOnce()
	start()
	document.addEventListener('visibilitychange', onVisibility)
	return (): void => {
		stop()
		document.removeEventListener('visibilitychange', onVisibility)
	}
}
