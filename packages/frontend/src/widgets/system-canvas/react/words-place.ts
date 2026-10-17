import type { ScreenPoint } from '../projection/camera'

// Where a link's words go on a raised drawing. ELK placed each label for the plan, where nothing floats; on a raised drawing every block's name floats over it (under it, hanging), so words left at ELK's point can land under a name. The words move along their route to the first stretch no name covers: ELK's point first, then the middle of each leg, the longest leg first.

export type Box = { x: number; y: number; width: number; height: number }

// A chip's size estimated from its text: the chips are HTML, laid out only after this decides where they go. Small type runs about 6.5 px a character; a name carries its kind glyph and its change tag beside the text.
const CHAR_PX = 6.5
const NAME_EXTRA_PX = 70
const NAME_HEIGHT = 26
const UNDER_GAP = 4
const WORDS_EXTRA_PX = 8
const WORDS_HEIGHT = 18
const HALF = 0.5

export function nameBox(at: ScreenPoint, text: string, isUnder: boolean): Box {
	const width = text.length * CHAR_PX + NAME_EXTRA_PX
	return {
		x: at.x - width * HALF,
		y: isUnder ? at.y + UNDER_GAP : at.y - NAME_HEIGHT,
		width,
		height: NAME_HEIGHT,
	}
}

function wordsBox(at: ScreenPoint, text: string): Box {
	const width = text.length * CHAR_PX + WORDS_EXTRA_PX
	return {
		x: at.x - width * HALF,
		y: at.y - WORDS_HEIGHT * HALF,
		width,
		height: WORDS_HEIGHT,
	}
}

function overlaps(a: Box, b: Box): boolean {
	return (
		a.x < b.x + b.width &&
		b.x < a.x + a.width &&
		a.y < b.y + b.height &&
		b.y < a.y + a.height
	)
}

type Leg = { middle: ScreenPoint; length: number }

function legsOf(points: readonly ScreenPoint[]): Leg[] {
	return points
		.slice(1)
		.map((to, index) => {
			const from = points[index] ?? to
			return {
				middle: {
					x: (from.x + to.x) * HALF,
					y: (from.y + to.y) * HALF,
					depth: (from.depth + to.depth) * HALF,
				},
				length: Math.hypot(to.x - from.x, to.y - from.y),
			}
		})
		.toSorted((a, b) => b.length - a.length)
}

// The first candidate no name covers; ELK's point when every stretch is covered.
export function wordsAt(
	preferred: ScreenPoint | undefined,
	points: readonly ScreenPoint[],
	text: string,
	names: readonly Box[],
): ScreenPoint | undefined {
	const candidates = [
		...(preferred ? [preferred] : []),
		...legsOf(points).map(leg => leg.middle),
	]
	const free = candidates.find(
		at => !names.some(name => overlaps(wordsBox(at, text), name)),
	)
	return free ?? preferred ?? candidates[0]
}
