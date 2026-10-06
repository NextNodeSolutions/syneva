// What a page-wide key listener asks before it answers: a key typed into what takes typing is
// that field's, and a modal dialog open over the page answers its own keys first.

// Elements whose own typing a bare key belongs to.
const TYPING_TARGETS =
	'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

export function isTypingTarget(target: EventTarget | null): boolean {
	return target instanceof Element && target.closest(TYPING_TARGETS) !== null
}

export function isDialogOpen(): boolean {
	return document.querySelector('dialog[open]') !== null
}

// A bare press of one of `keys`: no modifier, once (a held key does not repeat it), outside
// anything that takes typing and with no dialog open.
export function isPageShortcut(
	event: KeyboardEvent,
	keys: readonly string[],
): boolean {
	if (!keys.includes(event.key)) return false
	if (event.metaKey || event.ctrlKey || event.altKey || event.repeat)
		return false
	return !isTypingTarget(event.target) && !isDialogOpen()
}
