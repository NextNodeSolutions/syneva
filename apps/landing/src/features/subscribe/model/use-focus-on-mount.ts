import { useCallback } from 'react'

import type { RefCallback } from 'react'

// A ref that focuses its element when it mounts, if this form is the one that made the change (a verdict a screen reader then reads, or the field after "Use another address").
export const useFocusOnMount = <Target extends HTMLElement>(
	hasFocus: boolean,
): RefCallback<Target> =>
	useCallback(
		(target: Target | null) => {
			if (hasFocus) target?.focus()
		},
		[hasFocus],
	)
