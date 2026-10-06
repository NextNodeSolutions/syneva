import { useId, useSyncExternalStore } from 'react'

import type { Signup } from './signup'

// Who is on the list, as this page knows it, and which form last changed that.
type ListState = { signup: Signup | undefined; by: string | undefined }

// Each Astro island is its own React root, but this module is one instance per page: an address left in the hero shows as joined in the start band too.
const EMPTY: ListState = { signup: undefined, by: undefined }
let state = EMPTY
const listeners = new Set<() => void>()

const subscribe = (listener: () => void): (() => void) => {
	listeners.add(listener)
	return () => {
		listeners.delete(listener)
	}
}

const current = (): ListState => state
const beforeHydration = (): ListState => EMPTY

function publish(next: ListState): void {
	state = next
	listeners.forEach(listener => listener())
}

type Joining = {
	signup: Signup | undefined
	// This form made the last change, so it takes the focus that follows it (the verdict, or the emptied field).
	hasFocus: boolean
	join: (signup: Signup) => void
	leave: () => void
}

export function useJoining(): Joining {
	const form = useId()
	const { signup, by } = useSyncExternalStore(
		subscribe,
		current,
		beforeHydration,
	)
	return {
		signup,
		hasFocus: by === form,
		join: joined => publish({ signup: joined, by: form }),
		leave: () => publish({ signup: undefined, by: form }),
	}
}
