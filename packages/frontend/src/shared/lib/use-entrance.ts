import { useLayoutEffect, useRef } from 'react'

import { playEntrance } from './motion'

import type { RefObject } from 'react'

// Play the [data-enter] entrance under `root` once it is on screen, and again whenever `key`
// changes (another page, another display): what the reviewer just asked for arrives in reading
// order. A layout effect, so the first frame already holds the poses and nothing flashes in
// place first. Polls that re-render under the same key replay nothing: the key last played is
// remembered, and the check runs after every render.
export function useEntrance(
	root: RefObject<Element | null>,
	key: string,
	baseDelay = 0,
): void {
	const played = useRef<string | null>(null)
	useLayoutEffect(() => {
		if (played.current === key || !root.current) return
		played.current = key
		playEntrance(root.current, baseDelay)
	})
}
