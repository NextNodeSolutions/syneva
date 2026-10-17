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

import type { ReactElement } from 'react'
import type { Selection } from '../model'
import type { Deck, Raised, RaisedLink, RaisedPart } from '../projection/raised'
import type { View } from './solid-shape'

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

// A link's words where its route says them: a step's number always, its words when the link is news or looked at. A step stacks over every name (the path is what a dynamic view is for); other words go under them.
function LinkWords({
	raised,
	view,
	over,
}: {
	raised: RaisedLink
	view: View
	// The stack a step's words take, above every name.
	over: number
}): ReactElement | null {
	const focus = useCanvasFocus()
	const { link, route } = raised
	const tone = focus.linkTone(link)
	const isWorded = raised.isWorded || isLinkWorded(link, tone)
	if (!route.label || (!isWorded && !link.step)) return null
	const at = project(view.camera, view.floor, route.label)
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

// The names over the raised drawing, each part's a button: Tab reaches every named part, Enter selects it. Stacked by nearness, so a nearer name overlaps a farther one.
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
	const named = raised.decks.flatMap(deck =>
		deck.parts.filter(part => part.isNamed).map(part => ({ part, deck })),
	)
	const near = ({ part, deck }: (typeof named)[number]): number =>
		nameAnchor(part, deck.isHanging, view).at.depth
	const ranks = new Map(
		named
			.toSorted((a, b) => near(a) - near(b))
			.map((entry, rank) => [entry.part.key, rank]),
	)
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
