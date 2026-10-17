import { spanOverlaps } from '@syneva/contracts/guide'

import type { ChangeState } from '../model'
import type { GuideDomain, GuideReference } from './model'

// The spans a domain marks to be read line by line, with the reference each one names and the live changes it covers: the hub admitted only `changed` references, and a span whose reference a later guide dropped is left out rather than shown pointing nowhere.
export type CriticalSpan = {
	reference: GuideReference
	why: string
	changes: ChangeState[]
}

export function criticalSpans(
	domain: GuideDomain,
	changes: readonly ChangeState[],
): CriticalSpan[] {
	return (domain.critical ?? []).flatMap(entry => {
		const reference = domain.references?.find(ref => ref.id === entry.ref)
		if (!reference) return []
		return [
			{
				reference,
				why: entry.why,
				changes: changes.filter(
					change =>
						change.path === reference.path &&
						change.side === reference.side &&
						spanOverlaps(reference, change),
				),
			},
		]
	})
}

// Read line by line means every line decided: a span is done once each change it covers carries a verdict.
export function isCriticalDone(span: CriticalSpan): boolean {
	return (
		span.changes.length > 0 &&
		span.changes.every(change => change.status !== 'pending')
	)
}
