import { CHANGE_WORDS } from '@shared/ui/change-mark.styles'

import { linkText } from '../layout/scene'
import { project } from '../projection/camera'
import { plateBoxes } from '../projection/face-frame'

import { isLinkWorded } from './canvas-focus'
import { deckSize, nameSize } from './chip-size'
import { nameAnchor, slabCorner } from './name-anchor'
import { nameBox, placeNames } from './names-place'
import { placeWords } from './words-place'

import type { Point3, ScreenPoint } from '../projection/camera'
import type { Deck, Raised, RaisedLink, RaisedPart } from '../projection/raised'
import type { CanvasFocus } from './canvas-focus'
import type { Box } from './chip-box'
import type { NameSpot } from './names-place'
import type { View } from './solid-shape'
import type { WordsSpot } from './words-place'

// Every text a raised drawing floats over its SVG, placed together so none covers another: the parts' names first (names-place.ts), then the links' words around them, the decks' names and the domains' plates (words-place.ts).

export type NameLabel = NameSpot & {
	part: RaisedPart
	deck: Deck
	// The step the name took away from its block to clear a nearer one.
	lift: number
	// Its stacking: a nearer name over a farther one.
	rank: number
	// Whether the name carries its domains' numbers after it.
	hasNumbers: boolean
}

export type WordsLabel = {
	raised: RaisedLink
	at: ScreenPoint
	// Whether it says its words, or shows only its step's number.
	hasWords: boolean
}

// The deck's name ends just left of its slab's corner (projection.styles' beside).
const DECK_GAP = 8
const HALF = 0.5

// A changed block that wears no numbers on a face carries them after its name.
function hasNumbers(part: RaisedPart): boolean {
	return !part.solid.isPlatform && Boolean(part.mark) && !part.isNumbered
}

// The names in the order Tab reaches them: the top floor first, as the eye reads the floors down (the decks are built from the bottom up).
function namesOf(raised: Raised, view: View, focus: CanvasFocus): NameLabel[] {
	const spots = raised.decks.toReversed().flatMap(deck =>
		deck.parts
			.filter(part => part.isNamed)
			.map(part => {
				const { at, isUnder } = nameAnchor(part, deck.isHanging, view)
				const isPlaque = part.solid.isPlatform
				const numbers = hasNumbers(part)
				const size = nameSize({
					text: part.element.label,
					isPlaque,
					tag:
						!isPlaque && part.mark
							? CHANGE_WORDS[part.mark]
							: undefined,
					numbers: numbers ? focus.domainsOf(part.element).length : 0,
				})
				return { at, isUnder, size, part, deck, hasNumbers: numbers }
			}),
	)
	return placeNames(spots)
}

// What the words keep off besides the names: the decks' names and the plates on the fronts.
function groundBoxes(raised: Raised, view: View, focus: CanvasFocus): Box[] {
	const decks = raised.decks.flatMap(deck => {
		const [slab] = deck.slabs
		if (!deck.name || !slab) return []
		const at = slabCorner(slab, view)
		const size = deckSize(deck.name)
		return [
			{
				x: at.x - size.width - DECK_GAP,
				y: at.y - size.height * HALF,
				...size,
			},
		]
	})
	const plates = raised.decks.flatMap(deck =>
		deck.parts
			.filter(part => part.isNumbered)
			.flatMap(part =>
				plateBoxes(
					part.solid,
					view,
					focus.domainsOf(part.element).length,
				),
			),
	)
	return [...decks, ...plates]
}

type Spoken = { link: RaisedLink; spot: WordsSpot }

// The links that say something: the ones the reviewer looks at first, then the steps in their order, then the rest.
function spokenLinks(raised: Raised, view: View, focus: CanvasFocus): Spoken[] {
	const links = [
		...raised.decks.flatMap(deck => deck.links),
		...raised.overlay,
	]
	const seen = (point: Point3): ScreenPoint =>
		project(view.camera, view.floor, point)
	const spoken = links.flatMap((link): Spoken[] => {
		const tone = focus.linkTone(link.link)
		const isWorded = link.isWorded || isLinkWorded(link.link, tone)
		const { label } = link.route
		if (!label || (!isWorded && !link.link.step)) return []
		const spot = {
			preferred: seen(label),
			points: link.route.points.map(seen),
			text: isWorded ? linkText(link.link) : '',
			hasNumber: Boolean(link.link.step),
			isLooked: tone === 'lit',
		}
		return [{ link, spot }]
	})
	const order = (entry: Spoken): number =>
		(entry.spot.isLooked ? 0 : spoken.length) +
		(entry.link.link.step ?? spoken.length)
	return spoken.toSorted((a, b) => order(a) - order(b))
}

export function raisedLabels(
	raised: Raised,
	view: View,
	focus: CanvasFocus,
): { names: NameLabel[]; words: WordsLabel[] } {
	const names = namesOf(raised, view, focus)
	const spoken = spokenLinks(raised, view, focus)
	const taken = [
		...names.map(name => nameBox(name, name.lift)),
		...groundBoxes(raised, view, focus),
	]
	const places = placeWords(
		spoken.map(entry => entry.spot),
		{ taken, field: view.field },
	)
	const words = spoken.flatMap((entry, index): WordsLabel[] => {
		const place = places[index]
		return place ? [{ raised: entry.link, ...place }] : []
	})
	return { names, words }
}
