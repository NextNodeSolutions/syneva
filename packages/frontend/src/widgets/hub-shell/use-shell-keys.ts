import { useEffect } from 'react'

// Keys the shell answers anywhere on the page: [ folds or opens the sidebar. A key typed into
// a field, or pressed with a modifier, is the field's or the browser's.
function isTyping(target: EventTarget | null): boolean {
	return (
		target instanceof HTMLElement &&
		(target.isContentEditable ||
			['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
	)
}

export function useShellKeys(onFold: () => void): void {
	// oxlint-disable-next-line nextnode/no-use-effect -- a document-wide key listener: a browser API the render does not own
	useEffect(() => {
		const onKey = (event: KeyboardEvent): void => {
			const isModified = event.metaKey || event.ctrlKey || event.altKey
			if (event.key !== '[' || isModified || isTyping(event.target))
				return
			event.preventDefault()
			onFold()
		}
		document.addEventListener('keydown', onKey)
		return (): void => document.removeEventListener('keydown', onKey)
	}, [onFold])
}
