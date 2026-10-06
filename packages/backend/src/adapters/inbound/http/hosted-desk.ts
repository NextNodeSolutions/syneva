import { createActivity } from '../../../application/activity.js'
import { deskIdentity, deskSummary } from '../../../application/desk-summary.js'
import { createEventStream } from '../../../application/events.js'
import { journalSubject } from '../../../application/journal.js'

import { createDeskContext } from './context.js'
import { createDeskLiveness } from './liveness.js'

import type { DeskSummary } from '@syneva/contracts/hub'
import type { HubJournal } from '../../../application/journal.js'
import type {
	EditorPort,
	GitPort,
	ReviewStorePort,
	SettingsPort,
} from '../../../application/ports.js'
import type { HubDeskRecord } from '../../../domain/hub-registry.js'
import type { ReviewState } from '../../../domain/review.js'
import type { DeskContext } from './context.js'
import type { DeskLiveness } from './liveness.js'

// One hosted desk: its id, the context its routes run against, and the rebuild parameters the
// registry persists so a restarted hub reopens it on the same id.
export type HubDesk = {
	readonly id: string
	readonly ctx: DeskContext
	readonly liveness: DeskLiveness
	readonly record: HubDeskRecord
	closing: boolean
}

// What every hosted desk is wired from: the hub's capability ports, the agent-activity TTL and
// the journal its events go to.
export type HostedDeskIo = {
	git: GitPort
	store: ReviewStorePort
	settings: SettingsPort
	editor: EditorPort
	journal: HubJournal
	statusTtlMs: number
}

// A desk over the hub's collaborators. `close` is the hub's: it alone drops a desk from its
// registry. The desk's journal binding names the desk as the hub lists it at the moment of each
// event, so a route records what happened and never who it happened to.
export function hostDesk(
	io: HostedDeskIo,
	review: ReviewState,
	record: HubDeskRecord,
	close: () => void,
): HubDesk {
	const liveness = createDeskLiveness(record.openedAt)
	const desk: HubDesk = {
		id: record.id,
		liveness,
		record,
		closing: false,
		ctx: createDeskContext(review, {
			events: createEventStream(),
			activity: createActivity(io.statusTtlMs),
			liveness,
			git: io.git,
			store: io.store,
			settings: io.settings,
			editor: io.editor,
			close,
			recordEvent: (draft, verdicts) => {
				io.journal.record(
					{
						...journalSubject(
							deskIdentity(desk.id, desk.ctx.state),
						),
						...draft,
					},
					verdicts,
				)
			},
		}),
	}
	return desk
}

export function summarize(desk: HubDesk): DeskSummary {
	return deskSummary(desk.id, desk.ctx.state, desk.ctx.status(), {
		openedAt: desk.liveness.openedAt,
		lastActivityAt: desk.liveness.lastActivityAt(),
	})
}
