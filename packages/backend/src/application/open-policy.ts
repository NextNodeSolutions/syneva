import { attachGuide } from './attach-guide.js'
import { buildSourceState } from './open-desk.js'

import type { Guide } from '../domain/guide-shapes.js'
import type { DeskIdentity, DeskIo, DeskQuery } from './open-desk.js'

export type AdmissionCode = 'INVALID_GUIDE' | 'NO_REVIEW'

export type Admission =
	| { ok: true }
	| { ok: false; code: AdmissionCode; reason: string }

// The open policy: a repo or pr desk is guided by default and never refused for lacking a guide - without one it opens, reviews in file order and waits for the agent's guide (`syneva reload --guide`); with --no-guide it is a plain review on purpose.
// A posted guide is judged on the source as the desk will review it, before a desk is replaced, a review persisted or a branch checked out, so a guide that does not fit leaves everything as it was. A restore is not an open and never passes here.
export async function admitOpen(
	identity: DeskIdentity,
	query: DeskQuery,
	guide: Guide | undefined,
	io: DeskIo,
): Promise<Admission> {
	if (!guide) return { ok: true }
	const source = await buildSourceState(identity, query, io.git)
	if (!source.ok)
		return { ok: false, code: 'NO_REVIEW', reason: source.reason }
	const attached = await attachGuide(
		source.state,
		query.pathFilter,
		guide,
		io.git,
	)
	if (attached.ok) return { ok: true }
	return { ok: false, code: 'INVALID_GUIDE', reason: attached.reason }
}

// What the desk expects of its guide, from the open's own words: a repo or pr desk expects one unless opened with --no-guide; a file desk never does.
export function guideExpectation(
	query: Pick<DeskQuery, 'mode' | 'noGuide'>,
): boolean {
	return query.mode !== 'file' && !query.noGuide
}
