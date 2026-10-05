import { useRef, useState } from 'react'

import { hubRefusal, openHubDesk } from '@entities/hub/api'

import type { HubRefusal } from '@entities/hub/api'
import type { NewDeskInput } from '@entities/hub/model'

// Why the hub did not open the desk, as the form says it. An abandoned open says nothing.
export type OpenRefusal = Exclude<HubRefusal, { kind: 'aborted' }>

export type OpenDesk = {
	isBusy: boolean
	refusal: OpenRefusal | null
	// Open the desk on the hub and land on it; ignored while an open is in flight.
	open: (input: NewDeskInput) => void
	// Abandon an open in flight (the dialog closed while the hub was still opening).
	abort: () => void
}

// The open the CLI performs, from the dashboard. A reused desk and a new one both navigate; a
// refusal stays with the hub's reason. The open carries an AbortController: abandoning it drops
// the navigation with it. The open in flight is a ref, not the render's isBusy: two submits in
// one tick (a double Enter) both see the render from before either took effect.
export function useOpenDesk(): OpenDesk {
	const [refusal, setRefusal] = useState<OpenRefusal | null>(null)
	const [isBusy, setBusy] = useState(false)
	const pending = useRef<AbortController | null>(null)

	const run = async (input: NewDeskInput): Promise<void> => {
		const controller = new AbortController()
		pending.current = controller
		setBusy(true)
		setRefusal(null)
		try {
			const desk = await openHubDesk(input, controller.signal)
			if (!controller.signal.aborted) window.location.assign(desk.path)
		} catch (error) {
			const refused = hubRefusal(error)
			if (refused.kind === 'aborted') return
			pending.current = null
			setBusy(false)
			setRefusal(refused)
		}
	}

	return {
		isBusy,
		refusal,
		open: input => {
			if (!pending.current) void run(input)
		},
		abort: () => pending.current?.abort(),
	}
}
