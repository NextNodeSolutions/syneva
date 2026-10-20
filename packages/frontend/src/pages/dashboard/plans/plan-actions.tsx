import { useState } from 'react'

import { changePlanStatus, hubRefusal } from '@entities/hub/api'
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

type Move = { status: PlanStatusChange; label: string }

// The reviewer's own word on a plan: built, set aside, or back on the table. Approval is not
// among them: it only comes from a Send on the plan's desk.
const MOVES: Record<PlanStatus, Move[]> = {
	draft: [
		{ status: 'implemented', label: 'Mark implemented' },
		{ status: 'archived', label: 'Archive' },
	],
	approved: [
		{ status: 'implemented', label: 'Mark implemented' },
		{ status: 'archived', label: 'Archive' },
	],
	implemented: [
		{ status: 'draft', label: 'Reopen' },
		{ status: 'archived', label: 'Archive' },
	],
	archived: [{ status: 'draft', label: 'Restore' }],
}

function refusalText(error: unknown): string {
	const refusal = hubRefusal(error)
	if (refusal.kind === 'refused') return refusal.reason
	return 'The hub did not take the change. Try again.'
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
			setFailure(refusalText(error))
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
			{MOVES[plan.status].map(({ status, label }) => (
				<Button
					key={status}
					tone="outlined"
					size="small"
					busy={busy === status}
					disabled={busy !== null}
					onClick={() => void move(status)}
				>
					{label}
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
