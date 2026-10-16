import * as stylex from '@stylexjs/stylex'
import { caption, tag } from '@syneva/design-system/controls.styles'

import { chromeCtx } from '../context'

import { note as row, notes as panel } from './notes-panel.styles'

import type { DomainThread } from '@entities/review/domain-threads'
import type { ReactElement } from 'react'

const PREVIEW_MAX = 120
const PREVIEW_HEAD = 117

function oneline(body: string): string {
	const text = body.replace(/\s+/g, ' ').trim()
	return text.length > PREVIEW_MAX ? `${text.slice(0, PREVIEW_HEAD)}…` : text
}

const STATUS_TONES = {
	open: tag.accent,
	answered: tag.green,
	resolved: tag.neutral,
}

function statusLabel(thread: DomainThread): string {
	if (thread.status !== 'open') return thread.status
	return thread.awaitingAnswer ? 'waiting' : 'open'
}

function DomainNoteRow({
	thread,
	index,
}: {
	thread: DomainThread
	index: number
}): ReactElement {
	const { S } = chromeCtx()
	const [first] = thread.messages
	const { target } = thread
	const cursor = index === S.notesCursor
	return (
		<button
			{...stylex.props(
				row.row,
				thread.status === 'resolved' && row.resolved,
				cursor && row.cursor,
			)}
			data-status={thread.status}
			data-cursor={cursor || undefined}
			onClick={() => {
				S.notesCursor = index
				S.openDomainThread?.(target.domainId)
			}}
		>
			<span {...stylex.props(row.top)}>
				<span {...stylex.props(row.where)}>
					{target.blockId
						? `block · ${target.blockTitle ?? target.blockId}`
						: 'domain'}
				</span>
				{thread.unanchored && (
					<span {...stylex.props(row.flag)}>target gone</span>
				)}
				<span
					{...stylex.props(
						tag.base,
						STATUS_TONES[thread.status],
						row.status,
					)}
				>
					{statusLabel(thread)}
				</span>
			</span>
			<span {...stylex.props(row.clamp, row.body)}>
				{oneline(first?.body ?? '')}
			</span>
		</button>
	)
}

// Threads on the guide, grouped by domain: a click opens that domain's explanation with its discussion - no file to land on first.
// The threads come in screen order (visibleDomainThreads) and the cursor index runs on from the line notes (startIndex), so the keyboard walks these rows after the comments.
export function DomainNoteSection({
	threads,
	startIndex,
}: {
	threads: DomainThread[]
	startIndex: number
}): ReactElement {
	const byDomain = Map.groupBy(
		threads.map((thread, offset) => ({
			thread,
			index: startIndex + offset,
		})),
		entry => entry.thread.target.domainId,
	)
	return (
		<div {...stylex.props(panel.section)}>
			<div {...stylex.props(caption.base, caption.upper, panel.label)}>
				Domains
				{threads.length > 0 && (
					<span {...stylex.props(panel.labelCount)}>
						{threads.length}
					</span>
				)}
			</div>
			{!threads.length && (
				<div {...stylex.props(panel.none)}>
					No question or change request on a domain.
				</div>
			)}
			{[...byDomain.entries()].map(([domainId, group]) => (
				<div key={domainId} {...stylex.props(panel.file)}>
					<div
						{...stylex.props(panel.fileName)}
						title={group[0]?.thread.target.domainTitle ?? domainId}
					>
						{group[0]?.thread.target.domainTitle ?? domainId}
					</div>
					{group.map(entry => (
						<DomainNoteRow
							key={entry.thread.key}
							thread={entry.thread}
							index={entry.index}
						/>
					))}
				</div>
			))}
		</div>
	)
}
