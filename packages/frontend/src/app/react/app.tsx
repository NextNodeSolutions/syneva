import { lazy, Suspense } from 'react'

import { deskIdFromLocation } from '@shared/api/base'
import { useMediaQuery } from '@shared/lib/use-media-query'
import * as stylex from '@stylexjs/stylex'
import { queries } from '@syneva/design-system/media.stylex'
import { isTreeless } from '@widgets/chrome/layout'
import { DeskCovers } from '@widgets/chrome/react/desk-covers'
import { ConfirmModal, SendModal } from '@widgets/chrome/react/dialog-modals'
import { DiffArea } from '@widgets/chrome/react/diff-area'
import { GuideBar } from '@widgets/chrome/react/guide-bar'
import { NotesPanel } from '@widgets/chrome/react/notes-panel'
import { Resizer } from '@widgets/chrome/react/resizer'
import { SettingsModal } from '@widgets/chrome/react/settings-modal'
import { Sidebar } from '@widgets/chrome/react/sidebar'
import { TopBar } from '@widgets/chrome/react/top-bar'
import { TransientChrome } from '@widgets/chrome/react/transient-chrome'

import { useStoreFields } from '../../shared/lib/use-store-version'
import { S } from '../store'

import { app } from './app.styles'

import type { Style } from '@shared/lib/cx'
import type { ReactElement } from 'react'

// The hub's rail loads after the review's first paint: nothing in it is needed to read the diff, and the desk's cold open (its initial bundle budget) stays the review's alone.
// Until it lands, its column is the rail's empty paper.
const DeskRail = lazy(async () => {
	const module = await import('@widgets/hub-shell/react/desk-rail')
	return { default: module.DeskRail }
})

// The explanation pane rides its own chunk too: a desk without a guide never loads it, a guided one loads it once the diff is on its way.
const GuidePane = lazy(async () => {
	const module = await import('@widgets/guide-pane/react/guide-pane')
	return { default: module.GuidePane }
})

type Shape = { isTreeless: boolean; isGuideOpen: boolean; isNotesOpen: boolean }

// One static grid template per shape: StyleX compiles each ahead of time, and the tablet rule collapses every one to the diff alone.
function columns(shape: Shape): Style {
	if (shape.isTreeless) {
		if (shape.isGuideOpen)
			return shape.isNotesOpen
				? app.treelessGuideNotes
				: app.treelessGuide
		return shape.isNotesOpen ? app.treelessWithNotes : app.treeless
	}
	if (shape.isGuideOpen)
		return shape.isNotesOpen ? app.withTreeGuideNotes : app.withTreeGuide
	return shape.isNotesOpen ? app.withTreeAndNotes : app.withTree
}

function Workspace(): ReactElement {
	const hasNoTree = isTreeless(S)
	const isGuideOpen =
		(S.hasGuide?.() ?? false) && S.guidePaneOpen && !S.overviewOpen
	// Under the tablet width the explanation stacks under the guide bar, above the diff; wider, it is the column between the tree and the diff.
	const isUnderTablet = useMediaQuery(queries.tablet)
	const isGuideColumn = isGuideOpen && !isUnderTablet
	const pane = (
		<Suspense fallback={<div {...stylex.props(app.guideSpace)} />}>
			<GuidePane />
		</Suspense>
	)
	return (
		<main
			{...stylex.props(
				app.main,
				columns({
					isTreeless: hasNoTree,
					isGuideOpen: isGuideColumn,
					isNotesOpen: S.notesOpen,
				}),
			)}
		>
			<Sidebar hidden={hasNoTree} />
			<div
				{...stylex.props(
					app.backdrop,
					S.treeDrawerOpen && app.backdropOpen,
				)}
				onClick={() => {
					S.treeDrawerOpen = false
				}}
			/>
			<Resizer hidden={hasNoTree} />
			{isGuideColumn && pane}
			{isGuideColumn && <div {...stylex.props(app.guideRule)} />}
			<section {...stylex.props(app.center)}>
				<GuideBar />
				{isGuideOpen && isUnderTablet && pane}
				<DiffArea />
			</section>
			{S.notesOpen && <NotesPanel />}
		</main>
	)
}

export function App(): ReactElement {
	useStoreFields(
		'state',
		'deskClosed',
		'isRefreshRequired',
		'treeDrawerOpen',
		'notesOpen',
		'guidePaneOpen',
		'overviewOpen',
	)
	const isClosed = S.deskClosed && !S.isRefreshRequired
	return (
		<div {...stylex.props(app.frame)}>
			<Suspense fallback={<div {...stylex.props(app.railSpace)} />}>
				<DeskRail
					deskId={deskIdFromLocation(window.location.pathname)}
				/>
			</Suspense>
			<div
				data-desk=""
				{...stylex.props(
					app.root,
					S.isRefreshRequired && app.refreshRequired,
				)}
			>
				<TopBar />
				<DeskCovers />
				{!isClosed && <Workspace />}
				<SettingsModal />
				<ConfirmModal />
				<SendModal />
				<TransientChrome />
			</div>
		</div>
	)
}
