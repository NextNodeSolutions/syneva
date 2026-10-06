import { useState } from 'react'

import { hubRefusal, openHubDesk } from '@entities/hub/api'

import type { DeskClosed } from '@entities/hub/journal'

export type Reopen = {
	// The desk being reopened, while the hub opens it.
	busyId: string | null
	// Why the last reopen failed, by desk, in the hub's own words.
	failures: ReadonlyMap<string, string>
	reopen: (closed: DeskClosed) => Promise<void>
}

function failureOf(error: unknown): string {
	const refusal = hubRefusal(error)
	if (refusal.kind === 'refused') return refusal.reason
	if (refusal.kind === 'signed-out') return 'This browser is signed out.'
	return 'The hub did not answer.'
}

// Reopen a closed desk exactly as it was opened (its repository, session, mode and target):
// the hub rebuilds it and merges its saved review back, then the page goes to it.
export function useReopen(): Reopen {
	const [busyId, setBusyId] = useState<string | null>(null)
	const [failures, setFailures] = useState<ReadonlyMap<string, string>>(
		new Map(),
	)
	const reopen = async (closed: DeskClosed): Promise<void> => {
		setBusyId(closed.deskId)
		try {
			const desk = await openHubDesk({
				root: closed.root,
				mode: closed.mode,
				staged: closed.staged,
				target: closed.target,
				session: closed.session,
			})
			window.location.assign(desk.path)
		} catch (error) {
			setFailures(
				was => new Map([...was, [closed.deskId, failureOf(error)]]),
			)
			setBusyId(null)
		}
	}
	return { busyId, failures, reopen }
}
