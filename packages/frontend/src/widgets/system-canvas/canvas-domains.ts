import { isCriticalDone, criticalSpans } from '@entities/review/guide/critical'
import { orderedDomains } from '@entities/review/guide/domains'
import {
	domainProgress,
	isDomainStale,
} from '@entities/review/guide/resolution'

import type { ReviewState } from '@entities/review/model'
import type { CanvasDomain } from './model'

export function canvasDomains(state: ReviewState): CanvasDomain[] {
	return orderedDomains(state.guide).map((domain, index) => {
		const progress = domainProgress(domain, state.changes)
		return {
			id: domain.id,
			number: index + 1,
			title: domain.title,
			risk: domain.risk,
			isStale: isDomainStale(state, domain.id),
			toRead: criticalSpans(domain, state.changes).filter(
				span => !isCriticalDone(span),
			).length,
			decided: progress.decided,
			total: progress.total,
		}
	})
}
