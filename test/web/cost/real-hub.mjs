// The real hub, for what only it can show: the CLI's own hub (`--cli`, on `--port`, under the run's
// scratch HOME), paired with the web as a person pairs one (`syneva login --web`, its code approved
// on the device page with the account's cookie), with a desk on a scratch repo opened through the
// relay; unpaired (`syneva logout`, so a staging account keeps no cost-test hub) and stopped after.
import { existsSync, readFileSync } from 'node:fs'

import { WEB_HUB_HEADER } from '../../../packages/contracts/dist/bridge.js'
import { HUB_PATHS } from '../../../packages/contracts/dist/routes.js'
import { WEB_PATHS } from '../../../packages/contracts/dist/web.js'
import { runCli, spawnCli, startHub } from '../../bridge/hub-process.mjs'
import { bridgeFile } from '../../bridge/pairing-checks.mjs'
import { scratchRepo } from '../../stream/hub-driver.mjs'

import { delay } from './fakes/timing.mjs'

const CODE_LINE = /confirm the code ([A-Z0-9]{4}-[A-Z0-9]{4})/
const CODE_WAIT_MS = 15_000
// The rate limiter's 429 on the device code (ten a minute per address): wait it out, as
// accounts.mjs does for the fake hubs.
const RATE_LIMITED = /answered 429/
const RATE_RETRY_MS = 6000
const RATE_RETRIES = 20
const HTTP_OK = 200

export async function startRealHub(ctx, account) {
	const { options, web } = ctx
	const cli = { cli: options.cli, home: process.env.HOME }
	const hub = await startHub({ ...cli, port: Number(options.port) })
	try {
		await pair(cli, account, web.origin)
		const { hubId } = JSON.parse(readFileSync(bridgeFile(cli.home), 'utf8'))
		return {
			hubId,
			openDesk: () => openDesk(ctx, account, hubId),
			async stop() {
				await runCli(cli, ['logout'])
				await hub.stop()
			},
		}
	} catch (error) {
		await hub.stop()
		throw error
	}
}

async function pair(cli, account, origin, tries = RATE_RETRIES) {
	const login = spawnCli(cli, ['login', '--web', origin, '--no-open'])
	const shown = await Promise.race([
		login.line(CODE_LINE, CODE_WAIT_MS),
		login.exited.then(() => null),
	])
	if (!shown) {
		const { code, stderr } = await login.exited
		if (RATE_LIMITED.test(stderr) && tries > 0) {
			await delay(RATE_RETRY_MS)
			return pair(cli, account, origin, tries - 1)
		}
		throw new Error(`syneva login exited ${code}: ${stderr}`)
	}
	const [, userCode] = shown
	const approved = await account.browser.post(WEB_PATHS.device, {
		userCode,
		approve: true,
	})
	if (approved.status !== HTTP_OK)
		throw new Error(`approval: ${approved.status}`)
	const { code, stderr } = await login.exited
	if (code !== 0 || !existsSync(bridgeFile(cli.home)))
		throw new Error(`syneva login exited ${code}: ${stderr}`)
	return undefined
}

// A desk on a scratch repo of the run, opened through the relay: its root and its web id.
async function openDesk(ctx, account, hubId) {
	const repo = await scratchRepo(ctx.scratch)
	const opened = await account.browser.post(
		HUB_PATHS.desks,
		{ root: repo.root, session: 'cost-test', noGuide: true },
		{ [WEB_HUB_HEADER]: hubId },
	)
	const webId = opened.body?.desk?.id
	if (opened.status !== HTTP_OK || !webId?.startsWith(hubId))
		throw new Error(`the desk did not open: ${opened.status}`)
	return { root: repo.root, webId }
}
