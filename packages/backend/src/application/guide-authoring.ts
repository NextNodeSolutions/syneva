// What the agent explaining a guided desk works from (GET /authoring): the guide file to fill - the overview and the domains still waiting for words, members left out so each keeps the blocks it owns, stamped with the current source so it posts back as is - and each pending domain's code in a packet. A domain the file leaves out stays as it is when the file is posted, so the file is the agent's to-do list and nothing else.
import { domainPacket } from '../domain/guide-packets.js'
import { isMechanicalDomain, sourceOf } from '../domain/guide-redraft.js'
import { buildInventory } from '../domain/inventory.js'

import type {
	DomainPacket,
	GuideAuthoring,
	PendingDomain,
} from '@syneva/contracts/authoring'
import type {
	AuthoredDomain,
	GuideDomain,
	GuideResolution,
} from '../domain/guide-shapes.js'
import type { ReviewState } from '../domain/review.js'

const DRAFT_NOTE =
	"Drafted by Syneva from the code's structure: its title, summary, consequence and risk are mechanical. Read the code below and write what it does, why, and what breaks if it is wrong."

function staleNote(reasons: readonly string[]): string {
	return `Explained before, but the code changed since: ${reasons.join('; ')}. Check the explanation against the code below and rewrite what no longer holds: posting the domain, changed or not, marks its explanation current.`
}

function withoutMembers(domain: GuideDomain): AuthoredDomain {
	const { members: _members, ...authored } = domain
	return authored
}

// A drafted domain waits for its first explanation (a lockfile-only one is complete as drafted); an explained one waits again once its code moved under it.
function pendingOf(
	domain: GuideDomain,
	resolution: GuideResolution,
): PendingDomain | null {
	const drafted = new Set(resolution.drafted ?? [])
	if (drafted.has(domain.id)) {
		if (isMechanicalDomain(domain)) return null
		return { id: domain.id, reason: 'draft' }
	}
	const stale = resolution.domains[domain.id]?.stale
	if (!stale) return null
	return { id: domain.id, reason: 'stale', detail: stale.reasons.join('; ') }
}

function packetOf(
	state: ReviewState,
	domain: GuideDomain,
	pending: PendingDomain,
): DomainPacket | null {
	const owned = state.guideResolution?.domains[domain.id]
	if (!owned) return null
	const note =
		pending.reason === 'draft'
			? DRAFT_NOTE
			: staleNote(owned.stale?.reasons ?? [])
	return { id: domain.id, markdown: domainPacket(domain, owned, state, note) }
}

export function guideAuthoring(
	state: ReviewState,
	pathFilter: string | undefined,
): GuideAuthoring | null {
	const { guide, guideResolution } = state
	if (!guide || !guideResolution) return null
	const pendingDomains = guide.domains.flatMap(domain => {
		const pending = pendingOf(domain, guideResolution)
		return pending ? [{ domain, pending }] : []
	})
	const { baseDiffHash: _stamp, ...unstamped } = guide
	return {
		guide: {
			...unstamped,
			source: sourceOf(buildInventory(state, pathFilter)),
			domains: pendingDomains.map(({ domain }) => withoutMembers(domain)),
		},
		overviewDrafted: guideResolution.overviewDrafted ?? false,
		pending: pendingDomains.map(entry => entry.pending),
		packets: pendingDomains.flatMap(({ domain, pending }) => {
			const packet = packetOf(state, domain, pending)
			return packet ? [packet] : []
		}),
	}
}
