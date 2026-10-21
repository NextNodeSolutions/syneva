// `syneva login` and `syneva logout` (RFC 0001, 4.2): pair this machine's hub with the web through
// a device code, or undo the pairing. Each ends on one line a person reads, on stderr like every
// human-facing line of the CLI; a failure names its cause and exits 1.
import os from 'node:os'
import { setTimeout as delay } from 'node:timers/promises'

import { isWebHubId } from '@syneva/contracts/bridge'

import {
	requestDeviceCode,
	requestDeviceToken,
	revokeHub,
	WebCallError,
} from '../../outbound/bridge/web-client.js'
import { warn } from '../../outbound/console.js'
import {
	readPairingRecord,
	removePairingRecord,
	writePairingRecord,
} from '../../outbound/filesystem/bridge.js'
import { currentVersion } from '../../outbound/package-registry/update.js'
import { openBrowser } from '../http/listen.js'

import { flagText } from './args.js'
import { tellHub } from './pairing-wire.js'

import type { DeviceCodeAnswer } from '@syneva/contracts/pairing'
import type { TokenStep } from '../../outbound/bridge/web-client.js'
import type { PairingRecord } from '../../outbound/filesystem/bridge.js'
import type { CliArgs } from './args.js'
import type { HubTold } from './pairing-wire.js'

const DEFAULT_WEB = 'https://app.syneva.dev'
// A device code lives at most 10 minutes (RFC 4.2), whatever the web says.
const APPROVAL_WINDOW_MS = 600_000
const MS_PER_SECOND = 1000

export async function runLogin(args: CliArgs): Promise<void> {
	const web = webOf(args)
	if (!web) {
		fail(
			`--web (or SYNEVA_WEB_URL) must name an HTTPS origin, like ${DEFAULT_WEB}. HTTP is allowed only on loopback.`,
		)
		return
	}
	try {
		const record = await pair(web, args)
		if (!record) return
		await writePairingRecord(record)
		warn(loginLine(record, await tellHub(args)))
	} catch (error) {
		if (!(error instanceof WebCallError)) throw error
		fail(`Not paired: ${error.message}`)
	}
}

// The web is asked to revoke the token first; one that does not answer still lets the pairing go
// here, and the line says the token may still be valid there.
export async function runLogout(args: CliArgs): Promise<void> {
	const record = await readPairingRecord()
	const revoked = record ? await revoke(record) : null
	const hadFile = await removePairingRecord()
	const told = await tellHub(args)
	if (!record) {
		warn(
			`${hadFile ? 'Removed an unreadable bridge.json' : 'This hub is not paired'}${hubWords(told)}.`,
		)
		return
	}
	const where = `${record.name} (hub ${record.hubId}) is no longer paired with ${record.web}`
	if (revoked)
		warn(
			`${where}: the web did not answer (${revoked}), so the token may still open its socket until you revoke the hub on the web's Hub page${hubWords(told)}.`,
		)
	else warn(`${where}: the token is revoked${hubWords(told)}.`)
}

// The web's origin: --web, else SYNEVA_WEB_URL, else syneva.dev's; null when it is no http(s)
// URL. Staging and the conformance check's fake bridge name theirs.
function webOf(args: CliArgs): string | null {
	const named =
		flagText(args, 'web') ?? process.env.SYNEVA_WEB_URL ?? DEFAULT_WEB
	if (!URL.canParse(named)) return null
	const url = new URL(named)
	const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(
		url.hostname,
	)
	if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLoopback))
		return null
	return url.origin
}

async function pair(web: string, args: CliArgs): Promise<PairingRecord | null> {
	const name = os.hostname()
	const code = await requestDeviceCode(web, {
		name,
		version: currentVersion(),
	})
	warn(
		`To pair this hub (${name}) with ${web}, open ${code.verificationUrl} and confirm the code ${code.userCode}.`,
	)
	if (args.open !== false) await openBrowser(code.verificationUrl)
	const deadline =
		Date.now() +
		Math.min(code.expiresIn * MS_PER_SECOND, APPROVAL_WINDOW_MS)
	const step = await approval(web, code, deadline)
	if ('refused' in step) return refused(step.refused)
	if ('pending' in step)
		return refused(
			'the code was not confirmed in time; run `syneva login` again',
		)
	if (!isWebHubId(step.hubId))
		return refused(`${web} answered a hub id that is not 16 hex characters`)
	const pairedAt = new Date().toISOString()
	return { web, hubId: step.hubId, token: step.token, name, pairedAt }
}

// Re-asks on a timer: the one polling loop of the pairing. It stands in for the push path a
// device-code flow has none of: until the CLI holds a token, the web has no channel back to it (no
// socket, no port it listens on), and a request the web parked for the person would hold a Worker
// open for up to 10 minutes. So the CLI asks again every `interval` seconds the web set, for at
// most 10 minutes (RFC 4.2), and stops at the first answer that is not pending.
async function approval(
	web: string,
	code: DeviceCodeAnswer,
	deadline: number,
): Promise<TokenStep> {
	const wait = code.interval * MS_PER_SECOND
	if (Date.now() + wait > deadline) return { pending: true }
	await delay(wait)
	const step = await requestDeviceToken(web, code.deviceCode)
	if (!('pending' in step)) return step
	return approval(web, code, deadline)
}

async function revoke(record: PairingRecord): Promise<string | null> {
	try {
		await revokeHub(record.web, record.token)
		return null
	} catch (error) {
		if (!(error instanceof WebCallError)) throw error
		return error.message
	}
}

function loginLine(record: PairingRecord, told: HubTold): string {
	const paired = `Paired ${record.name} with ${record.web} (hub ${record.hubId})`
	if (told.kind === 'no-hub')
		return `${paired}. No hub runs here: the next \`syneva start\` connects it.`
	if (told.kind === 'refused')
		return `${paired}, but the running hub did not take it (${told.reason}): restart it (\`syneva hub stop\`, then \`syneva start\`).`
	const { link, lastClose } = told.pairing
	if (link === 'connected') return `${paired}: the hub is connected.`
	if (link === 'stopped') {
		process.exitCode = 1
		return `${paired}, but ${record.web} refused the hub's token (${lastClose ?? 'no reason given'}): run \`syneva login\` again.`
	}
	return `${paired}; the hub could not connect yet (${lastClose ?? 'no answer'}) and keeps trying.`
}

function hubWords(told: HubTold): string {
	if (told.kind === 'no-hub') return ''
	if (told.kind === 'refused')
		return `; the running hub did not hear it (${told.reason}), restart it to drop its probe`
	return '; the running hub dropped its probe'
}

function refused(reason: string): null {
	fail(`Not paired: ${reason}.`)
	return null
}

function fail(line: string): void {
	warn(line)
	process.exitCode = 1
}
