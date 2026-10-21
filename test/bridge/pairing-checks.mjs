// `syneva login` and `syneva logout` end to end against the fake bridge, and a hub that holds no
// pairing: it runs as before, never opens a socket, and tells its tabs it is not paired.
import { constants, promises as fs } from 'node:fs'
import net from 'node:net'
import path from 'node:path'

import { HUB_PATHS } from '../../packages/contracts/dist/routes.js'
import { readSnapshot, socketUrl, waitFor } from '../stream/stream-client.mjs'

import { HTTP_SWITCHING } from './http-wire.mjs'
import { runCli, spawnCli } from './hub-process.mjs'

const CODE_WAIT_MS = 10_000
const OWNER_ONLY = 0o600
const OCTAL = 8
const MODE_BITS = 0o777

export const bridgeFile = home =>
	path.join(home, '.syneva', 'hub', 'bridge.json')

export const isPairing =
	(test = () => true) =>
	frame =>
		frame?.t === 'pairing' && test(frame.pairing)

// The hub's own stream, where its tabs read the pairing.
export function readLocal(hub) {
	return readSnapshot(socketUrl(hub.url, HUB_PATHS.hubSocket), {})
}

export async function checkUnpaired({ report, fake }, hub, quietMs) {
	const upgrades = fake.sockets.upgrades.length
	const health = await hub.health()
	report.check(
		'a hub without bridge.json answers its health',
		health?.ok === true,
	)
	await report.step('its stream says it is not paired', async () => {
		const reader = await readLocal(hub)
		await waitFor(
			reader,
			isPairing(pairing => !pairing.paired),
			{
				what: 'pairing { paired: false }',
			},
		)
		reader.socket.close()
	})
	await new Promise(resolve => setTimeout(resolve, quietMs))
	report.check(
		'it never opens a socket to the bridge',
		fake.sockets.upgrades.length === upgrades,
	)
}

// The person refuses the code, or the web does not answer: exit 1, the cause named.
export async function checkLoginRefusals(context) {
	const { report, fake } = context
	report.section('login refusals')
	const login = spawnCli(context, [
		'login',
		'--web',
		fake.origin,
		'--no-open',
	])
	const [, userCode] =
		(await login.line(/confirm the code (\w+)/, CODE_WAIT_MS)) ?? []
	await approve(fake, { userCode, deny: true })
	const denied = await login.exited
	report.check(
		'a denied code exits 1 naming DEVICE_DENIED',
		denied.code === 1 && /DEVICE_DENIED/.test(denied.stderr),
		denied.stderr,
	)
	const away = await runCli(context, [
		'login',
		'--web',
		await closedPortUrl(),
		'--no-open',
	])
	report.check(
		'an unreachable web exits 1 naming the cause',
		away.code === 1 && /did not answer \(.*ECONNREFUSED/.test(away.stderr),
		away.stderr,
	)
}

// The code printed, approved through the fake's control, the token written owner-only, the
// running hub connected at once. Hands back what bridge.json holds.
export async function checkLogin(context) {
	const { report, fake, home } = context
	report.section('login')
	const login = spawnCli(context, [
		'login',
		'--web',
		fake.origin,
		'--no-open',
	])
	const [, userCode] =
		(await login.line(/confirm the code (\w+)/, CODE_WAIT_MS)) ?? []
	report.check(
		'it prints the code and the URL to confirm it at',
		Boolean(userCode) &&
			login.output.stderr.includes(
				`${fake.origin}/pair?code=${userCode}`,
			),
		login.output.stderr,
	)
	const { hubId } = await approve(fake, { userCode })
	const { code, stderr } = await login.exited
	report.check(
		'it exits 0 once the hub is connected',
		code === 0 && /: the hub is connected\.$/m.test(stderr),
		stderr,
	)
	const file = bridgeFile(home)
	const { mode } = await fs.stat(file)
	report.check(
		'bridge.json is owner-only (0600)',
		(mode & MODE_BITS) === OWNER_ONLY,
		mode.toString(OCTAL),
	)
	const record = JSON.parse(await fs.readFile(file, 'utf8'))
	report.check(
		'bridge.json holds the web, the hub id, its token, name and pairing time',
		record.web === fake.origin &&
			record.hubId === hubId &&
			Boolean(record.token) &&
			Boolean(record.name) &&
			!Number.isNaN(Date.parse(record.pairedAt)),
	)
	const opened = fake.sockets.upgrades.at(-1)
	report.check(
		'the hub opened its socket with the token (101, its web id)',
		opened?.status === HTTP_SWITCHING && opened.hubId === hubId,
	)
	return record
}

// The token revoked on the web, the file gone, the hub's socket dropped and its tabs told.
export async function checkLogout(context, { hub, record, quietMs }) {
	const { report, fake, home } = context
	report.section('logout')
	const reader = await readLocal(hub)
	const from = reader.frames.length
	const { code, stderr } = await runCli(context, ['logout'])
	report.check(
		'it exits 0: revoked, the probe dropped',
		code === 0 &&
			/is no longer paired with .*: the token is revoked; the running hub dropped its probe\./.test(
				stderr,
			),
		stderr,
	)
	report.check(
		'the web saw DELETE /bridge/v1/hub with the token',
		fake.pairing.revocations.some(each => each.hubId === record.hubId),
	)
	report.check(
		'bridge.json is gone',
		!(await fs.access(bridgeFile(home), constants.F_OK).then(
			() => true,
			() => false,
		)),
	)
	await report.step("the hub's tabs read pairing { paired: false }", () =>
		waitFor(
			reader,
			isPairing(pairing => !pairing.paired),
			{ from },
		),
	)
	reader.socket.close()
	const upgrades = fake.sockets.upgrades.length
	await new Promise(resolve => setTimeout(resolve, quietMs))
	report.check(
		'the probe stopped: no socket since',
		fake.sockets.upgrades.length === upgrades && !fake.sockets.hubs.size,
	)
}

// An origin nothing listens on: the web unreachable (a port the system just handed out, closed).
async function closedPortUrl() {
	const server = net.createServer()
	await new Promise(resolve => {
		server.listen(0, '127.0.0.1', resolve)
	})
	const { port } = server.address()
	await new Promise(resolve => {
		server.close(resolve)
	})
	return `http://127.0.0.1:${port}`
}

async function approve(fake, body) {
	const response = await fetch(new URL('/__approve', fake.origin), {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	})
	return response.json()
}
