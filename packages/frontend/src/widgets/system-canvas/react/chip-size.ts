import type { Size } from '../projection/camera'

// A chip's size on a raised drawing, estimated from what it holds: the chips are HTML, and the arithmetic that decides where they go runs before they are laid out. Measured on the desk's fonts (projection.styles.ts), a little over so a near miss stays a miss: the 11px sans of a name about 6px a character, the 10.5px sans of a link's words 5.4px, the 10px mono of a plaque and of a deck's name, tracked, 6.6px and 6.8px, a change tag's 10.5px mono 6.7px.

const NAME_CHAR = 6
const PLAQUE_CHAR = 6.6
const DECK_CHAR = 6.8
const WORDS_CHAR = 5.4
const TAG_CHAR = 6.7

// A name's chip: its border and padding, the kind glyph and the gap after it; a tag's padding; a number's square and the gaps between them.
const NAME_FRAME = 33
const GAP = 5
const TAG_PADDING = 12
const NUMBER = 18
const NUMBER_GAP = 3
const NAME_HEIGHT = 22
const TAGGED_HEIGHT = 26

// A link's words: their padding, a step's number square and the gap after it.
const WORDS_PADDING = 8
const STEP_SQUARE = 16
const STEP_GAP = 4
const WORDS_HEIGHT = 16

const DECK_PADDING = 10
const DECK_HEIGHT = 17

export type NameContent = {
	text: string
	isPlaque: boolean
	// The change tag's word, on a block's name.
	tag?: string | undefined
	// The domains' numbers after the name.
	numbers: number
}

export function nameSize(content: NameContent): Size {
	const char = content.isPlaque ? PLAQUE_CHAR : NAME_CHAR
	const tag = content.tag
		? GAP + TAG_PADDING + content.tag.length * TAG_CHAR
		: 0
	const numbers = content.numbers
		? GAP + content.numbers * NUMBER + (content.numbers - 1) * NUMBER_GAP
		: 0
	return {
		width: NAME_FRAME + content.text.length * char + tag + numbers,
		height: content.tag ? TAGGED_HEIGHT : NAME_HEIGHT,
	}
}

// A link's chip: its number when it is a step, its words when it says them.
export function wordsSize(text: string, hasNumber: boolean): Size {
	const number = hasNumber ? STEP_SQUARE + (text ? STEP_GAP : 0) : 0
	return {
		width: WORDS_PADDING + number + text.length * WORDS_CHAR,
		height: WORDS_HEIGHT,
	}
}

export function deckSize(text: string): Size {
	return {
		width: DECK_PADDING + text.length * DECK_CHAR,
		height: DECK_HEIGHT,
	}
}
