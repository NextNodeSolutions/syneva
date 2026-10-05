import { useCallback, useState } from 'react'

import type { HubDesk } from '@entities/hub/model'

export type ArmedDesk = {
	// The one desk whose close is armed, if any.
	armedId: string | null
	arm: (deskId: string) => void
	// Disarming names its desk: another row may have been armed since.
	disarm: (deskId: string) => void
}

// One armed close at a time (arming a row disarms any other). A desk that left the listing -
// its agent closed it, a poll dropped it - is armed no more, or the listing's order would stay
// held for good: the armed id is adjusted during the render that no longer lists it.
export function useArmedDesk(desks: readonly HubDesk[]): ArmedDesk {
	const [armedId, setArmedId] = useState<string | null>(null)
	if (armedId !== null && !desks.some(desk => desk.id === armedId))
		setArmedId(null)
	// Stable, so the Escape listener that calls it is not swapped on every render.
	const disarm = useCallback(
		(deskId: string): void =>
			setArmedId(current => {
				if (current === deskId) return null
				return current
			}),
		[setArmedId],
	)
	return { armedId, arm: setArmedId, disarm }
}
