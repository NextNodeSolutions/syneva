// The guide: an externally authored, risk-ranked explanation of the behaviors a changeset changes; Syneva validates and renders it, never writes it.
import type { CodeSpan, ReviewMode } from './review.js'

// The schema id every guide names; a guide without it is refused, never adapted.
export const GUIDE_FORMAT = 'syneva-guide/2'

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

// What a domain owns. A `change` member names changed code by any line of the changed block on its side; a `file` member owns a file operation that has no text block (a pure rename, an untracked addition, a hunk-less deletion).
export type GuideMember =
	| ({ kind: 'change' } & CodeSpan)
	| { kind: 'file'; path: string }

// A code target an explanation points at. `changed` points into changed code (this domain's or another's); `context` points at supporting unchanged code on the reviewed revision - read-only, never a change to approve.
export type GuideReference = CodeSpan & {
	id: string
	role: 'changed' | 'context'
	label?: string | undefined
}

export type GuideCrossReference = {
	domainId: string
	note?: string | undefined
}

// A risk claim and the references that back it; a claim without refs is the agent's word alone and reads as such.
export type GuideEvidence = { text: string; refs?: string[] | undefined }

type BlockBase = {
	id: string
	title?: string | undefined
	// Reference ids (GuideDomain.references) the block as a whole rests on.
	refs?: string[] | undefined
	// Longer reasoning, assumptions or failure cases (Markdown), collapsed until the reviewer expands it.
	detail?: string | undefined
}

export type ProseBlock = BlockBase & { kind: 'prose'; markdown: string }

export type BeforeAfterSide = {
	label?: string | undefined
	markdown: string
	ref?: string | undefined
}

export type BeforeAfterBlock = BlockBase & {
	kind: 'before-after'
	before: BeforeAfterSide
	after: BeforeAfterSide
}

export type StateNode = {
	id: string
	label: string
	ref?: string | undefined
	isInitial?: boolean | undefined
	isFinal?: boolean | undefined
}

export type StateTransition = {
	from: string
	to: string
	label?: string | undefined
	ref?: string | undefined
}

export type StateBlock = BlockBase & {
	kind: 'state'
	states: StateNode[]
	transitions: StateTransition[]
}

export type SequenceParticipant = { id: string; label: string }

export type SequenceStep = {
	from: string
	to: string
	label: string
	ref?: string | undefined
}

export type SequenceBlock = BlockBase & {
	kind: 'sequence'
	participants: SequenceParticipant[]
	steps: SequenceStep[]
}

export type FlowNode = {
	id: string
	label: string
	ref?: string | undefined
	note?: string | undefined
}

export type FlowEdge = { from: string; to: string; label?: string | undefined }

// A dependency or data-flow relationship.
export type FlowBlock = BlockBase & {
	kind: 'flow'
	nodes: FlowNode[]
	edges: FlowEdge[]
}

export type ExplanationBlock =
	| ProseBlock
	| BeforeAfterBlock
	| StateBlock
	| SequenceBlock
	| FlowBlock

export type GuideDomain = {
	// Stable across guides of the same changeset: feedback and review position key on it, never on the title or the position.
	id: string
	title: string
	risk: RiskLevel
	// The concrete failure if this behavior is wrong - the reason for the risk, not a restatement of it.
	consequence: string
	// The minimum context: what the behavior is for, in a sentence or two.
	summary: string
	// What the reviewer should check with their own eyes.
	verify?: string | undefined
	// Domains to read first; summarized beside this one, never used to move it below them.
	prerequisites?: string[] | undefined
	members: GuideMember[]
	references?: GuideReference[] | undefined
	related?: GuideCrossReference[] | undefined
	evidence?: GuideEvidence[] | undefined
	unknowns?: string[] | undefined
	// Agent-chosen, in the agent's order; empty when the summary says it all.
	blocks: ExplanationBlock[]
	// Tie order among domains of the same risk (ascending); the array position when absent.
	order?: number | undefined
}

// The exact review source the guide was authored against; `fingerprint` is the inventory's and must match the desk's at attach.
export type GuideSource = {
	mode: ReviewMode
	fingerprint: string
	head?: string | null | undefined
	base?: string | undefined
	staged?: boolean | undefined
	path?: string | undefined
}

export type Guide = {
	format: typeof GUIDE_FORMAT
	source: GuideSource
	// The short changeset overview (Markdown): what it does, why, and how the domains fit.
	overview: string
	// Empty on an empty changeset, never otherwise.
	domains: GuideDomain[]
	// Stamped by the desk on attach: the diff the guide describes; a reload advancing past it is what the lifecycle re-resolves against.
	baseDiffHash?: string | undefined
}
