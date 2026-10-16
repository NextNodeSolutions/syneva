import { API_PATHS } from '@syneva/contracts/routes'

import { printJson, warn } from '../../outbound/console.js'

import { loadGuideArg } from './args.js'
import { writeAuthoring } from './authoring.js'
import { deskEndpoint, hubSend } from './hub-client.js'
import { failureText } from './hub-wire.js'
import { noDeskHint, targetDesk } from './target-desk.js'

import type { AuthoredGuide } from '@syneva/contracts/guide'
import type { CliArgs } from './args.js'

const HTTP_OK = 200

export async function runReload(args: CliArgs): Promise<void> {
	const guide = loadGuideArg(args.guide)
	if (guide === null) {
		process.exitCode = 1
		return
	}
	const live = await targetDesk(args)
	if (!live) {
		warn(`${noDeskHint(args)} (nothing to reload).`)
		process.exitCode = 1
		return
	}
	const response = await hubSend(
		live.hub,
		'POST',
		deskEndpoint(live.hub.url, live.desk.id, API_PATHS.reload),
		reloadBody(guide),
	)
	if (response.status !== HTTP_OK) {
		// A refused guide names what to fix; only a hub that did not answer gets the generic line.
		warn(
			failureText(
				response.body,
				'Reload failed - is the desk still open on the hub?',
			),
		)
		process.exitCode = 1
		return
	}
	const authoring = await writeAuthoring(live.hub, live.desk.id)
	printJson({
		ok: true,
		live: true,
		session: live.desk.session,
		...readReloadResult(response.body),
		...authoring,
	})
}

// A body that is always an object so an absent guide posts {} (re-diff only) rather than an empty body the hub would have to special-case.
function reloadBody(guide: AuthoredGuide | undefined): {
	guide?: AuthoredGuide
} {
	if (!guide) return {}
	return { guide }
}

function readReloadResult(body: unknown): {
	baseDiffHash?: string
	empty?: boolean
} {
	const outcome: { baseDiffHash?: string; empty?: boolean } = {}
	if (typeof body !== 'object' || body === null) return outcome
	if ('baseDiffHash' in body && typeof body.baseDiffHash === 'string')
		outcome.baseDiffHash = body.baseDiffHash
	if ('empty' in body && typeof body.empty === 'boolean')
		outcome.empty = body.empty
	return outcome
}
