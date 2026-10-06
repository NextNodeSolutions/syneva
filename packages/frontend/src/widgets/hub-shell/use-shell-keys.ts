import { useEffect } from 'react'

import { isPageShortcut } from '@shared/lib/page-keys'

const FOLD_KEYS = ['[']

// Keys the shell answers anywhere on the page: [ folds or opens the sidebar, once per press (a
// held key does not flicker it) and never behind a modal dialog. A key typed into a field, or
// pressed with a modifier, is the field's or the browser's.
export function useShellKeys(onFold: () => void): void {
	// oxlint-disable-next-line nextnode/no-use-effect -- a document-wide key listener: a browser API the render does not own
	useEffect(() => {
		const onKey = (event: KeyboardEvent): void => {
			if (!isPageShortcut(event, FOLD_KEYS)) return
			event.preventDefault()
			onFold()
		}
		document.addEventListener('keydown', onKey)
		return (): void => document.removeEventListener('keydown', onKey)
	}, [onFold])
}
