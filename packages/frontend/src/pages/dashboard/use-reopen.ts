import { useOpenAndGo } from './use-open-and-go'

import type { DeskClosed } from '@entities/hub/journal'

export type Reopen = {
	// The desk being reopened, while the hub opens it.
	busyId: string | null
	// Why the last reopen failed, by desk, in the hub's own words.
	failures: ReadonlyMap<string, string>
	reopen: (closed: DeskClosed) => Promise<void>
}

// Reopen a closed desk exactly as it was opened (its repository, session, mode, target, PR base
// and path limit): the hub rebuilds it and merges its saved review back, then the page goes to
// it.
export function useReopen(): Reopen {
	const { busyKey, failures, open } = useOpenAndGo()
	return {
		busyId: busyKey,
		failures,
		reopen: closed =>
			open(closed.deskId, {
				root: closed.root,
				mode: closed.mode,
				staged: closed.staged,
				target: closed.target,
				session: closed.session,
				base: closed.base,
				path: closed.pathFilter,
			}),
	}
}
