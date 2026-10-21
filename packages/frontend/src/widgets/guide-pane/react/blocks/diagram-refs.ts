import type { ReferenceStatus } from '@entities/review/guide/model'

// How a diagram reads the code references its nodes and edge labels carry: their status, the
// jump to their code, and the DOM hook the desk's keyboard paths find them by. On a desk the
// guide's domain answers (explanation-block.tsx); elsewhere (a plan's figure) nothing does, and a
// reference reads as plain text.
export type DiagramRefs = {
	statusOf: (refId: string) => ReferenceStatus | null
	follow: (refId: string) => void
	hookOf: (refId: string) => string
}

export const NO_REFS: DiagramRefs = {
	statusOf: () => null,
	follow: () => {},
	hookOf: refId => refId,
}

// What a node or an edge label makes of its reference: no status when it has none (or nothing
// answers for it, as on a plan), so a null status is the one check for "not a control"; and
// linked only when the reference reaches its code.
export type Link =
	| { status: null; isLinked: false }
	| { status: ReferenceStatus; isLinked: boolean; refId: string }

export function linkOf(refs: DiagramRefs, refId: string | undefined): Link {
	const status = refId ? refs.statusOf(refId) : null
	if (!refId || status === null) return { status: null, isLinked: false }
	return { status, isLinked: status !== 'unresolved', refId }
}
