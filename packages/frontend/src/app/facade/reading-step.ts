import { currentFileOrNull } from '@entities/review/changes'
import { domainsOwningPath } from '@entities/review/guide/domains'
import { domainEntry } from '@entities/review/guide/navigation'
import { domainById } from '@entities/review/guide/resolution'

import { S } from '../store'

// The domain's first file, when its page is read with the code closed and the file on hand is another domain's: the review's first file on a fresh load, or the one left before stepping domains. Null when the file on hand is the domain's own, which the steps then count from as usual.
function readingEntry(): number | null {
	const { state } = S
	if (!state || !S.domainId || S.codeOpen || S.overviewOpen) return null
	const shown = currentFileOrNull(state.files, S.preview, S.fileIndex)
	const owners = shown ? domainsOwningPath(state.guide, shown.path) : []
	if (owners.some(domain => domain.id === S.domainId)) return null
	const domain = domainById(state, S.domainId)
	const entry = domain && domainEntry(domain, state)
	if (!entry) return null
	const path = 'span' in entry ? entry.span.path : entry.path
	const index = state.files.findIndex(file => file.path === path)
	if (index < 0) return null
	return index
}

// The file a step opens from a domain's page, in the given order: the page stands just before the domain's first file, so next opens that file and previous the one before it, never a file the reading does not explain. Null when the steps count from the file on hand.
export function readingStep(
	dir: 1 | -1,
	order: readonly number[],
): number | null {
	const entry = readingEntry()
	if (entry === null) return null
	const position = order.indexOf(entry)
	if (position < 0 || dir === 1) return entry
	return order[(position - 1 + order.length) % order.length] ?? entry
}
