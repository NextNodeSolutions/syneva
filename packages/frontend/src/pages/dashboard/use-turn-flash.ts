import { useLayoutEffect, useRef } from 'react'

import { turnOf } from '@entities/hub/turn'
import { playFlash } from '@shared/lib/motion'

import type { HubDesk } from '@entities/hub/model'
import type { Turn } from '@entities/hub/turn'
import type { RefObject } from 'react'

// A desk whose turn just changed (the agent picked the review up, the reviewer sent it) washes
// its row once, wherever the row stands now: the change is seen even where the row does not
// move (a list grouped by project, the cockpit). The first listing flashes nothing.
export function useTurnFlash(
	root: RefObject<Element | null>,
	desks: readonly HubDesk[],
): void {
	const last = useRef<Map<string, Turn> | null>(null)
	useLayoutEffect(() => {
		const turns = new Map(desks.map(desk => [desk.id, turnOf(desk)]))
		const before = last.current
		last.current = turns
		if (!before || !root.current) return
		for (const [id, turn] of turns) {
			const was = before.get(id)
			if (!was || was === turn) continue
			const row = root.current.querySelector(`[data-flip="${id}"]`)
			if (row) playFlash(row)
		}
	})
}
