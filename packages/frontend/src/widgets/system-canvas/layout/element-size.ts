import type { ModelElement } from '@entities/review/guide/system-model'

// An element's tile, sized before it is drawn (ELK places boxes, it cannot measure them): the label wraps over at most two lines at about 19 characters a line of the 12.5px sans, under it the kind and technology line, and the domain badges' row when a domain changes it.
export const TILE_WIDTH = 176
const PADDING = 20
const LABEL_LINE = 17
const CHARS_PER_LINE = 19
const MAX_LABEL_LINES = 2
const CAPTION = 16
const BADGES = 24

export function labelLines(label: string): number {
	return Math.min(MAX_LABEL_LINES, Math.ceil(label.length / CHARS_PER_LINE))
}

export function tileHeight(element: ModelElement): number {
	const badges = element.domains?.length ? BADGES : 0
	return PADDING + labelLines(element.label) * LABEL_LINE + CAPTION + badges
}

// A link label's box: the 10.5px sans at about 6.2px a character, a step's number square before it.
const LABEL_CHAR = 6.2
const LABEL_PADDING = 12
const STEP_SQUARE = 20
export const LINK_LABEL_HEIGHT = 18

export function linkLabelWidth(text: string, isStep: boolean): number {
	return (
		Math.ceil(text.length * LABEL_CHAR) +
		LABEL_PADDING +
		(isStep ? STEP_SQUARE : 0)
	)
}
