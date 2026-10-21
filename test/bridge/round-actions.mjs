// A review round as the agent (the CLI, against the hub) and the reviewer (the desk's API, through
// the fake's relay as a tab on the web sends it, or against the hub) take it, each action followed
// by the frames it must raise on the web tab, every desk and plan named by its web id.
import { writeFileSync } from 'node:fs'
import path from 'node:path'

import { webDeskId } from '../../packages/contracts/dist/bridge.js'
import {
	deskApiBase,
	deskPagePath,
	HUB_PATHS,
} from '../../packages/contracts/dist/routes.js'
import { waitFor } from '../stream/stream-client.mjs'

import { HTTP_OK } from './http-wire.mjs'
import {
	isDesk,
	isJournal,
	isPulse,
	PLAN_SESSION,
	SESSION,
} from './web-ids.mjs'

export function roundActions(context, tab) {
	const { report, driver, repo, record } = context
	const cli = async (...args) => {
		const { code, stdout } = await driver.cli(args, repo.root)
		if (code !== 0)
			throw new Error(`syneva ${args[0]} exited ${code}: ${stdout}`)
	}
	const act = (name, action, expected) =>
		report.step(name, async () => {
			const from = tab.frames.length
			await action()
			await Promise.all(
				expected.map(([what, predicate]) =>
					waitFor(tab, predicate, { from, what }),
				),
			)
		})
	const opened = async session => {
		const { body } = await driver.json(HUB_PATHS.desks)
		const local = body.desks.find(
			each => each.session === session && each.root === repo.root,
		)
		if (!local) throw new Error(`no desk for ${session}`)
		const webId = webDeskId(record.hubId, local.id)
		return { localId: local.id, webId, local }
	}
	const steps = { cli, act, opened, reviewer: reviewerOf(context) }
	return {
		open: () => openDesk(context, tab, steps),
		openPlan: () => openPlan(context, tab, steps),
		round: desk => driveRound(steps, desk),
		reload: desk => reload(context, steps, desk),
		close: (desk, session) => close(steps, desk, session),
	}
}

async function reload({ repo }, { cli, act }, desk) {
	repo.edit('line one\nline 2 changed again\nline three\n')
	await act(
		'reload: desk-reloaded, desk, pulse',
		() => cli('reload', '--session', SESSION),
		[
			['desk-reloaded', isJournal('desk-reloaded', desk.webId)],
			['desk', isDesk(desk.webId)],
			['pulse', isPulse(desk.webId)],
		],
	)
}

function close({ cli, act }, desk, session) {
	return act(
		`close ${session}: closed, desk-closed`,
		() => cli('close', '--session', session),
		[
			[
				'closed',
				frame => frame?.t === 'closed' && frame.deskId === desk.webId,
			],
			['desk-closed', isJournal('desk-closed', desk.webId)],
		],
	)
}

// Where the reviewer's requests go: through the fake's relay (`viaWeb`, the desk and plan named
// by their web ids) or to the hub itself.
function reviewerOf({ driver, fake, hub, viaWeb }) {
	const send = async (route, body) => {
		const target = viaWeb ? fake.origin : hub.url
		const response = await fetch(new URL(route, target), {
			method: 'POST',
			headers: { 'content-type': 'application/json', ...driver.auth },
			body: JSON.stringify(body),
		})
		if (response.status !== HTTP_OK)
			throw new Error(`POST ${route} answered ${response.status}`)
	}
	return {
		desk: (desk, route, body) =>
			send(
				`${deskApiBase(viaWeb ? desk.webId : desk.localId)}${route}`,
				body,
			),
		plan: (plan, route, body) =>
			send(
				`${HUB_PATHS.plans}/${viaWeb ? plan.webPlanId : plan.localPlanId}${route}`,
				body,
			),
	}
}

async function openDesk({ report }, tab, { cli, opened }) {
	return report.step(
		'open: desk (web id and page), pulse, desk-opened',
		async () => {
			const from = tab.frames.length
			await cli('open', '--no-open', '--no-guide', '--session', SESSION)
			const desk = await opened(SESSION)
			const line = await waitFor(tab, isDesk(desk.webId), {
				from,
				what: 'desk',
			})
			if (line.frame.desk.path !== deskPagePath(desk.webId))
				throw new Error(`its path is ${line.frame.desk.path}`)
			await waitFor(tab, isPulse(desk.webId), { from, what: 'pulse' })
			await waitFor(tab, isJournal('desk-opened', desk.webId), {
				from,
				what: 'desk-opened',
			})
			return desk
		},
	)
}

// A plan desk: its desk frame names the plan's web id, the plan's frame names its desk's; a
// status change through the plan's route raises the plan's frame again.
async function openPlan({ report, repo, record }, tab, steps) {
	const { cli, opened } = steps
	writeFileSync(
		path.join(repo.root, 'plan.md'),
		'# Bridge plan\n\nShip the probe.\n',
	)
	const plan = await report.step(
		'open plan: desk and plan frames by web id',
		async () => {
			const from = tab.frames.length
			await cli(
				'open',
				'plan',
				'plan.md',
				'--no-open',
				'--session',
				PLAN_SESSION,
			)
			const desk = await opened(PLAN_SESSION)
			const localPlanId = desk.local.plan
			const webPlanId = webDeskId(record.hubId, localPlanId)
			const namesPlan = frame =>
				isDesk(desk.webId)(frame) && frame.desk.plan === webPlanId
			const namesDesk = frame =>
				isPlan(webPlanId)(frame) && frame.plan.desk?.id === desk.webId
			await waitFor(tab, namesPlan, {
				from,
				what: 'desk naming its plan',
			})
			await waitFor(tab, namesDesk, {
				from,
				what: 'plan naming its desk',
			})
			return { ...desk, localPlanId, webPlanId }
		},
	)
	if (plan) await archive(steps, plan)
	return plan
}

function archive({ act, reviewer }, plan) {
	return act(
		'plan status: plan frame',
		() => reviewer.plan(plan, '/status', { status: 'archived' }),
		[
			[
				'archived',
				frame =>
					isPlan(plan.webPlanId)(frame) &&
					frame.plan.status === 'archived',
			],
		],
	)
}

const isPlan = id => frame => frame?.t === 'plan' && frame.plan.id === id

async function driveRound({ cli, act, reviewer }, desk) {
	const id = desk.webId
	const awaitOnce = () => cli('await', '--timeout', '5', '--session', SESSION)
	const note = ['--path', 'a.txt', '--line', '2', '--body', 'an agent note']
	await act(
		'comment: agent-replied, pulse',
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
		'ask: question-asked, pulse',
		() => reviewer.desk(desk, '/ask', question),
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
	await act(
		'send: round-sent, pulse',
		() => reviewer.desk(desk, '/send', { overallNote: 'fine' }),
		[
			['round-sent', isJournal('round-sent', id)],
			['queued review', isPulse(id, pulse => pulse.queuedReviews === 1)],
		],
	)
	await act('await (the review): round-picked, pulse', awaitOnce, [
		['round-picked', isJournal('round-picked', id)],
		['no queued review', isPulse(id, pulse => pulse.queuedReviews === 0)],
	])
}
