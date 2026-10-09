import { sortDomains } from '@syneva/contracts/guide'

import type { Guide, GuideDomain } from './model'

// The domains in reading order: highest risk first, the guide's tie order, then its array order; prerequisites never move a domain down (they are summarized beside it).
export function orderedDomains(guide: Guide | undefined): GuideDomain[] {
	if (!guide) return []
	return sortDomains(guide.domains)
}

// The files a domain's members touch, first mention first: what the walkthrough lists under the domain and what a file's header names.
export function domainPaths(domain: GuideDomain): string[] {
	const seen = new Set<string>()
	const paths: string[] = []
	for (const member of domain.members) {
		if (seen.has(member.path)) continue
		seen.add(member.path)
		paths.push(member.path)
	}
	return paths
}

export type GuideFileEntry = {
	path: string
	domainId: string
	category: string
}

// One entry per (domain, file) in reading order: a file two domains own appears under both, so the walkthrough reaches each domain's part of it.
export function guideFileEntries(guide: Guide | undefined): GuideFileEntry[] {
	return orderedDomains(guide).flatMap(domain =>
		domainPaths(domain).map(path => ({
			path,
			domainId: domain.id,
			category: domain.title,
		})),
	)
}

export function domainsOwningPath(
	guide: Guide | undefined,
	path: string,
): GuideDomain[] {
	return orderedDomains(guide).filter(domain =>
		domain.members.some(member => member.path === path),
	)
}
