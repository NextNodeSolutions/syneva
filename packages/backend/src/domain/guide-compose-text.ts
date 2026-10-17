import { isRecord } from './guide-parse.js'

import type { AuthoredDomain, GuideDomain } from './guide-shapes.js'

// The text an agent writes; equal text means the agent left the domain as it was.
// Key order and absent-versus-undefined fields are not text: a guide read back from a file compares equal to the one written.
function canonical(entry: unknown): unknown {
	if (Array.isArray(entry)) return entry.map(canonical)
	if (!isRecord(entry)) return entry
	return Object.fromEntries(
		Object.entries(entry)
			.filter(([, field]) => typeof field !== 'undefined')
			.toSorted(([a], [b]) => a.localeCompare(b))
			.map(([key, field]) => [key, canonical(field)]),
	)
}

export function textOf(domain: AuthoredDomain | GuideDomain): string {
	const { title, risk, consequence, summary, verify, prerequisites } = domain
	const { references, related, evidence, unknowns, critical, blocks } = domain
	return JSON.stringify(
		canonical({
			title,
			risk,
			consequence,
			summary,
			verify,
			prerequisites,
			references,
			related,
			evidence,
			unknowns,
			critical,
			blocks,
		}),
	)
}
