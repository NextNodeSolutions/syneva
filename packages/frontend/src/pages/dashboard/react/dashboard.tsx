import { useState } from 'react'

import { closeHubDesk } from '@entities/hub/api'
import { groupByProject } from '@entities/hub/model'

import { plural, relativeTime } from '../format'
import { useHub } from '../use-hub'

import { ProjectSection } from './desk-rows'
import { NewDeskPanel } from './new-desk'

import type { HubDesk, HubHealth } from '@entities/hub/model'
import type { ReactElement } from 'react'

// The Syneva mark - the favicon's three blurred discs, the geometry the desk page shares.
function Mark(): ReactElement {
	return (
		<svg
			className="mark"
			aria-hidden="true"
			viewBox="4 -5 120 120"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle cx="54" cy="56" r="44" fill="#EB5103" opacity="0.9" />
			<circle cx="72.6" cy="56" r="44" fill="#EFCA44" opacity="0.9" />
			<circle cx="64.6" cy="54" r="44" fill="#FAF6EA" opacity="0.92" />
		</svg>
	)
}

function Header({
	health,
	onNew,
}: {
	health: HubHealth | null
	onNew: () => void
}): ReactElement {
	return (
		<header className="hub-top">
			<div className="brand">
				<Mark />
				<span className="name">Syneva</span>
				<span className="label">Hub</span>
			</div>
			<div className="hub-meta">
				<code className="origin">{window.location.origin}</code>
				{health && <span className="version">v{health.version}</span>}
				{health?.keyRequired && (
					<a className="btn ghost" href="/logout">
						Sign out
					</a>
				)}
				<button className="btn primary" onClick={onNew}>
					New review
				</button>
			</div>
		</header>
	)
}

function EmptyState({ onNew }: { onNew: () => void }): ReactElement {
	return (
		<section className="empty">
			<p className="label">No desks open</p>
			<h2>The hub is running. Nothing is under review yet.</h2>
			<p>
				In a repository, run <code>syneva open</code> (your agent does
				this when it has changes for you), or open a desk from here.
			</p>
			<button className="btn primary" onClick={onNew}>
				New review
			</button>
		</section>
	)
}

function Footer({
	desks,
	unreachable,
	notice,
	now,
	syncedAt,
}: {
	desks: HubDesk[] | null
	unreachable: boolean
	notice: string
	now: number
	syncedAt: string
}): ReactElement {
	return (
		<footer className="hub-foot">
			<span>{desks ? plural(desks.length, 'desk') : 'Loading…'}</span>
			{notice && <span className="notice-text">{notice}</span>}
			<span className="muted">
				{unreachable
					? 'hub not answering - showing the last listing'
					: `updated ${relativeTime(syncedAt, now)}`}
			</span>
		</footer>
	)
}

// Close a desk and say what happened, then re-read the listing so the row leaves at once.
async function closeAndReport(
	desk: HubDesk,
	report: (notice: string) => void,
	refresh: () => Promise<void>,
): Promise<void> {
	try {
		const closed = await closeHubDesk(desk.id)
		report(
			closed
				? `Closed ${desk.session} - the agent was told.`
				: `${desk.session} was already closed.`,
		)
	} catch {
		report(`Could not close ${desk.session}.`)
	}
	await refresh()
}

export function Dashboard(): ReactElement {
	const hub = useHub()
	const [isNewOpen, setNewOpen] = useState(false)
	const [notice, setNotice] = useState('')
	const syncedAt = new Date(hub.now).toISOString()
	const onClose = (desk: HubDesk): Promise<void> =>
		closeAndReport(desk, setNotice, hub.refresh)
	const projects = hub.desks ? groupByProject(hub.desks) : []
	return (
		<div className="hub">
			<Header health={hub.health} onNew={() => setNewOpen(true)} />
			{hub.unreachable && (
				<div className="notice" role="status">
					The hub is not answering. If it was stopped, run{' '}
					<code>syneva start</code>; this page reconnects by itself.
				</div>
			)}
			<main className="hub-main">
				{hub.desks && !hub.desks.length && (
					<EmptyState onNew={() => setNewOpen(true)} />
				)}
				{projects.map(project => (
					<ProjectSection
						key={project.root}
						project={project}
						now={hub.now}
						onClose={onClose}
					/>
				))}
			</main>
			<Footer
				desks={hub.desks}
				unreachable={hub.unreachable}
				notice={notice}
				now={hub.now}
				syncedAt={syncedAt}
			/>
			{isNewOpen && <NewDeskPanel onCancel={() => setNewOpen(false)} />}
		</div>
	)
}
