import { orderedDomains } from '@entities/review/guide/domains'
import { useStoreFields } from '@shared/lib/use-store-version'
import { count, deskControl } from '@shared/ui/desk-control.styles'
import { Icon } from '@shared/ui/icon'
import { tip } from '@shared/ui/tip.styles'
import * as stylex from '@stylexjs/stylex'
import { control } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { chromeCtx } from '../context'

import { guideBar as strip } from './guide-bar.styles'

import type { ReactElement } from 'react'
import type { ChromeStoreView } from '../context'

const square = [
	press.control,
	control.base,
	control.quiet,
	deskControl.mini,
	deskControl.iconMini,
	tip.host,
]

type Position = { index: number | null; total: number }

function formatPosition({ index, total }: Position): string {
	return `${index ?? '-'}/${total}`
}

// One level of the reading: its name, where the reviewer is in it, and its two steps either side. Only the digits change its width, so the steps stay under the pointer.
function StepGroup({
	label,
	position,
	keys,
	onStep,
}: {
	label: string
	position: Position
	keys: [string, string]
	onStep: (direction: 1 | -1) => void
}): ReactElement {
	const name = label.toLowerCase()
	return (
		<span {...stylex.props(strip.group)}>
			<button
				{...stylex.props(square)}
				data-tip={`Previous ${name} (${keys[0]})`}
				aria-label={`Previous ${name}`}
				onClick={() => onStep(-1)}
			>
				<Icon id="gly-arrow-left" />
			</button>
			<span {...stylex.props(strip.label)}>
				{label}{' '}
				<span {...stylex.props(strip.number)}>
					{formatPosition(position)}
				</span>
			</span>
			<button
				{...stylex.props(square)}
				data-tip={`Next ${name} (${keys[1]})`}
				aria-label={`Next ${name}`}
				onClick={() => onStep(1)}
			>
				<Icon id="gly-arrow-right" />
			</button>
		</span>
	)
}

function domainPosition(S: ChromeStoreView): Position {
	const domains = orderedDomains(S.state?.guide)
	const index = S.overviewOpen
		? -1
		: domains.findIndex(domain => domain.id === S.domainId)
	return { index: index >= 0 ? index + 1 : null, total: domains.length }
}

function HomeButton(): ReactElement {
	const { S } = chromeCtx()
	return (
		<button
			{...stylex.props(
				square,
				tip.start,
				S.overviewOpen && deskControl.ask,
			)}
			onClick={() => S.openOverview?.()}
			data-tip="Project level (o)"
			aria-label="Project level"
			aria-pressed={S.overviewOpen}
		>
			<Icon id="gly-home" />
		</button>
	)
}

function FileCommentButton(): ReactElement {
	const { S } = chromeCtx()
	const open = S.openFileCommentCount?.() ?? 0
	return (
		<button
			{...stylex.props(
				square,
				control.outlined,
				S.fileComposerOpen && deskControl.ask,
				strip.trigger,
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

function ExplainToggle(): ReactElement {
	const { S } = chromeCtx()
	return (
		<button
			{...stylex.props(
				press.control,
				control.base,
				S.guidePaneOpen ? deskControl.ask : control.outlined,
				deskControl.mini,
				tip.host,
				tip.end,
			)}
			data-tip="Show / hide the explanation (g)"
			aria-pressed={S.guidePaneOpen}
			onClick={() => S.toggleGuidePane?.()}
		>
			Explain
		</button>
	)
}

function StaleNotice(): ReactElement {
	return (
		<span
			{...stylex.props(strip.stale)}
			title="Parts of this guide describe an earlier diff - the stale domains are marked; ask your agent for a fresh guide (syneva reload --guide)"
		>
			<Icon id="gly-warn" />
			Guide partly stale
		</span>
	)
}

// The levels the code sits in, shown once the code is open: the file in the active order, and the domain's change under the cursor.
function CodeLevels(): ReactElement {
	const { S } = chromeCtx()
	const file = S.filePosition?.()
	const change = S.changePosition?.()
	return (
		<>
			{file && (
				<>
					<span {...stylex.props(strip.rule)} />
					<StepGroup
						label="File"
						position={file}
						keys={['⇧←', '⇧→']}
						onStep={direction =>
							direction === 1 ? S.guideNext?.() : S.guidePrev?.()
						}
					/>
				</>
			)}
			{change && (
				<>
					<span {...stylex.props(strip.rule)} />
					<StepGroup
						label="Change"
						position={change}
						keys={[',', '.']}
						onStep={direction => S.stepDomainChange?.(direction)}
					/>
					{change.brick && (
						<span
							{...stylex.props(strip.brick)}
							title="The brick under the cursor"
						>
							{change.brick}
						</span>
					)}
				</>
			)}
		</>
	)
}

// The position strip: the project level, then the reading's levels with their steps, and at the far end what acts on the code (the file comment, the explanation's toggle). Every move has one control here and one key; the explanation's head keeps only Back.
export function GuideBar(): ReactElement {
	const { S } = chromeCtx()
	useStoreFields(
		'state',
		'settings',
		'overviewOpen',
		'codeOpen',
		'fileComposerOpen',
		'guidePaneOpen',
		'domainId',
		'fileIndex',
		'preview',
		'sidebarTab',
		'cursorTick',
	)
	if (!(S.showGuideBar?.() ?? false)) return <></>
	const isCode = S.codeOpen && !S.overviewOpen
	const canCommentOnFile = isCode && (S.fileCommentAvailable?.() ?? false)
	return (
		<div {...stylex.props(strip.bar)} data-guide-controls="">
			<HomeButton />
			<span {...stylex.props(strip.rule)} />
			<StepGroup
				label="Domain"
				position={domainPosition(S)}
				keys={['⇧D', 'd']}
				onStep={direction => S.stepDomain?.(direction)}
			/>
			{isCode && <CodeLevels />}
			<span {...stylex.props(strip.spacer)} />
			{(S.guideStale?.() ?? false) && <StaleNotice />}
			<div {...stylex.props(strip.acts)}>
				{canCommentOnFile && <FileCommentButton />}
				{isCode && <ExplainToggle />}
			</div>
		</div>
	)
}
