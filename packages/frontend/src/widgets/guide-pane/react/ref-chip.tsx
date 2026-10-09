import { referenceStatus } from '@entities/review/guide/resolution'
import * as stylex from '@stylexjs/stylex'

import { chromeCtx } from '../../chrome/context'

import { refChip } from './ref-chip.styles'

import type { GuideDomain, GuideReference } from '@entities/review/guide/model'
import type { ReactElement } from 'react'

function describe(reference: GuideReference): string {
	const side = reference.side === 'deletions' ? 'old' : 'new'
	const end = reference.endLine ? `-${reference.endLine}` : ''
	const role = reference.role === 'context' ? ' · unchanged context' : ''
	return `${reference.path} · ${side} line ${reference.lineNumber}${end}${role}`
}

function chipTitle(
	reference: GuideReference,
	status: 'resolved' | 'stale' | 'unresolved',
	reason: string | undefined,
): string {
	if (status === 'unresolved')
		return `Unresolved: ${describe(reference)} - ${reason ?? 'the target is gone'}`
	if (status === 'stale')
		return `${describe(reference)} - ${reason ?? 'changed since the guide was written'}`
	return describe(reference)
}

// The one code-reference control: a resolved target lands on its code (pointer and keyboard alike, through followReference), a stale one says so and still lands, an unresolved one names what is gone and goes nowhere.
export function RefChip({
	domain,
	reference,
}: {
	domain: GuideDomain
	reference: GuideReference
}): ReactElement {
	const { S } = chromeCtx()
	const { status, reason } = referenceStatus(S.state, domain.id, reference.id)
	const isUnresolved = status === 'unresolved'
	const title = chipTitle(reference, status, reason)
	return (
		<button
			{...stylex.props(
				refChip.chip,
				reference.role === 'context' && refChip.context,
				status === 'stale' && refChip.stale,
				isUnresolved && refChip.unresolved,
			)}
			data-ref={`${domain.id}:${reference.id}`}
			data-status={status}
			title={title}
			aria-disabled={isUnresolved || undefined}
			onClick={() => S.followReference?.(domain.id, reference.id)}
		>
			{reference.role === 'context' && (
				<span aria-hidden="true" {...stylex.props(refChip.glyph)}>
					◌
				</span>
			)}
			<span>{reference.label ?? describe(reference)}</span>
			{status !== 'resolved' && (
				<span {...stylex.props(refChip.state)}>{status}</span>
			)}
		</button>
	)
}
