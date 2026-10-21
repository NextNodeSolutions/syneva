// A snapshot read against what the hub's HTTP routes answer at the same moment: `hello`, one
// `desk` and one `pulse` per live desk (newest first), the journal tail, every plan, the hub's
// pairing, `snapshot-end`, in that order, every frame naming the hub and under `frameBytes`; each
// pulse is its desk's GET …/pulse, whole or partial (pulse-oracle.mjs).
import { isDeepStrictEqual } from 'node:util'

import {
	BRIDGE_LIMITS,
	LOCAL_HUB_ID,
} from '../../packages/contracts/dist/bridge.js'
import { HUB_PATHS } from '../../packages/contracts/dist/routes.js'

import { agreesWithRoute, isPartial, readPulse } from './pulse-oracle.mjs'
import { readSnapshot } from './stream-client.mjs'

const SNAPSHOT_ORDER = /^(desk pulse )*(journal )*(plan )*pairing snapshot-end$/
const HELLO_FIELDS = ['id', 'name', 'version', 'instanceId', 'startedAt']

export async function checkSnapshot({ report, url, headers, driver }, label) {
	report.section(`snapshot (${label})`)
	const reader = await readSnapshot(url, headers)
	const end = reader.frames.findIndex(each => each.frame.t === 'snapshot-end')
	const received = reader.frames.slice(0, end + 1)
	const frames = received.map(each => each.frame)
	const [hello, ...rest] = frames
	const hub = hello.hub ?? {}
	report.check('hello comes first', hello.t === 'hello')
	report.check(
		'hello names the hub',
		HELLO_FIELDS.every(
			field => typeof hub[field] === 'string' && hub[field],
		),
		JSON.stringify(hub),
	)
	report.check(`the hub id is '${LOCAL_HUB_ID}'`, hub.id === LOCAL_HUB_ID)
	const { body: health } = await driver.json(HUB_PATHS.health)
	report.check(
		'hello agrees with /api/hub/health',
		hub.version === health.version &&
			hub.instanceId === health.instanceId &&
			hub.startedAt === health.startedAt,
	)
	const order = rest.map(frame => frame.t).join(' ')
	report.check(
		'desk+pulse pairs, journal, plans, the pairing, snapshot-end',
		SNAPSHOT_ORDER.test(order),
		order,
	)
	report.check(
		'every frame names the hub',
		rest.every(frame => frame.hubId === hub.id),
	)
	report.check(
		'every frame fits frameBytes',
		received.every(each => each.bytes <= BRIDGE_LIMITS.frameBytes),
	)
	await checkDesks(report, driver, rest)
	const latestSeq = await checkJournal(report, driver, rest)
	await checkPlans(report, driver, rest)
	return { reader, hello, end, latestSeq }
}

async function checkDesks(report, driver, frames) {
	const lines = frames.filter(frame => frame.t === 'desk')
	const pulses = frames.filter(frame => frame.t === 'pulse')
	report.check(
		'each pulse follows its desk',
		lines.every((line, at) => pulses[at]?.deskId === line.desk.id),
	)
	const { body } = await driver.json(HUB_PATHS.desks)
	report.check(
		`the desks are /api/hub/desks (${lines.length})`,
		isDeepStrictEqual(
			lines.map(line => line.desk),
			body.desks,
		),
	)
	for (const pulse of pulses) {
		const [whole, poll] = await Promise.all([
			readPulse(driver, pulse.deskId),
			driver.json(`/api/desks/${pulse.deskId}/poll`),
		])
		const { serverInstanceId, ...polled } = whole.body
		report.check(
			`pulse ${pulse.deskId} is its /pulse${isPartial(pulse.pulse) ? ' (partial)' : ''}, /poll and the instance`,
			agreesWithRoute(pulse.pulse, whole.body) &&
				typeof serverInstanceId === 'string' &&
				isDeepStrictEqual(polled, poll.body),
		)
	}
}

// The tail is /api/hub/journal's, oldest first, in batches of at most journalPerFrame events.
async function checkJournal(report, driver, frames) {
	const batches = frames.filter(frame => frame.t === 'journal')
	const events = batches.flatMap(batch => batch.events)
	const { body } = await driver.json(
		`${HUB_PATHS.journal}?after=0&limit=${BRIDGE_LIMITS.journalTail}`,
	)
	report.check(
		`the journal tail is /api/hub/journal's (${events.length} events)`,
		isDeepStrictEqual(events, body.events),
	)
	report.check(
		'journal batches hold 1 to journalPerFrame events',
		batches.every(
			batch =>
				batch.events.length > 0 &&
				batch.events.length <= BRIDGE_LIMITS.journalPerFrame,
		),
	)
	return body.latest
}

async function checkPlans(report, driver, frames) {
	const plans = frames
		.filter(frame => frame.t === 'plan')
		.map(frame => frame.plan)
	const { body } = await driver.json(HUB_PATHS.plans)
	report.check(
		`the plans are /api/hub/plans' (${plans.length})`,
		isDeepStrictEqual(byId(plans), byId(body.plans)),
	)
}

function byId(records) {
	return Object.fromEntries(records.map(record => [record.id, record]))
}
