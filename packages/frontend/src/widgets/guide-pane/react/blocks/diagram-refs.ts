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
