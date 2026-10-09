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
	return thread.kind === 'question' ? 'waiting' : 'open'
}

function DomainNoteRow({ thread }: { thread: DomainThread }): ReactElement {
	const { S } = chromeCtx()
	const [first] = thread.messages
	const { target } = thread
	return (
		<button
			{...stylex.props(
				row.row,
				thread.status === 'resolved' && row.resolved,
			)}
			data-status={thread.status}
			onClick={() => S.openDomainThread?.(target.domainId)}
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
export function DomainNoteSection({
	threads,
}: {
	threads: DomainThread[]
}): ReactElement {
	const byDomain = new Map<string, DomainThread[]>()
	for (const thread of threads) {
		const group = byDomain.get(thread.target.domainId)
		if (group) group.push(thread)
		else byDomain.set(thread.target.domainId, [thread])
	}
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
						title={group[0]?.target.domainTitle ?? domainId}
					>
						{group[0]?.target.domainTitle ?? domainId}
					</div>
					{group.map(thread => (
						<DomainNoteRow key={thread.key} thread={thread} />
					))}
				</div>
			))}
		</div>
	)
}
