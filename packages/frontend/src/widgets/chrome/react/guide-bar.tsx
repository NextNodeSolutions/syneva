import { useStoreFields } from '@shared/lib/use-store-version'
import { count, deskControl } from '@shared/ui/desk-control.styles'
import { Icon } from '@shared/ui/icon'
import { tip } from '@shared/ui/tip.styles'
import * as stylex from '@stylexjs/stylex'
import { control } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { chromeCtx } from '../context'

import { guideBar } from './guide-bar.styles'

import type { ReactElement } from 'react'

const square = [
	press.control,
	control.base,
	control.outlined,
	deskControl.mini,
	deskControl.iconMini,
	tip.host,
]

function FileCommentButton(): ReactElement {
	const { S } = chromeCtx()
	const open = S.openFileCommentCount?.() ?? 0
	return (
		<button
			{...stylex.props(
				square,
				S.fileComposerOpen && deskControl.ask,
				guideBar.trigger,
			)}
			data-file-comment-trigger=""
			data-tip="Comment on file (⇧C)"
			aria-label="Comment on file"
			aria-pressed={S.fileComposerOpen}
			onClick={() => S.toggleFileComposer?.()}
		>
			<Icon id="gly-comment" />
			{open > 0 && (
				<span {...stylex.props(count.base, count.corner)}>{open}</span>
			)}
		</button>
	)
}

function NavButton({
	direction,
	disabled,
	onClick,
	ariaLabel,
}: {
	direction: 'prev' | 'next'
	disabled: boolean
	onClick: () => void
	ariaLabel: string
}): ReactElement {
	const tips = { prev: 'Previous file (⇧←)', next: 'Next file (⇧→)' }
	const icons = { prev: 'gly-arrow-left', next: 'gly-arrow-right' }
	return (
		<button
			{...stylex.props(square)}
			onClick={onClick}
			disabled={disabled}
			data-tip={tips[direction]}
			aria-label={ariaLabel}
		>
			<Icon id={icons[direction]} />
		</button>
	)
}

function HomeButton(): ReactElement {
	const { S } = chromeCtx()
	return (
		<button
			{...stylex.props(square, S.overviewOpen && deskControl.ask)}
			onClick={() => S.openOverview?.()}
			data-tip="Overview (o)"
			aria-label="Open overview"
			aria-pressed={S.overviewOpen}
		>
			<Icon id="gly-home" />
		</button>
	)
}

function StaleNotice(): ReactElement {
	return (
		<span
			{...stylex.props(guideBar.stale)}
			title="Guide generated for an earlier diff - regenerate and restart with --guide to refresh"
		>
			<Icon id="gly-warn" />
			Guide stale
		</span>
	)
}

export function GuideBar(): ReactElement {
	const { S } = chromeCtx()
	useStoreFields('state', 'settings', 'overviewOpen', 'fileComposerOpen')
	if (!(S.showGuideBar?.() ?? false)) return <></>
	const canCommentOnFile =
		!S.overviewOpen && (S.fileCommentAvailable?.() ?? false)
	return (
		<div {...stylex.props(guideBar.bar)}>
			<div {...stylex.props(guideBar.acts)}>
				<HomeButton />
				{canCommentOnFile && <FileCommentButton />}
				<NavButton
					direction="prev"
					disabled={S.guideAtStart?.() ?? false}
					onClick={() => S.guidePrev?.()}
					ariaLabel="Previous file"
				/>
				<NavButton
					direction="next"
					disabled={S.guideAtLast?.() ?? false}
					onClick={() => S.guideNext?.()}
					ariaLabel="Next file"
				/>
			</div>
			{(S.guideStale?.() ?? false) && <StaleNotice />}
		</div>
	)
}
