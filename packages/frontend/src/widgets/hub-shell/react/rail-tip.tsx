import { useEffect, useRef } from 'react'

import * as stylex from '@stylexjs/stylex'

import { followTips } from '../rail-tips'

import { railTip } from './rail-tip.styles'

import type { ReactElement, RefObject } from 'react'

// The rail's one tooltip layer, for the [data-tip] controls under `scope`. Rendered beside the
// sidebar, never inside it, so nothing it passes clips it. Decoration: each control names
// itself (its label or its aria-label).
export function RailTip({
	scope,
}: {
	scope: RefObject<HTMLElement | null>
}): ReactElement {
	const tip = useRef<HTMLDivElement>(null)
	// oxlint-disable-next-line nextnode/no-use-effect -- delegated pointer and focus listeners on the sidebar's DOM: browser events the render does not own
	useEffect(() => {
		if (!scope.current || !tip.current) return undefined
		return followTips({ scope: scope.current, tip: tip.current })
	}, [scope])
	return <div ref={tip} aria-hidden="true" {...stylex.props(railTip.tip)} />
}
