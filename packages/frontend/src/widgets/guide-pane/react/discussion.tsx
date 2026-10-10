import { domainThreads } from '@entities/review/domain-threads'
import { deskControl } from '@shared/ui/desk-control.styles'
import { Kbd } from '@shared/ui/kbd'
import * as stylex from '@stylexjs/stylex'
import { control } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { chromeCtx } from '../../chrome/context'

import { discussion as styles } from './discussion.styles'
import { Section } from './pane-sections'
import { ThreadCard } from './thread-card'

import type {
	ExplanationBlock,
	GuideDomain,
} from '@entities/review/guide/model'
import type { DomainTarget, ReviewState } from '@entities/review/model'
import type { KeyboardEvent, ReactElement } from 'react'

const MINI = [press.control, control.base, deskControl.mini]

export function targetLabel(
	target: Pick<DomainTarget, 'blockId' | 'blockTitle'>,
): string {
	if (!target.blockId) return 'This domain'
	return `Block: ${target.blockTitle ?? target.blockId}`
}

function composerKeys(
	S: ReturnType<typeof chromeCtx>['S'],
): (event: KeyboardEvent<HTMLTextAreaElement>) => void {
	return event => {
		if (event.key === 'Escape') {
			event.preventDefault()
			S.closeDomainComposer?.()
			return
		}
		if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return
		event.preventDefault()
		S.submitDomainComment?.(event.shiftKey ? 'question' : 'action')
	}
}

// The composer for a domain or one of its blocks: a question goes to the agent now, a change request rides the next Send. The same keys as the line composer.
export function DomainComposer({
	target,
}: {
	target: Pick<DomainTarget, 'blockId' | 'blockTitle'>
}): ReactElement {
	const { S } = chromeCtx()
	return (
		<div {...stylex.props(styles.composer)} data-domain-composer="">
			<label {...stylex.props(styles.composerLabel)}>
				Ask about or request a change on{' '}
				{targetLabel(target).toLowerCase()}
				<textarea
					{...stylex.props(styles.textarea)}
					value={S.domainComposerBody}
					placeholder="What is unclear, or what should change?"
					autoFocus
					onChange={event => {
						S.domainComposerBody = event.target.value
					}}
					onKeyDown={composerKeys(S)}
				/>
			</label>
			<div {...stylex.props(styles.actions)}>
				<button
					{...stylex.props(MINI, deskControl.ask)}
					onClick={() => S.submitDomainComment?.('question')}
				>
					Ask <Kbd keys="⌘⇧↵" />
				</button>
				<button
					{...stylex.props(MINI, deskControl.request)}
					onClick={() => S.submitDomainComment?.('action')}
				>
					Request change <Kbd keys="⌘↵" />
				</button>
				<button
					{...stylex.props(MINI, control.quiet)}
					onClick={() => S.closeDomainComposer?.()}
				>
					Cancel
				</button>
			</div>
		</div>
	)
}

// The block's own hook into the discussion: opens the composer right under it.
export function BlockFeedback({
	domain,
	block,
}: {
	domain: GuideDomain
	block: ExplanationBlock
}): ReactElement {
	const { S } = chromeCtx()
	return (
		<button
			{...stylex.props(MINI, control.quiet)}
			aria-label={`Ask about or request a change on this ${block.kind} block`}
			onClick={() => S.openDomainComposer?.(domain.id, block.id)}
		>
			Comment
		</button>
	)
}

// The domain's threads (its own and its blocks') with the composer on the domain itself; a question's agent reply lands here live.
export function Discussion({
	domain,
	state,
}: {
	domain: GuideDomain
	state: ReviewState
}): ReactElement {
	const { S } = chromeCtx()
	const threads = domainThreads(state, domain.id)
	const composer = S.domainComposer
	const isOnDomain = composer?.domainId === domain.id && !composer.blockId
	return (
		<Section
			label="Discussion"
			count={threads.length || undefined}
			trail={
				<button
					{...stylex.props(MINI, control.outlined)}
					data-domain-ask=""
					onClick={() => S.openDomainComposer?.(domain.id)}
				>
					Ask / request
				</button>
			}
		>
			{isOnDomain && <DomainComposer target={{}} />}
			{threads.map(thread => (
				<ThreadCard key={thread.key} thread={thread} />
			))}
			{!threads.length && !isOnDomain && (
				<p {...stylex.props(styles.empty)}>
					No question or change request on this domain yet. Ask the
					agent, or request a change it will receive on Send.
				</p>
			)}
		</Section>
	)
}
