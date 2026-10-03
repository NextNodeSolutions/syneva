import { useState } from 'react'

import { agentState, modeLabel, plural, relativeTime } from '../format'

import type { HubDesk, HubProject } from '@entities/hub/model'
import type { ReactElement } from 'react'

const FULL_PERCENT = 100

type DeskRowProps = {
	desk: HubDesk
	now: number
	onClose: (desk: HubDesk) => Promise<void>
}

// Files signed off over files in the review - the same "approved" the desk's own header
// counts, so the two never disagree. An empty desk has no bar: it waits for changes.
function Progress({ desk }: { desk: HubDesk }): ReactElement {
	if (desk.empty)
		return <span className="progress-note">waiting for changes</span>
	const pct =
		desk.files > 0
			? Math.round((desk.approvedFiles / desk.files) * FULL_PERCENT)
			: 0
	return (
		<span
			className="progress"
			role="progressbar"
			aria-valuenow={pct}
			aria-valuemin={0}
			aria-valuemax={FULL_PERCENT}
			aria-label={`${desk.approvedFiles} of ${desk.files} files approved`}
		>
			<i style={{ width: `${pct}%` }} />
			<b>
				{desk.approvedFiles}/{desk.files}
			</b>
		</span>
	)
}

function AgentBadge({ desk }: { desk: HubDesk }): ReactElement {
	const state = agentState(desk)
	return (
		<span className={`agent agent-${state.tone}`}>
			<i aria-hidden="true" />
			<span>{state.label}</span>
			{desk.agentActivity && (
				<em title={desk.agentActivity.body}>
					{desk.agentActivity.body}
				</em>
			)}
		</span>
	)
}

// The open counts that explain why a desk is not simply "done": requests and questions.
function OpenItems({ desk }: { desk: HubDesk }): ReactElement {
	const parts = [
		desk.openRequests ? plural(desk.openRequests, 'change request') : '',
		desk.openQuestions ? plural(desk.openQuestions, 'open question') : '',
	].filter(Boolean)
	if (!parts.length) return <></>
	return <span className="open-items">{parts.join(' · ')}</span>
}

// Close is destructive for the agent (it is told the review ended), so the button arms first:
// the second click confirms, anything else disarms.
function CloseButton({
	desk,
	onClose,
}: Pick<DeskRowProps, 'desk' | 'onClose'>): ReactElement {
	const [armed, setArmed] = useState(false)
	const [busy, setBusy] = useState(false)
	const confirm = async (): Promise<void> => {
		setBusy(true)
		try {
			await onClose(desk)
		} finally {
			setBusy(false)
			setArmed(false)
		}
	}
	if (!armed)
		return (
			<button
				className="btn"
				onClick={() => setArmed(true)}
				aria-label={`Close desk ${desk.session}`}
			>
				Close
			</button>
		)
	return (
		<span className="confirm-close">
			<button
				className="btn danger"
				disabled={busy}
				onClick={() => void confirm()}
			>
				{busy ? 'Closing…' : 'Confirm close'}
			</button>
			<button className="btn" onClick={() => setArmed(false)}>
				Keep
			</button>
		</span>
	)
}

function DeskRow({ desk, now, onClose }: DeskRowProps): ReactElement {
	return (
		<li className="desk-row">
			<div className="desk-id">
				<a className="session" href={desk.path}>
					{desk.session}
				</a>
				<span className="chip">{modeLabel(desk)}</span>
			</div>
			<div className="desk-files">
				{desk.empty ? '-' : plural(desk.files, 'file')}
			</div>
			<div className="desk-progress">
				<Progress desk={desk} />
				<OpenItems desk={desk} />
			</div>
			<div className="desk-agent">
				<AgentBadge desk={desk} />
			</div>
			<div className="desk-when" title={desk.lastActivityAt}>
				{relativeTime(desk.lastActivityAt, now)}
			</div>
			<div className="desk-actions">
				<a className="btn primary" href={desk.path}>
					Open
				</a>
				<CloseButton desk={desk} onClose={onClose} />
			</div>
		</li>
	)
}

export function ProjectSection({
	project,
	now,
	onClose,
}: {
	project: HubProject
	now: number
	onClose: (desk: HubDesk) => Promise<void>
}): ReactElement {
	return (
		<section className="project" aria-label={`Project ${project.name}`}>
			<header className="project-head">
				<span className="label">Project</span>
				<h2>{project.name}</h2>
				<code className="root" title={project.root}>
					{project.root}
				</code>
				<span className="count">
					{plural(project.desks.length, 'desk')}
				</span>
			</header>
			<ul className="desk-list">
				{project.desks.map(desk => (
					<DeskRow
						key={desk.id}
						desk={desk}
						now={now}
						onClose={onClose}
					/>
				))}
			</ul>
		</section>
	)
}
