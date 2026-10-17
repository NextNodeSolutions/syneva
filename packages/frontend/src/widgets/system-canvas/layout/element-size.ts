import type { ModelElement } from '@entities/review/guide/system-model'

// An element's tile, sized before it is drawn (ELK places boxes, it cannot measure them): the label over at most two lines at about 19 characters a line of the 12.5px sans, under it the kind and technology over at most two lines of the 10px mono (never cut short), then a footer row with the change and the domain numbers when the change touches it.
export const TILE_WIDTH = 176
const PADDING = 20
const ROW_GAP = 3
const LABEL_LINE = 17
const CHARS_PER_LINE = 19
const MAX_LABEL_LINES = 2
const CAPTION_LINE = 15
const CAPTION_CHARS = 25
const MAX_CAPTION_LINES = 2
// The longest kind word ("Interface", "Component") and the " · " before the technology.
const KIND_WORD = 9
const SEPARATOR = 3
const FOOTER = 18

export function labelLines(label: string): number {
	return Math.min(MAX_LABEL_LINES, Math.ceil(label.length / CHARS_PER_LINE))
}

function captionLines(element: ModelElement): number {
	const technology = element.technology?.length ?? 0
	const length = KIND_WORD + (technology && SEPARATOR + technology)
	return Math.min(MAX_CAPTION_LINES, Math.ceil(length / CAPTION_CHARS))
}

export function hasFooter(element: ModelElement): boolean {
	return Boolean(element.change ?? element.domains?.length)
}

export function tileHeight(element: ModelElement): number {
	const footer = hasFooter(element) ? ROW_GAP + FOOTER : 0
	return (
		PADDING +
		labelLines(element.label) * LABEL_LINE +
		ROW_GAP +
		captionLines(element) * CAPTION_LINE +
		footer
	)
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
