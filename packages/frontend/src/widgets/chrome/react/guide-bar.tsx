import { useStoreFields } from '@shared/lib/use-store-version'
import { count, deskControl } from '@shared/ui/desk-control.styles'
import { Icon } from '@shared/ui/icon'
import { Kbd } from '@shared/ui/kbd'
import { tip } from '@shared/ui/tip.styles'
import * as stylex from '@stylexjs/stylex'
import { control } from '@syneva/design-system/controls.styles'
import { kbd } from '@syneva/design-system/inline.styles'
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
			title="Parts of this guide describe an earlier diff - the stale domains are marked; ask your agent for a fresh guide (syneva reload --guide)"
		>
			<Icon id="gly-warn" />
			Guide partly stale
		</span>
	)
}

function StepButton({
	tipText,
	ariaLabel,
	onClick,
	children,
}: {
	tipText: string
	ariaLabel: string
	onClick: () => void
	children: ReactElement | string | (ReactElement | string)[]
}): ReactElement {
	return (
		<button
			{...stylex.props(
				press.control,
				control.base,
				control.outlined,
				deskControl.mini,
				tip.host,
			)}
			data-tip={tipText}
			aria-label={ariaLabel}
			onClick={onClick}
		>
			{children}
		</button>
	)
}

// The domain moves beside the file moves: a domain, a change of it, back after a reference, and the explanation's toggle.
function DomainControls(): ReactElement {
	const { S } = chromeCtx()
	return (
		<>
			<StepButton
				tipText="Previous domain (⇧D)"
				ariaLabel="Previous domain"
				onClick={() => S.stepDomain?.(-1)}
			>
				<Kbd keys="⇧D" /> domain
			</StepButton>
			<StepButton
				tipText="Next domain (d)"
				ariaLabel="Next domain"
				onClick={() => S.stepDomain?.(1)}
			>
				domain <Kbd keys="d" />
			</StepButton>
			<StepButton
				tipText="Previous change of the domain (,)"
				ariaLabel="Previous change of the domain"
				onClick={() => S.stepDomainChange?.(-1)}
			>
				<Kbd keys="," /> change
			</StepButton>
			<StepButton
				tipText="Next change of the domain (.)"
				ariaLabel="Next change of the domain"
				onClick={() => S.stepDomainChange?.(1)}
			>
				change <Kbd keys="." />
			</StepButton>
			<button
				{...stylex.props(
					press.control,
					control.base,
					S.guidePaneOpen ? deskControl.ask : control.outlined,
					deskControl.mini,
					tip.host,
				)}
				data-tip="Show / hide the explanation (g)"
				aria-pressed={S.guidePaneOpen}
				onClick={() => S.toggleGuidePane?.()}
			>
				Explain{' '}
				<Kbd keys="g" css={S.guidePaneOpen ? kbd.onTint : undefined} />
			</button>
		</>
	)
}

// The file moves: overview, the whole-file comment, previous and next file.
function FileControls(): ReactElement {
	const { S } = chromeCtx()
	const canCommentOnFile =
		!S.overviewOpen && (S.fileCommentAvailable?.() ?? false)
	return (
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
	)
}

export function GuideBar(): ReactElement {
	const { S } = chromeCtx()
	useStoreFields(
		'state',
		'settings',
		'overviewOpen',
		'fileComposerOpen',
		'guidePaneOpen',
		'domainId',
	)
	if (!(S.showGuideBar?.() ?? false)) return <></>
	return (
		<div {...stylex.props(guideBar.bar)}>
			<FileControls />
			{!S.overviewOpen && (
				<div {...stylex.props(guideBar.acts)}>
					<DomainControls />
				</div>
			)}
			{(S.guideStale?.() ?? false) && <StaleNotice />}
		</div>
	)
}
