import * as stylex from '@stylexjs/stylex'

import { linkText } from '../layout/scene'
import { project } from '../projection/camera'
import { nearness } from '../projection/faces'

import { useCanvasFocus } from './canvas-focus'
import { ChangeTag } from './change-tag'
import { DomainBadges } from './domain-badges'
import { KIND_WORDS, KindGlyph } from './kind-glyph'
import { link as linkStyles } from './link.styles'
import { projection as styles } from './projection.styles'

import type { ModelElement } from '@entities/review/guide/system-model'
import type { ReactElement } from 'react'
import type { Scene } from '../layout/scene'
import type { Selection } from '../model'
import type { Camera, ScreenPoint, Size } from '../projection/camera'
import type { Route, Solid } from '../projection/solids'

const MIDDLE = 0.5
// How far above its block a part's name floats.
const LIFT = 6

type View = { camera: Camera; floor: Size }

// A block's name over the middle of its top; a platform's plaque at the top corner nearest the viewer.
function anchorOf(solid: Solid, { camera, floor }: View): ScreenPoint {
	if (!solid.isPlatform)
		return project(camera, floor, {
			x: solid.x + solid.width * MIDDLE,
			y: solid.y + solid.length * MIDDLE,
			z: solid.top + LIFT,
		})
	const corners = [0, 1].flatMap(fx =>
		[0, 1].map(fy =>
			project(camera, floor, {
				x: solid.x + solid.width * fx,
				y: solid.y + solid.length * fy,
				z: solid.top,
			}),
		),
	)
	return corners.reduce((low, point) => (point.y > low.y ? point : low))
}

function NameBody({
	element,
	isPlatform,
}: {
	element: ModelElement
	isPlatform: boolean
}): ReactElement {
	const focus = useCanvasFocus()
	return (
		<>
			<KindGlyph kind={element.kind} />
			<span
				{...stylex.props(
					styles.nameText,
					element.change === 'removed' && styles.struck,
				)}
			>
				{element.label}
			</span>
			{!isPlatform && <ChangeTag change={element.change} />}
			<DomainBadges
				domains={focus.domainsOf(element)}
				css={styles.nameBadges}
			/>
		</>
	)
}

function PartName({
	solid,
	rank,
	scene,
	view,
	selection,
}: {
	solid: Solid
	rank: number
	scene: Scene
	view: View
	selection: Selection
}): ReactElement | null {
	const focus = useCanvasFocus()
	const element = scene.elements.get(solid.id)
	if (!element) return null
	const at = anchorOf(solid, view)
	const tone = focus.toneOf(solid.id)
	const isSelected = selection.selected === solid.id
	return (
		<button
			type="button"
			aria-pressed={isSelected}
			aria-label={`${element.label}, ${KIND_WORDS[element.kind]}`}
			onClick={() => selection.onSelect(solid.id)}
			{...stylex.props(
				styles.name,
				solid.isPlatform && styles.plaque,
				solid.isPlatform
					? styles.under(at.x, at.y)
					: styles.above(at.x, at.y),
				styles.stack(rank),
				tone === 'lit' && styles.nameLit,
				tone === 'dim' && styles.nameDim,
				isSelected && styles.nameSelected,
			)}
		>
			<NameBody element={element} isPlatform={solid.isPlatform} />
		</button>
	)
}

function LinkWords({
	route,
	scene,
	view,
}: {
	route: Route
	scene: Scene
	view: View
}): ReactElement | null {
	const focus = useCanvasFocus()
	const link = scene.links.find(entry => entry.id === route.id)
	if (!link || !route.label) return null
	const at = project(view.camera, view.floor, route.label)
	const tone = focus.linkTone(link)
	return (
		<span
			{...stylex.props(
				styles.words,
				styles.centred(at.x, at.y),
				tone === 'lit' && linkStyles.labelLit,
				tone === 'dim' && linkStyles.labelDim,
			)}
		>
			{link.step && (
				<span {...stylex.props(linkStyles.number)}>{link.step}</span>
			)}
			<span {...stylex.props(styles.nameText)}>{linkText(link)}</span>
		</span>
	)
}

// The names over the raised drawing, each part's a button: Tab reaches every part, Enter selects it.
export function ProjectedNames({
	raised,
	scene,
	selection,
}: {
	raised: View & { solids: readonly Solid[]; routes: readonly Route[] }
	scene: Scene
	selection: Selection
}): ReactElement {
	const near = (solid: Solid): number =>
		nearness(solid, raised.camera, raised.floor)
	// Stacked by nearness, so a nearer name overlaps a farther one, while Tab still walks the parts in the model's order.
	const ranks = new Map(
		raised.solids
			.toSorted((a, b) => near(a) - near(b))
			.map((solid, rank) => [solid.id, rank]),
	)
	return (
		<div {...stylex.props(styles.names)}>
			{raised.routes.map(route => (
				<LinkWords
					key={route.id}
					route={route}
					scene={scene}
					view={raised}
				/>
			))}
			{raised.solids.map(solid => (
				<PartName
					key={solid.id}
					solid={solid}
					rank={ranks.get(solid.id) ?? 0}
					scene={scene}
					view={raised}
					selection={selection}
				/>
			))}
		</div>
	)
}
