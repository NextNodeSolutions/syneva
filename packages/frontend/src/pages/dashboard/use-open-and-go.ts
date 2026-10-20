import { useState } from 'react'

import { openHubDesk, refusalMessage } from '@entities/hub/api'

import type { NewDeskInput } from '@entities/hub/model'

export type OpenAndGo = {
	// What is being opened (the caller's key: a closed desk's id, a plan's), while the hub opens it.
	busyKey: string | null
	// Why the last open failed, by key, in the hub's own words; a new try clears its key's.
	failures: ReadonlyMap<string, string>
	open: (key: string, input: NewDeskInput) => Promise<void>
}

// Open a desk on the hub, then go to it: a closed desk reopened as it was, a plan reviewed again
// on its desk. The hub rebuilds the desk and merges its saved review back; the page leaves for
// it, so only a failure lands back here.
export function useOpenAndGo(): OpenAndGo {
	const [busyKey, setBusyKey] = useState<string | null>(null)
	const [failures, setFailures] = useState<ReadonlyMap<string, string>>(
		new Map(),
	)
	const open = async (key: string, input: NewDeskInput): Promise<void> => {
		setBusyKey(key)
		setFailures(was => new Map([...was].filter(([held]) => held !== key)))
		try {
			const desk = await openHubDesk(input)
			window.location.assign(desk.path)
		} catch (error) {
			setFailures(was => new Map([...was, [key, refusalMessage(error)]]))
			setBusyKey(null)
		}
	}
	return { busyKey, failures, open }
}
