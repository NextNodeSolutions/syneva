import { useEffect, useState } from 'react'

import { fetchWebMe } from './api'

import type { WebMe } from './model'

export type WebMeView =
	| { phase: 'loading' }
	| { phase: 'failed' }
	| { phase: 'read'; me: WebMe }

// The person is read once per page: every reader shares the answer, and one that failed is read
// again by the next reader that mounts (the Hub page, opened again), never on a timer.
let held: Promise<WebMe> | null = null

async function load(): Promise<WebMe> {
	try {
		return await fetchWebMe()
	} catch (error) {
		held = null
		throw error
	}
}

function readMe(): Promise<WebMe> {
	held ??= load()
	return held
}

async function follow(keep: (view: WebMeView) => void): Promise<void> {
	try {
		keep({ phase: 'read', me: await readMe() })
	} catch {
		keep({ phase: 'failed' })
	}
}

// Who is signed in on the web, for the Hub page. Only a web page asks.
export function useWebMe(): WebMeView {
	const [view, setView] = useState<WebMeView>({ phase: 'loading' })
	// oxlint-disable-next-line nextnode/no-use-effect -- reads the signed-in person over HTTP when the page shows it: an external system
	useEffect(() => {
		let isCurrent = true
		void follow(next => {
			if (isCurrent) setView(next)
		})
		return () => {
			isCurrent = false
		}
	}, [])
	return view
}
