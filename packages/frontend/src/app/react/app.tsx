import { lazy, Suspense } from 'react'

import { deskIdFromLocation } from '@shared/api/base'
import * as stylex from '@stylexjs/stylex'
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

// The hub's rail loads after the review's first paint: nothing in it is needed to read the
// diff, and the desk's cold open (its initial bundle budget) stays the review's alone. Until it
// lands, its column is the rail's empty paper.
const DeskRail = lazy(async () => {
	const module = await import('@widgets/hub-shell/react/desk-rail')
	return { default: module.DeskRail }
})

// The workspace's columns for the desk's shape (see app.styles.ts).
function columns(shape: { isTreeless: boolean; isNotesOpen: boolean }): Style {
	if (shape.isTreeless)
		return shape.isNotesOpen ? app.treelessWithNotes : app.treeless
	return shape.isNotesOpen ? app.withTreeAndNotes : app.withTree
}

// The workspace: tree, resizer, guide bar + diff, and the notes ledger when open. A desk
// without a tree keeps the tree and the resizer mounted but hidden (its shape can change
// on reload).
function Workspace(): ReactElement {
	const hasNoTree = isTreeless(S)
	return (
		<main
			{...stylex.props(
				app.main,
				columns({ isTreeless: hasNoTree, isNotesOpen: S.notesOpen }),
			)}
		>
			<Sidebar hidden={hasNoTree} />
			{/* Tablets only: dims the diff behind the open file drawer; tap to close. */}
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
			<section {...stylex.props(app.center)}>
				<GuideBar />
				<DiffArea />
			</section>
			{S.notesOpen && <NotesPanel />}
		</main>
	)
}

// The app shell: the hub's rail at the left edge, then the desk - top bar, the status covers,
// the workspace and the floating layers. The desk's root carries its scope marker (data-desk)
// the page-neutral desk stylesheet keys on.
export function App(): ReactElement {
	useStoreFields(
		'state',
		'deskClosed',
		'isRefreshRequired',
		'treeDrawerOpen',
		'notesOpen',
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
