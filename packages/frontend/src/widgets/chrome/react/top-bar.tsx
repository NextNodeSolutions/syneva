import { reviewNotes } from '@entities/review/notes'
import { useStoreFields } from '@shared/lib/use-store-version'
import { count, deskControl, segmented } from '@shared/ui/desk-control.styles'
import { Icon } from '@shared/ui/icon'
import { Kbd } from '@shared/ui/kbd'
import { kbd } from '@shared/ui/kbd.styles'
import { tip } from '@shared/ui/tip.styles'
import * as stylex from '@stylexjs/stylex'
import { control, dot } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { chromeCtx } from '../context'
import { isTreeless } from '../layout'

import { BrandBlock } from './brand-block'
import { ResetButton } from './reset-button'
import { ReviewProgress } from './review-progress'
import { topBar } from './top-bar.styles'

import type { ReactElement } from 'react'

// The top bar: brand, lenses, agent status, progress, and the desk-level actions.

// One lens button inside its segmented register.
function Lens({
	on,
	tipText,
	onClick,
	children,
}: {
	on: boolean
	tipText: string
	onClick: () => void
	children: ReactElement | string | (ReactElement | string)[]
}): ReactElement {
	return (
		<button
			{...stylex.props(segmented.item, on && segmented.on, tip.host)}
			aria-pressed={on}
			data-tip={tipText}
			onClick={onClick}
		>
			{children}
		</button>
	)
}

// The view lenses: hide-reviewed (multi-round reviews) and the markdown
// rendered/source pair - each only when it applies to the current file.
function TopLenses(): ReactElement {
	const { S } = chromeCtx()
	// Its own subscription: a lens flips without anything else on the bar changing.
	useStoreFields('state', 'fileIndex', 'fileView', 'settings')
	return (
		<div {...stylex.props(topBar.lenses)}>
			{S.hasReviewed?.() && (
				<div {...stylex.props(segmented.group)}>
					<Lens
						on={S.settings.hideReviewed}
						tipText="Hide accepted changes (⇧H)"
						onClick={() => S.toggleHideReviewed?.()}
					>
						Hide approved
						<Kbd keys="⇧H" css={kbd.onTint} />
					</Lens>
				</div>
			)}
			{S.isMarkdownFile?.() && (
				<div {...stylex.props(segmented.group)}>
					<Lens
						on={S.fileView === 'rendered'}
						tipText="Rendered / source (m)"
						onClick={() => S.setFileView?.('rendered')}
					>
						Rendered
					</Lens>
					<Lens
						on={S.fileView === 'source'}
						tipText="Rendered / source (m)"
						onClick={() => S.setFileView?.('source')}
					>
						Source
					</Lens>
				</div>
			)}
		</div>
	)
}

function AgentStatus(): ReactElement {
	const { S } = chromeCtx()
	const visible =
		S.awaitingAgent && (S.queuedReviews > 0 || Boolean(S.agentActivity))
	if (!visible) return <></>
	const queued = S.queuedReviews > 0
	const text = queued
		? 'No agent attached \u2014 review queued'
		: (S.agentActivity ?? '')
	return (
		<span {...stylex.props(topBar.agent, queued && topBar.agentQueued)}>
			<span
				{...stylex.props(
					dot.base,
					queued ? dot.amber : dot.accent,
					!queued && dot.live,
				)}
			/>
			{text}
		</span>
	)
}

// The compact tile every top-bar action starts from.
const tile = [press.control, control.base, deskControl.compact]

// The notes-panel trigger: a labelled button with the open-thread count riding it.
// Own subscription: the count re-derives off `state` without dragging the other
// desk buttons into every poll.
function NotesButton(): ReactElement {
	const { S } = chromeCtx()
	useStoreFields('state', 'notesOpen')
	const open = reviewNotes(S.state).filter(n => n.status === 'open').length
	return (
		<button
			{...stylex.props(
				tile,
				S.notesOpen ? deskControl.ask : control.outlined,
				tip.host,
			)}
			data-tip="Review notes - all comments & questions (n)"
			aria-pressed={S.notesOpen}
			onClick={() => S.toggleNotes?.()}
		>
			Notes
			{open > 0 && <span {...stylex.props(count.base)}>{open}</span>}
		</button>
	)
}

// The desk-level actions: notes, settings, reset, send, close. Each is a store method
// call - the confirm gates live behind the facade methods. Settings sits here only
// on a desk without a tree (the tree docks it otherwise).
function DeskButtons(): ReactElement {
	const { S } = chromeCtx()
	return (
		<>
			<NotesButton />
			{isTreeless(S) && (
				<button
					{...stylex.props(
						tile,
						control.quiet,
						deskControl.iconCompact,
						tip.host,
					)}
					data-tip="Settings (⇧,)"
					aria-label="Open settings"
					onClick={() => S.openSettings?.()}
				>
					<Icon id="gly-settings" />
				</button>
			)}
			<ResetButton />
			<button
				{...stylex.props(tile, control.primary)}
				disabled={S.awaitingAgent}
				onClick={() => S.confirmSend?.()}
			>
				{S.awaitingAgent ? 'Waiting for agent…' : 'Send to agent'}
				<Kbd keys="⇧S" css={kbd.onFill} />
			</button>
			<button
				{...stylex.props(
					tile,
					control.quiet,
					deskControl.dangerHint,
					tip.host,
					tip.end,
				)}
				data-tip="Close Syneva - stop the desk (⇧Q)"
				onClick={() => void S.closeDesk?.()}
			>
				Close
			</button>
		</>
	)
}

function TopActions(): ReactElement {
	return (
		<div {...stylex.props(topBar.actions)}>
			<AgentStatus />
			<ReviewProgress />
			<DeskButtons />
		</div>
	)
}

export function TopBar(): ReactElement {
	return (
		<header {...stylex.props(topBar.bar)}>
			<BrandBlock />
			<TopLenses />
			<TopActions />
		</header>
	)
}
