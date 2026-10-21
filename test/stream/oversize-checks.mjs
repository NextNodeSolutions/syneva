// A desk whose pulse outgrows a frame (comments past frameBytes): the stream keeps its readers,
// sends that desk's pulse partial (its head and a digest), and GET …/pulse answers it whole; a
// comment moves the digest, a status line alone does not.
import { BRIDGE_LIMITS } from '../../packages/contracts/dist/bridge.js'
import { HUB_PATHS } from '../../packages/contracts/dist/routes.js'

import { isPulse, QUIET_MS } from './converge-checks.mjs'
import { SESSION } from './hub-driver.mjs'
import { agreesWithRoute, isPartial, readPulse } from './pulse-oracle.mjs'
import { closeReader, readSnapshot, settle, waitFor } from './stream-client.mjs'

const BIG_SESSION = `${SESSION}-big`
// Each comment's size: the desk takes as many as its pulse needs to pass frameBytes.
const COMMENT_CHARS = 200_000
const HTTP_OK = 200
const STATUS_LINE = 'reading the long thread'

export async function checkOversize(context) {
	const { report, driver, repo, url, headers } = context
	report.section('an oversized desk')
	const desk = await report.step(
		`a desk whose pulse passes frameBytes (${BRIDGE_LIMITS.frameBytes} bytes)`,
		() => openBigDesk(driver, repo),
	)
	if (!desk) return
	const reader = await report.step('the snapshot reaches snapshot-end', () =>
		readSnapshot(url, headers),
	)
	if (reader) await checkReader(context, reader, desk)
	await driver.cli(['close', '--session', BIG_SESSION], repo.root)
}

async function checkReader({ report, driver }, reader, desk) {
	report.check(
		'every snapshot frame fits frameBytes',
		reader.frames.every(each => each.bytes <= BRIDGE_LIMITS.frameBytes),
	)
	const first = reader.frames.find(each => isPulse(desk.id)(each.frame))
	const { body: whole } = await readPulse(driver, desk.id)
	report.check(
		'its pulse is partial: /pulse head and a digest, nothing else',
		isPartial(first?.frame.pulse) &&
			agreesWithRoute(first.frame.pulse, whole),
	)
	report.check(
		`/pulse answers it whole (${whole.comments?.length} comments)`,
		whole.comments?.length === desk.comments,
	)
	const digest = first?.frame.pulse.partial?.digest
	const moved = await report.step('a comment moves the digest', () =>
		after(
			reader,
			desk.id,
			() => comment(driver, desk.id, 'one more'),
			pulse => isPartial(pulse) && pulse.partial.digest !== digest,
		),
	)
	await report.step('a status line alone keeps the digest', () =>
		after(
			reader,
			desk.id,
			() => post(driver, desk.id, 'status', { body: STATUS_LINE }),
			pulse =>
				pulse.agentActivity?.body === STATUS_LINE &&
				pulse.partial?.digest === moved?.frame.pulse.partial.digest,
		),
	)
	await settle(reader, QUIET_MS)
	report.check(
		'the socket stays open',
		reader.socket.readyState === reader.socket.OPEN,
	)
	await closeReader(reader)
}

// A desk of its own, its pulse grown past a frame by comments; hands back its id and how many.
async function openBigDesk(driver, repo) {
	const open = ['open', '--no-open', '--no-guide', '--session', BIG_SESSION]
	const { code } = await driver.cli(open, repo.root)
	if (code !== 0) throw new Error(`syneva open exited ${code}`)
	const { body } = await driver.json(HUB_PATHS.desks)
	const desk = body.desks.find(
		each => each.root === repo.root && each.session === BIG_SESSION,
	)
	if (!desk) throw new Error('the desk is not listed')
	let comments = 0
	let bytes = 0
	// Sequential by nature: each comment is sized against the pulse the one before left.
	while (bytes <= BRIDGE_LIMITS.frameBytes) {
		comments += 1
		await comment(
			driver,
			desk.id,
			`${comments} ${'x'.repeat(COMMENT_CHARS)}`,
		)
		const { body: pulse } = await readPulse(driver, desk.id)
		bytes = Buffer.byteLength(JSON.stringify(pulse))
	}
	return { id: desk.id, comments }
}

function comment(driver, deskId, body) {
	return post(driver, deskId, 'comment', {
		path: 'a.txt',
		lineNumber: 2,
		body,
	})
}

async function post(driver, deskId, route, body) {
	const { status } = await driver.post(`/api/desks/${deskId}/${route}`, body)
	if (status !== HTTP_OK) throw new Error(`POST /${route} answered ${status}`)
}

// The first pulse of the desk after `action` that `test` accepts.
async function after(reader, deskId, action, test) {
	const from = reader.frames.length
	await action()
	return waitFor(reader, isPulse(deskId, test), { from, what: 'the pulse' })
}
