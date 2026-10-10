import { deskControl } from '@shared/ui/desk-control.styles'
import * as stylex from '@stylexjs/stylex'
import { control, tag } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { chromeCtx } from '../../chrome/context'

import { MarkdownHtml } from './blocks/markdown-html'
import { targetLabel } from './discussion'
import { discussion as styles } from './discussion.styles'

import type { DomainThread } from '@entities/review/domain-threads'
import type { DomainComment } from '@entities/review/model'
import type { ReactElement } from 'react'

const MINI = [press.control, control.base, deskControl.mini]

const STATUS = {
	open: { label: 'open', tone: tag.accent },
	answered: { label: 'answered', tone: tag.green },
	resolved: { label: 'resolved', tone: tag.neutral },
} as const

function Message({ message }: { message: DomainComment }): ReactElement {
	const isOwn = message.role !== 'agent'
	return (
		<div {...stylex.props(styles.message, !isOwn && styles.messageAgent)}>
			<div {...stylex.props(styles.meta)}>
				<span
					{...stylex.props(
						styles.author,
						!isOwn && styles.authorAgent,
					)}
				>
					{isOwn ? 'You' : 'Agent'}
				</span>
				{isOwn && message.intent === 'question' && (
					<span {...stylex.props(tag.base, tag.accent)}>
						Question
					</span>
				)}
				{isOwn && message.intent === 'action' && (
					<span {...stylex.props(tag.base, tag.amber)}>
						Change requested
					</span>
				)}
			</div>
			<MarkdownHtml markdown={message.body} />
		</div>
	)
}

// The target as it was written, and the thread's state: answered or waiting, resolved, stale against the current diff, or its target gone from the attached guide.
function ThreadHead({ thread }: { thread: DomainThread }): ReactElement {
	const status = STATUS[thread.status]
	return (
		<div {...stylex.props(styles.head)}>
			<span {...stylex.props(styles.target)}>
				{targetLabel(thread.target)}
			</span>
			<span {...stylex.props(tag.base, status.tone)}>{status.label}</span>
			{thread.stale && (
				<span {...stylex.props(tag.base, tag.amber)}>stale</span>
			)}
			{thread.unanchored && (
				<span
					{...stylex.props(tag.base, tag.amber)}
					title="The attached guide no longer has this target; the thread keeps what it was about."
				>
					target gone
				</span>
			)}
		</div>
	)
}

// The reviewer's bookkeeping on the thread: reply, resolve, reopen. None of it approves code.
function ThreadFoot({ thread }: { thread: DomainThread }): ReactElement {
	const { S } = chromeCtx()
	if (thread.status === 'resolved')
		return (
			<div {...stylex.props(styles.foot)}>
				<button
					{...stylex.props(MINI, deskControl.request)}
					onClick={() =>
						S.setDomainThreadStatus?.(thread.key, 'open')
					}
				>
					Reopen
				</button>
			</div>
		)
	// A reply on a gone target has nowhere to land (the hub refuses a comment on a domain the guide lacks), so the thread offers none.
	return (
		<div {...stylex.props(styles.foot)}>
			{!thread.unanchored && (
				<button
					{...stylex.props(MINI, control.outlined)}
					onClick={() =>
						S.openDomainComposer?.(
							thread.target.domainId,
							thread.target.blockId,
						)
					}
				>
					Reply
				</button>
			)}
			<button
				{...stylex.props(MINI, deskControl.resolve)}
				onClick={() =>
					S.setDomainThreadStatus?.(thread.key, 'resolved')
				}
			>
				Resolve
			</button>
		</div>
	)
}

// One thread on the domain or on a block: its target as written, its state, the exchange, and the reviewer's bookkeeping.
export function ThreadCard({ thread }: { thread: DomainThread }): ReactElement {
	const isWaiting = thread.kind === 'question' && thread.status === 'open'
	return (
		<div
			{...stylex.props(
				styles.thread,
				thread.status === 'resolved' && styles.threadResolved,
			)}
			data-domain-thread={thread.key}
		>
			<ThreadHead thread={thread} />
			{thread.messages.map(message => (
				<Message key={message.id} message={message} />
			))}
			{isWaiting && (
				<div {...stylex.props(styles.waiting)}>
					Waiting for the agent's answer.
				</div>
			)}
			<ThreadFoot thread={thread} />
		</div>
	)
}
