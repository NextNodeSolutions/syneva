import { useRef, useState } from 'react'

import { hubRefusal, openHubDesk } from '@entities/hub/api'

import type { HubRefusal } from '@entities/hub/api'
import type { NewDeskInput } from '@entities/hub/model'

export type OpenRefusal = Exclude<HubRefusal, { kind: 'aborted' }>

export type OpenDesk = {
	isBusy: boolean
	refusal: OpenRefusal | null
	open: (input: NewDeskInput) => void
	abort: () => void
}

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
