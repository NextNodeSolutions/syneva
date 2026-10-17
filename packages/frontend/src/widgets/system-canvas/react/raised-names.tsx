import * as stylex from '@stylexjs/stylex'

import { linkText } from '../layout/scene'
import { project } from '../projection/camera'

import { useCanvasActions } from './canvas-actions'
import { isLinkWorded, useCanvasFocus } from './canvas-focus'
import { ChangeTag } from './change-tag'
import { DomainNumbers } from './domain-numbers'
import { KIND_WORDS, KindGlyph } from './kind-glyph'
import { link as linkStyles } from './link.styles'
import { nameAnchor, slabCorner } from './name-anchor'
import { projection as styles } from './projection.styles'
import { nameBox, wordsAt } from './words-place'

import type { ReactElement } from 'react'
import type { Selection } from '../model'
import type { Deck, Raised, RaisedLink, RaisedPart } from '../projection/raised'
import type { View } from './solid-shape'
import type { Box } from './words-place'

// The name's button: the part's kind, name and change, spoken with the deck it is on.
function NameButton({
	part,
	deck,
	isSelected,
	onSelect,
}: {
	part: RaisedPart
	deck: Deck
	isSelected: boolean
	onSelect: () => void
}): ReactElement {
	const { element } = part
	const where = deck.name ? `, ${deck.name}` : ''
	return (
		<button
			type="button"
			aria-pressed={isSelected}
			aria-label={`${element.label}, ${KIND_WORDS[element.kind]}${where}`}
			onClick={onSelect}
			{...stylex.props(styles.nameButton)}
		>
			<KindGlyph kind={element.kind} />
			<span
				{...stylex.props(
					styles.nameText,
					part.mark === 'removed' && styles.struck,
				)}
			>
				{element.label}
			</span>
			{!part.solid.isPlatform && <ChangeTag change={part.mark} />}
		</button>
	)
}

// A changed block that wears no numbers on a face carries them after its name, outside the name's button (a button holds no other).
function hasNumbers(part: RaisedPart): boolean {
	return !part.solid.isPlatform && Boolean(part.mark) && !part.isNumbered
}

function PartName({
	part,
	deck,
	view,
	selection,
	rank,
}: {
	part: RaisedPart
	deck: Deck
	view: View
	selection: Selection
	rank: number
}): ReactElement {
	const focus = useCanvasFocus()
	const actions = useCanvasActions()
	const { id } = part.element
	const anchor = nameAnchor(part, deck.isHanging, view)
	const tone = focus.toneOf(id)
	const isSelected = selection.selected === id
	return (
		<span
			onMouseEnter={() => actions.onHover(id)}
			onMouseLeave={() => actions.onHover(null)}
			{...stylex.props(
				styles.name,
				part.solid.isPlatform && styles.plaque,
				anchor.isUnder
					? styles.under(anchor.at.x, anchor.at.y)
					: styles.above(anchor.at.x, anchor.at.y),
				styles.stack(rank),
				part.isQuiet && styles.nameQuiet,
				tone === 'lit' && styles.nameLit,
				tone === 'dim' && styles.nameDim,
				isSelected && styles.nameSelected,
			)}
		>
			<NameButton
				part={part}
				deck={deck}
				isSelected={isSelected}
				onSelect={() => selection.onSelect(id)}
			/>
			{hasNumbers(part) && (
				<DomainNumbers domains={focus.domainsOf(part.element)} />
			)}
		</span>
	)
}

// A link's words on the stretch of its route no name covers (words-place.ts): a step's number always, its words when the link is news or looked at. A step stacks over every name (the path is what a dynamic view is for); other words go under them. A route with no point for its words says nothing at all: a link ELK gave no label, and every link of the 3D view's far floor, which steps back silent.
function LinkWords({
	raised,
	view,
	over,
	names,
}: {
	raised: RaisedLink
	view: View
	// The stack a step's words take, above every name.
	over: number
	names: readonly Box[]
}): ReactElement | null {
	const focus = useCanvasFocus()
	const { link, route } = raised
	const tone = focus.linkTone(link)
	const isWorded = raised.isWorded || isLinkWorded(link, tone)
	if (!route.label || (!isWorded && !link.step)) return null
	const at = wordsAt(
		project(view.camera, view.floor, route.label),
		route.points.map(point => project(view.camera, view.floor, point)),
		linkText(link),
		names,
	)
	return (
		<span
			{...stylex.props(
				styles.words,
				styles.centred(at.x, at.y),
				(Boolean(raised.mark) || tone === 'lit') && linkStyles.labelLit,
				raised.isQuiet && styles.nameQuiet,
				tone === 'dim' && linkStyles.labelDim,
				Boolean(link.step) && styles.stack(over),
			)}
		>
			{link.step && (
				<span {...stylex.props(linkStyles.number)}>{link.step}</span>
			)}
			{isWorded && (
				<span {...stylex.props(styles.nameText)}>{linkText(link)}</span>
			)}
		</span>
	)
}

function DeckName({
	deck,
	view,
}: {
	deck: Deck
	view: View
}): ReactElement | null {
	const [slab] = deck.slabs
	if (!deck.name || !slab) return null
	const at = slabCorner(slab, view)
	return (
		<span
			aria-hidden="true"
			{...stylex.props(styles.deck, styles.beside(at.x, at.y))}
		>
			{deck.name}
		</span>
	)
}

type Named = { part: RaisedPart; deck: Deck }

// The named parts, their stacking by nearness (a nearer name overlaps a farther one) and the boxes their chips take, which the links' words keep off.
function namedParts(
	raised: Raised,
	view: View,
): { named: Named[]; ranks: Map<string, number>; names: Box[] } {
	const named = raised.decks.flatMap(deck =>
		deck.parts.filter(part => part.isNamed).map(part => ({ part, deck })),
	)
	const anchored = named.map(entry => ({
		entry,
		anchor: nameAnchor(entry.part, entry.deck.isHanging, view),
	}))
	const ranks = new Map(
		anchored
			.toSorted((a, b) => a.anchor.at.depth - b.anchor.at.depth)
			.map(({ entry }, rank) => [entry.part.key, rank]),
	)
	const names = anchored.map(({ entry, anchor }) =>
		nameBox(anchor.at, entry.part.element.label, anchor.isUnder),
	)
	return { named, ranks, names }
}

// The names over the raised drawing, each part's a button: Tab reaches every named part, Enter selects it.
export function RaisedNames({
	raised,
	view,
	selection,
}: {
	raised: Raised
	view: View
	selection: Selection
}): ReactElement {
	const links = [
		...raised.decks.flatMap(deck => deck.links),
		...raised.overlay,
	]
	const { named, ranks, names } = namedParts(raised, view)
	return (
		<div {...stylex.props(styles.names)}>
			{raised.decks.map(deck => (
				<DeckName key={deck.id} deck={deck} view={view} />
			))}
			{links.map(entry => (
				<LinkWords
					key={entry.key}
					raised={entry}
					view={view}
					over={named.length}
					names={names}
				/>
			))}
			{named.map(({ part, deck }) => (
				<PartName
					key={part.key}
					part={part}
					deck={deck}
					view={view}
					selection={selection}
					rank={ranks.get(part.key) ?? 0}
				/>
			))}
		</div>
	)
}
