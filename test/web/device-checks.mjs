// Pairing on the web: `syneva login` approved on the device page, which names the hub and the
// account it pairs to, and approves only with the proof its own Approve carries.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import os from 'node:os'

import { WEB_PATHS } from '../../packages/contracts/dist/web.js'
import { spawnCli } from '../bridge/hub-process.mjs'
import { bridgeFile } from '../bridge/pairing-checks.mjs'

import { pagePolicyGap } from './page-checks.mjs'
import { EMAIL } from './session-checks.mjs'
import { HTTP_FORBIDDEN, HTTP_GONE, HTTP_OK } from './statuses.mjs'
import { approveDevice, openDevicePage } from './web-client.mjs'

const CODE_LINE = /confirm the code ([A-Z0-9]{4}-[A-Z0-9]{4})/
const CODE_WAIT_MS = 15_000
const HUB_ID = /^[a-f0-9]{16}$/
// The device page shows the hub's name as the CLI sent it (the hostname), cut to its cap.
const SHOWN_NAME_LENGTH = 20
// As long as a real proof (an HMAC-SHA256 in hex).
const FORGED_PROOF_LENGTH = 64

// `syneva login` against the web, its code approved on the device page: the hub's id, or null.
export async function checkPairing(context) {
	const { report, browser, web } = context
	report.section('pairing')
	const login = spawnCli(context, ['login', '--web', web.origin, '--no-open'])
	const [, userCode] =
		(await login.line(CODE_LINE, CODE_WAIT_MS).catch(() => null)) ?? []
	report.check(
		'`syneva login` prints a XXXX-XXXX code and the device page to confirm it at',
		Boolean(userCode) &&
			login.output.stderr.includes(
				`${web.origin}${WEB_PATHS.device}?code=${userCode}`,
			),
		login.output.stderr,
	)
	if (!userCode) return null
	const proof = await checkDevicePage(context, userCode)
	await checkUnconfirmed(context, userCode)
	const approved = await approveDevice(browser, { userCode, proof })
	report.check(
		"POST /device with the page's proof approves it",
		approved.status === HTTP_OK && approved.body.approved === true,
		JSON.stringify(approved.body),
	)
	const { code, stderr } = await login.exited
	report.check(
		'`syneva login` exits 0 once the hub is connected',
		code === 0 && /: the hub is connected\.$/m.test(stderr),
		stderr,
	)
	return checkPaired(context, { userCode, proof })
}

// The page the person approves on: the hub, the account, the way out; its approval proof.
async function checkDevicePage({ report, browser }, userCode) {
	const { page, text, proof } = await openDevicePage(browser, userCode)
	report.check(
		'the device page shows the hub that asked, with Approve and Deny',
		page.status === HTTP_OK &&
			text.includes(os.hostname().slice(0, SHOWN_NAME_LENGTH)) &&
			text.includes('Approve'),
		`${page.status}`,
	)
	const back = encodeURIComponent(`${WEB_PATHS.device}?code=${userCode}`)
	report.check(
		'it names the signed-in account, with "not you?" signing out back to this code',
		text.includes(`Signed in as <code>${EMAIL}</code>`) &&
			text.includes(`href="${WEB_PATHS.logout}?next=${back}"`) &&
			Boolean(proof),
		proof ? 'a proof' : 'no proof',
	)
	const gap = pagePolicyGap(page, text)
	report.check(
		"the device page is under the pages' policy: its Approve is never framed",
		!gap,
		gap ?? '',
	)
	return proof
}

// An approval that did not come from the page pairs nothing.
async function checkUnconfirmed({ report, browser }, userCode) {
	const bare = await browser.post(WEB_PATHS.device, {
		userCode,
		approve: true,
	})
	const forged = await approveDevice(browser, {
		userCode,
		proof: 'f'.repeat(FORGED_PROOF_LENGTH),
	})
	report.check(
		"an approval without the page's proof, or with a forged one, is 403 DEVICE_UNCONFIRMED",
		[bare, forged].every(
			answer =>
				answer.status === HTTP_FORBIDDEN &&
				answer.body.code === 'DEVICE_UNCONFIRMED',
		),
		`${bare.status} ${forged.status}`,
	)
}

async function checkPaired(context, approval) {
	const { report, browser, web, home } = context
	const record = readRecord(home)
	const isPaired =
		record.web === web.origin && HUB_ID.test(record.hubId ?? '')
	report.check(
		'bridge.json names the web and a 16-hex hub id',
		isPaired,
		JSON.stringify({ web: record.web, hubId: record.hubId }),
	)
	const spent = await approveDevice(browser, approval)
	report.check(
		'the code pairs once: a second approval is 410 DEVICE_CLOSED',
		spent.status === HTTP_GONE && spent.body.code === 'DEVICE_CLOSED',
		`${spent.status}`,
	)
	if (!isPaired) return null
	await checkTokenAtRest(context, { record, userCode: approval.userCode })
	return record.hubId
}

// The token the CLI wrote is nowhere in the web's state, not even in a page a cleared row left:
// the web drew it in the answer that handed it over and kept only its sha256.
async function checkTokenAtRest({ report, web }, { record, userCode }) {
	const code = userCode.replace('-', '')
	const [spent] = await web.query(
		`SELECT taken_at AS takenAt FROM device_codes WHERE user_code = '${code}'`,
	)
	const [hub] = await web.query(
		`SELECT token_digest AS digest FROM hubs WHERE id = '${record.hubId}'`,
	)
	const digest = createHash('sha256').update(record.token).digest('hex')
	report.check(
		"the code is spent and the hub's row holds the token's sha256",
		Boolean(spent?.takenAt) && hub?.digest === digest,
		JSON.stringify({ spent, hub }),
	)
	// The account's address is in D1: the reader sees the rows it reads for.
	const isRead = web.stateHolds(EMAIL)
	report.check(
		"the token's bytes are nowhere in the web's local state (D1, its WAL, the objects)",
		isRead && !web.stateHolds(record.token),
		isRead ? '' : 'the state read holds no address either',
	)
}

// What bridge.json holds, or nothing when there is none.
function readRecord(home) {
	if (!existsSync(bridgeFile(home))) return {}
	return JSON.parse(readFileSync(bridgeFile(home), 'utf8'))
}
