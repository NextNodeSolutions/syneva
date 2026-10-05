import { useCallback, useEffect, useState } from 'react'

import { fetchHubDesks, fetchHubHealth } from '@entities/hub/api'

import type { HubDesk, HubHealth } from '@entities/hub/model'

// The dashboard refreshes on the desk's own cadence class: often enough that an agent
// attaching, a Send queueing or a desk closing shows within a couple of seconds.
export const HUB_POLL_MS = 2000

export type HubView = {
	// null until the first listing lands (the page shows a loading state, not an empty hub).
	desks: HubDesk[] | null
	health: HubHealth | null
	// The hub stopped answering: shown as a notice over the last known listing.
	unreachable: boolean
	now: number
	refresh: () => Promise<void>
}

// Poll the hub listing (and read its health once). The effect syncs an EXTERNAL system - the
// hub over HTTP on a timer - which is exactly what an effect is for; a hidden tab pauses the
// timer and refreshes the moment it is shown again.
export function useHub(): HubView {
	const [desks, setDesks] = useState<HubDesk[] | null>(null)
	const [health, setHealth] = useState<HubHealth | null>(null)
	const [unreachable, setUnreachable] = useState(false)
	const [now, setNow] = useState(() => Date.now())

	const refresh = useCallback(async (): Promise<void> => {
		try {
			setDesks(await fetchHubDesks())
			setUnreachable(false)
		} catch {
			setUnreachable(true)
		}
		setNow(Date.now())
	}, [])

	const loadHealth = useCallback(async (): Promise<void> => {
		try {
			setHealth(await fetchHubHealth())
		} catch {
			// The header simply omits the version until the hub answers.
		}
	}, [])

	useEffect(
		() => pollWhileVisible(refresh, loadHealth),
		[refresh, loadHealth],
	)

	return { desks, health, unreachable, now, refresh }
}

// Run `once` and `tick` now, then `tick` every HUB_POLL_MS while the tab is visible; a hidden
// tab pauses the timer, a shown one refreshes at once. Returns the teardown.
function pollWhileVisible(
	tick: () => Promise<void>,
	once: () => Promise<void>,
): () => void {
	let timer: ReturnType<typeof setInterval> | undefined
	const start = (): void => {
		timer ??= setInterval(() => void tick(), HUB_POLL_MS)
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
		void tick()
		start()
	}
	void once()
	void tick()
	start()
	document.addEventListener('visibilitychange', onVisibility)
	return (): void => {
		stop()
		document.removeEventListener('visibilitychange', onVisibility)
	}
}
