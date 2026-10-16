// What the agent explaining a guided desk works from (GET /authoring): the guide file to fill - the overview and the domains still waiting for words, members left out so each keeps the blocks it owns, stamped with the current source so it posts back as is - and each pending domain's code in a packet. A domain the file leaves out stays as it is when the file is posted, so the file is the agent's to-do list and nothing else.
import {
	AUTHORING_RULES_SPEC,
	DOMAIN_FIELDS_SPEC,
} from '@syneva/contracts/spec-guide'

import { prunedLinks } from '../domain/guide-compose-context.js'
import { resolveOwnership } from '../domain/guide-ownership.js'
import { domainPacket } from '../domain/guide-packets.js'
import { isMechanicalDomain, sourceOf } from '../domain/guide-redraft.js'
import { buildInventory } from '../domain/inventory.js'

import type {
	DomainPacket,
	GuideAuthoring,
	PendingDomain,
} from '@syneva/contracts/authoring'
import type { Ownership } from '../domain/guide-ownership.js'
import type {
	AuthoredDomain,
	GuideDomain,
	GuideResolution,
} from '../domain/guide-shapes.js'
import type { ReviewState } from '../domain/review.js'

const DRAFT_NOTE =
	"Drafted by Syneva from the code's structure: its title, summary, consequence and risk are mechanical. Read the code below and write what it does, why, and what breaks if it is wrong."

// The contract's own words on writing a domain close every packet, so whoever explains one domain needs nothing else.
const WRITING_GUIDE = [
	'## How to write it',
	'',
	"The domain is one object of the guide's `domains`, with these fields (leave `members` out unless you regroup):",
	DOMAIN_FIELDS_SPEC,
	'',
	AUTHORING_RULES_SPEC,
	'',
].join('\n')

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
	ownership: Ownership,
	domain: GuideDomain,
	pending: PendingDomain,
): DomainPacket | null {
	const attached = state.guideResolution?.domains[domain.id]
	if (!attached) return null
	// The resolution keeps the attach-time blocks so a reload can tell what changed; the packet shows the code the domain's members hold now, or an edit that moved a block would leave it out.
	const owned = {
		...attached,
		...(ownership.domains.get(domain.id) ?? { units: [], files: [] }),
	}
	const note =
		pending.reason === 'draft'
			? DRAFT_NOTE
			: staleNote(owned.stale?.reasons ?? [])
	// The rules follow the bounded part, so a reader that stops before the appendix still has them.
	const packet = domainPacket(domain, owned, state, note)
	return {
		id: domain.id,
		markdown: [
			packet.body,
			WRITING_GUIDE,
			...(packet.appendix ? [packet.appendix] : []),
		].join('\n'),
	}
}

export function guideAuthoring(
	state: ReviewState,
	pathFilter: string | undefined,
): GuideAuthoring | null {
	const { guide, guideResolution } = state
	if (!guide || !guideResolution) return null
	const inventory = buildInventory(state, pathFilter)
	const ownership = resolveOwnership(guide, inventory)
	// A domain whose code was reverted (or moved out of its spans) owns nothing now: posting it is refused, and leaving it out drops it, so it is no task. Links to it go too, or naming it would refuse the post.
	const live = new Set(
		[...ownership.domains]
			.filter(([, owned]) => owned.units.length || owned.files.length)
			.map(([id]) => id),
	)
	const pendingDomains = guide.domains.flatMap(domain => {
		const pending = live.has(domain.id)
			? pendingOf(domain, guideResolution)
			: null
		return pending ? [{ domain, pending }] : []
	})
	const { baseDiffHash: _stamp, ...unstamped } = guide
	return {
		guide: {
			...unstamped,
			source: sourceOf(inventory),
			domains: pendingDomains.map(({ domain }) =>
				withoutMembers(prunedLinks(domain, live)),
			),
		},
		overviewDrafted: guideResolution.overviewDrafted ?? false,
		pending: pendingDomains.map(entry => entry.pending),
		packets: pendingDomains.flatMap(({ domain, pending }) => {
			const packet = packetOf(state, ownership, domain, pending)
			return packet ? [packet] : []
		}),
	}
}
