// The frames the CLI's and a tab's actions raise on a live stream (open, open plan, comment, ask,
// await, send, reload, close): their `desk`, `pulse`, `journal`, `plan` and `closed` frames; then
// the stream converged on the HTTP routes, the journal whole and in order, the window kept.
import { writeFileSync } from 'node:fs'
import path from 'node:path'

import { HUB_PATHS } from '../../packages/contracts/dist/routes.js'

import {
	checkJournalWhole,
	checkLiveFrames,
	converge,
	isLine,
	isPlan,
	isPulse,
	QUIET_MS,
} from './converge-checks.mjs'
import { SESSION } from './hub-driver.mjs'
import { settle, waitFor } from './stream-client.mjs'

export const PLAN_SESSION = `${SESSION}-plan`
const HTTP_OK = 200

const isJournal = (kind, id) => frame =>
	frame?.t === 'journal' &&
	frame.events.some(event => event.kind === kind && event.deskId === id)

// One action, then every expected frame among those that followed it, in any order.
function actor({ report, reader, driver, repo }) {
	const cli = async (...args) => {
		const { code, stdout } = await driver.cli(args, repo.root)
		if (code !== 0)
			throw new Error(`syneva ${args[0]} exited ${code}: ${stdout}`)
	}
	const act = (name, action, expected) =>
		report.step(name, async () => {
			const from = reader.frames.length
			await action()
			const found = []
			for (const [what, predicate] of expected)
				found.push(await waitFor(reader, predicate, { from, what }))
			return found
		})
	// A new desk's frames: its `desk` names it, then its own pulse and journal entry. Hands back
	// the desk and where its frames start (a plan's frame may come before its desk's).
	const opened = (name, action, isNew) =>
		report.step(name, async () => {
			const from = reader.frames.length
			await action()
			const line = await waitFor(reader, isNew, { from, what: 'desk' })
			const { id } = line.frame.desk
			await waitFor(reader, isPulse(id), { from, what: 'pulse' })
			const journal = isJournal('desk-opened', id)
			await waitFor(reader, journal, { from, what: 'desk-opened' })
			return { desk: line.frame.desk, from }
		})
	const post = async (route, body) => {
		const { status } = await driver.post(route, body)
		if (status !== HTTP_OK)
			throw new Error(`POST ${route} answered ${status}`)
	}
	return { cli, act, opened, post }
}

export async function checkEvents(context) {
	const { report, reader, repo } = context
	report.section('events')
	const steps = actor(context)
	const { cli, act, opened } = steps
	const isNew = frame =>
		frame?.t === 'desk' &&
		frame.desk.root === repo.root &&
		frame.desk.session === SESSION
	const open = () =>
		cli('open', '--no-open', '--no-guide', '--session', SESSION)
	const { desk } =
		(await opened('open: desk, pulse, journal desk-opened', open, isNew)) ??
		{}
	if (!desk) return
	const plan = await openPlan(context, steps)
	await driveReview(steps, desk.id)
	await reload(context, steps, desk.id)
	await converge(context, { id: desk.id, plan })
	await act(
		'close: closed, journal desk-closed',
		() => cli('close', '--session', SESSION),
		[
			[
				'closed',
				frame => frame?.t === 'closed' && frame.deskId === desk.id,
			],
			['desk-closed', isJournal('desk-closed', desk.id)],
		],
	)
	await settle(reader, QUIET_MS)
	await checkJournalWhole(context)
	checkLiveFrames(context)
}

// A plan desk: the desk naming its record, the record's `plan` frame, a status change's frame.
async function openPlan({ report, reader, repo }, { cli, act, opened, post }) {
	const file = path.join(repo.root, 'plan.md')
	writeFileSync(file, '# Stream plan\n\nShip the stream.\n')
	const { desk, from } = await opened(
		'open plan: desk naming its plan, pulse, journal desk-opened',
		() =>
			cli(
				'open',
				'plan',
				'plan.md',
				'--no-open',
				'--session',
				PLAN_SESSION,
			),
		frame => frame?.t === 'desk' && frame.desk.session === PLAN_SESSION,
	)
	const planId = desk?.plan
	if (!planId) return null
	await report.step('open plan: plan frame for its record', () =>
		waitFor(reader, isPlan(planId), { from, what: 'plan' }),
	)
	const archive = () =>
		post(`${HUB_PATHS.plans}/${planId}/status`, { status: 'archived' })
	await act('plan status: plan frame', archive, [
		[
			'archived',
			frame => isPlan(planId)(frame) && frame.plan.status === 'archived',
		],
	])
	return { id: planId, deskId: desk.id }
}

// A review round as the agent and the tab drive it: a comment, a question and its pickup, a
// Send and its pickup.
async function driveReview({ cli, act, post }, id) {
	const desk = `/api/desks/${id}`
	const awaitOnce = () => cli('await', '--timeout', '5', '--session', SESSION)
	const note = ['--path', 'a.txt', '--line', '2', '--body', 'an agent note']
	await act(
		'comment: journal agent-replied, pulse',
		() => cli('comment', ...note, '--session', SESSION),
		[
			['agent-replied', isJournal('agent-replied', id)],
			['comment', isPulse(id, pulse => pulse.comments.length > 0)],
		],
	)
	const question = {
		path: 'a.txt',
		lineNumber: 2,
		side: 'additions',
		body: 'why?',
	}
	await act(
		'ask: journal question-asked, pulse',
		() => post(`${desk}/ask`, question),
		[
			['question-asked', isJournal('question-asked', id)],
			[
				'queued question',
				isPulse(id, pulse => pulse.queuedQuestions === 1),
			],
		],
	)
	await act('await (the question): pulse', awaitOnce, [
		[
			'no queued question',
			isPulse(id, pulse => pulse.queuedQuestions === 0),
		],
	])
	const send = () => post(`${desk}/send`, { overallNote: 'fine' })
	await act('send: journal round-sent, pulse', send, [
		['round-sent', isJournal('round-sent', id)],
		['queued review', isPulse(id, pulse => pulse.queuedReviews === 1)],
	])
	await act('await (the review): journal round-picked, pulse', awaitOnce, [
		['round-picked', isJournal('round-picked', id)],
		['no queued review', isPulse(id, pulse => pulse.queuedReviews === 0)],
	])
}

async function reload({ repo }, { cli, act }, id) {
	repo.edit('line one\nline 2 changed again\nline three\n')
	await act(
		'reload: journal desk-reloaded, desk, pulse',
		() => cli('reload', '--session', SESSION),
		[
			['desk-reloaded', isJournal('desk-reloaded', id)],
			['desk', isLine(id)],
			['pulse', isPulse(id)],
		],
	)
}
