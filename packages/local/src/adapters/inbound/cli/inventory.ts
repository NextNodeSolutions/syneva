import { HUB_PATHS } from '@syneva/contracts/routes'

import { printJson, warn } from '../../outbound/console.js'

import { connectHub, hubEndpoint, hubSend } from './hub-client.js'
import { failureText } from './hub-wire.js'
import { deskRequest } from './open.js'

import type { ReviewMode } from '@syneva/contracts/review'
import type { CliArgs } from './args.js'

const HTTP_OK = 200

// `syneva inventory [file <path> | pr <ref>] [--diff staged] [--path <p>] [--session <id>]`: the review source a guide is authored against, printed as JSON (ReviewInventory). No desk opens, nothing is persisted; a hub is started when none runs, as an open would.
export async function runInventory(
	mode: ReviewMode,
	target: string | undefined,
	args: CliArgs,
): Promise<void> {
	if (mode === 'file' && !target) {
		warn('Usage: syneva inventory file <path>')
		process.exitCode = 1
		return
	}
	const hub = await connectHub(args, { autostart: true })
	if (!hub) {
		warn(
			'No Syneva hub is running and none could be started. Run `syneva start` and retry.',
		)
		process.exitCode = 1
		return
	}
	const response = await hubSend(
		hub,
		'POST',
		hubEndpoint(hub.url, HUB_PATHS.inventory),
		deskRequest(mode, target, args),
	)
	if (response.status !== HTTP_OK) {
		warn(
			failureText(
				response.body,
				'The hub could not build the inventory.',
			),
		)
		process.exitCode = 1
		return
	}
	printJson(response.body)
}
