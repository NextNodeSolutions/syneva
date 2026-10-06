import { useCallback, useState } from 'react'

import type { HubDesk } from '@entities/hub/model'

export type ArmedDesk = {
	armedId: string | null
	arm: (deskId: string) => void
	disarm: (deskId: string) => void
}

// One armed close at a time; a desk that left the listing is armed no more, or the listing's order would stay held for good.
export function useArmedDesk(desks: readonly HubDesk[]): ArmedDesk {
	const [armedId, setArmedId] = useState<string | null>(null)
	if (armedId !== null && !desks.some(desk => desk.id === armedId))
		setArmedId(null)
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
