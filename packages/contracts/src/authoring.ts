// What `syneva open` and `syneva reload` hand the agent that explains a guided desk: the desk's current guide as a file to fill (members left out - each domain keeps its blocks), the domains that still need words, and one Markdown packet per such domain holding its code. Served as GET /api/desks/<id>/authoring; the CLI writes it to local files.
import type { AuthoredGuide } from './guide.js'

// Why a domain needs the agent: Syneva drafted it from the code's structure, or the code it explains changed since.
export type PendingReason = 'draft' | 'stale'

export type PendingDomain = {
	id: string
	reason: PendingReason
	// The staleness reasons, for a stale domain.
	detail?: string | undefined
}

export type DomainPacket = { id: string; markdown: string }

export type GuideAuthoring = {
	guide: AuthoredGuide
	// The overview is Syneva's draft until an agent posts one.
	overviewDrafted: boolean
	pending: PendingDomain[]
	packets: DomainPacket[]
}
