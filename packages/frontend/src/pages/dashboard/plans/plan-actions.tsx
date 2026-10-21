import { useState } from 'react'

import { changePlanStatus, refusalMessage } from '@entities/hub/api'
import { nextStatuses } from '@entities/hub/plan-model'
import { Button } from '@shared/ui/button'
import { ButtonLink } from '@shared/ui/button-link'
import * as stylex from '@stylexjs/stylex'

import { markdownDownload } from './plan-document'
import { planPage } from './plan-page.styles'
import { PlanReviewAction } from './plan-review-action'

import type {
	Plan,
	PlanStatus,
	PlanStatusChange,
} from '@entities/hub/plan-model'
import type { ReactElement } from 'react'

// A move named for what it does to the plan; back to draft reads as a restore from the archive.
const MOVE_LABELS: Record<PlanStatusChange, string> = {
	implemented: 'Mark implemented',
	archived: 'Archive',
	draft: 'Reopen',
}

function moveLabel(to: PlanStatusChange, from: PlanStatus): string {
	return to === 'draft' && from === 'archived' ? 'Restore' : MOVE_LABELS[to]
}

type StatusMove = {
	busy: PlanStatusChange | null
	failure: string | null
	move: (status: PlanStatusChange) => Promise<void>
}

// One status change at a time; the plan it answers is adopted at once, a refusal says why.
function useStatusMove(
	id: string,
	onChanged: (plan: Plan) => void,
): StatusMove {
	const [busy, setBusy] = useState<PlanStatusChange | null>(null)
	const [failure, setFailure] = useState<string | null>(null)
	const move = async (status: PlanStatusChange): Promise<void> => {
		setBusy(status)
		try {
			onChanged(await changePlanStatus(id, status))
			setFailure(null)
		} catch (error) {
			setFailure(
				refusalMessage(
					error,
					'The hub did not take the change. Try again.',
				),
			)
		} finally {
			setBusy(null)
		}
	}
	return { busy, failure, move }
}

type RawToggle = { isRaw: boolean; toggle: () => void }

// The plan as its markdown: read raw in place, or kept as a file named after the plan's own.
function MarkdownActions({
	markdown,
	path,
	raw,
}: {
	markdown: string
	path: string
	raw: RawToggle
}): ReactElement {
	return (
		<>
			<Button
				tone="quiet"
				size="small"
				aria-pressed={raw.isRaw}
				onClick={raw.toggle}
			>
				{raw.isRaw ? 'Read rendered' : 'View raw markdown'}
			</Button>
			<ButtonLink
				{...markdownDownload(markdown, path)}
				tone="quiet"
				size="small"
			>
				Download markdown
			</ButtonLink>
		</>
	)
}

// Review first (the plan's desk, open or opened again), then the reviewer's own word on its
// status, then the plan as its markdown: read raw in place, or kept as a file.
export function PlanActions({
	plan,
	deskPath,
	markdown,
	onChanged,
	raw,
}: {
	plan: Plan
	deskPath: string | null
	markdown: string
	onChanged: (plan: Plan) => void
	raw: RawToggle
}): ReactElement {
	const { busy, failure, move } = useStatusMove(plan.id, onChanged)
	return (
		<div {...stylex.props(planPage.actions)} data-enter="fade">
			<PlanReviewAction plan={plan} tone="primary" deskPath={deskPath} />
			{nextStatuses(plan.status).map(status => (
				<Button
					key={status}
					tone="outlined"
					size="small"
					busy={busy === status}
					disabled={busy !== null}
					onClick={() => void move(status)}
				>
					{moveLabel(status, plan.status)}
				</Button>
			))}
			<MarkdownActions markdown={markdown} path={plan.path} raw={raw} />
			{failure && (
				<span role="alert" {...stylex.props(planPage.failure)}>
					{failure}
				</span>
			)}
		</div>
	)
}
