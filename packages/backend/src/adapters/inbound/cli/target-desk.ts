import { sanitizeSession } from '../../../domain/identity.js'

import { flagText, resolveRoot } from './args.js'
import { connectHub, findDesk } from './hub-client.js'

import type { DeskSummary } from '@syneva/contracts/hub'
import type { CliArgs } from './args.js'
import type { HubConnection } from './hub-client.js'

// The desk an agent command targets: --session names it, else the lone live desk; null when there is no hub or no such desk.
export async function targetDesk(
	args: CliArgs,
): Promise<{ hub: HubConnection; desk: DeskSummary } | null> {
	const hub = await connectHub(args, { autostart: false })
	if (!hub) return null
	const desk = await findDesk(
		hub,
		await resolveRoot(args),
		flagText(args, 'session'),
	)
	if (!desk) return null
	return { hub, desk }
}

export function noDeskHint(args: CliArgs): string {
	const session = flagText(args, 'session')
	return session
		? `No live desk for session "${sanitizeSession(session)}". Open it with: syneva open --session ${sanitizeSession(session)}`
		: 'No live desk for this repo. Open one with: syneva open'
}
