import * as stylex from '@stylexjs/stylex'

import { linkText } from '../layout/scene'

import { useCanvasActions } from './canvas-actions'
import { useCanvasFocus } from './canvas-focus'
import { ChangeTag } from './change-tag'
import { DomainNumbers } from './domain-numbers'
import { KIND_WORDS, KindGlyph } from './kind-glyph'
import { link as linkStyles } from './link.styles'
import { slabCorner } from './name-anchor'
import { projection as styles } from './projection.styles'
import { raisedLabels } from './raised-labels'

import type { ReactElement } from 'react'
import type { Selection } from '../model'
import type { Deck, Raised, RaisedPart } from '../projection/raised'
import type { NameLabel, WordsLabel } from './raised-labels'
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
				title={element.label}
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

// A part's name where the labels' layout set it, its domains' numbers after it (outside the name's button: a button holds no other) when no face carries them.
function PartName({
	label,
	selection,
}: {
	label: NameLabel
	selection: Selection
}): ReactElement {
	const focus = useCanvasFocus()
	const actions = useCanvasActions()
	const { part, at, lift } = label
	const { id } = part.element
	const tone = focus.toneOf(id)
	const isSelected = selection.selected === id
	return (
		<span
			onMouseEnter={() => actions.onHover(id)}
			onMouseLeave={() => actions.onHover(null)}
			{...stylex.props(
				styles.name,
				part.solid.isPlatform && styles.plaque,
				label.isUnder
					? styles.under(at.x, at.y + lift)
					: styles.above(at.x, at.y + lift),
				styles.stack(label.rank),
				part.isQuiet && styles.nameQuiet,
				tone === 'lit' && styles.nameLit,
				tone === 'dim' && styles.nameDim,
				isSelected && styles.nameSelected,
			)}
		>
			<NameButton
				part={part}
				deck={label.deck}
				isSelected={isSelected}
				onSelect={() => selection.onSelect(id)}
			/>
			{label.hasNumbers && (
				<DomainNumbers domains={focus.domainsOf(part.element)} />
			)}
		</span>
	)
}

// A link's step number and words where the labels' layout set them, over every name: a stretch no name covers, or, for words the reviewer looks at or a step's number with no free stretch, the one least covered. A route with no point for its words says nothing at all: a link ELK gave no label, and every link of the 3D view's far floor, which steps back silent.
function LinkWords({
	label,
	over,
}: {
	label: WordsLabel
	// The stack the words take, above every name.
	over: number
}): ReactElement {
	const focus = useCanvasFocus()
	const { raised, at } = label
	const { link } = raised
	const tone = focus.linkTone(link)
	return (
		<span
			{...stylex.props(
				styles.words,
				styles.centred(at.x, at.y),
				(Boolean(raised.mark) || tone === 'lit') && linkStyles.labelLit,
				raised.isQuiet && styles.nameQuiet,
				tone === 'dim' && linkStyles.labelDim,
				styles.stack(over),
			)}
		>
			{link.step && (
				<span {...stylex.props(linkStyles.number)}>{link.step}</span>
			)}
			{label.hasWords && <span>{linkText(link)}</span>}
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
	const focus = useCanvasFocus()
	const { names, words } = raisedLabels(raised, view, focus)
	return (
		<div {...stylex.props(styles.names)}>
			{raised.decks.map(deck => (
				<DeckName key={deck.id} deck={deck} view={view} />
			))}
			{words.map(label => (
				<LinkWords
					key={label.raised.key}
					label={label}
					over={names.length}
				/>
			))}
			{names.map(label => (
				<PartName
					key={label.part.key}
					label={label}
					selection={selection}
				/>
			))}
		</div>
	)
}
