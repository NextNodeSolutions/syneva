import { createContext, use } from 'react'

import type { DomainActions } from './domain-chip'

// What the drawing does when the reviewer points: at a part, it traces that part's links; at a domain number, it lights the domain's parts; choosing a number opens the domain's review. The callbacks hold still across hovers, so React Flow's nodes read them without being rebuilt.
export type CanvasActions = DomainActions & {
	onHover: (id: string | null) => void
}

const IDLE: CanvasActions = {
	onHover: () => {},
	onFocus: () => {},
	onOpen: () => {},
}

export const CanvasActionsContext = createContext<CanvasActions>(IDLE)

export function useCanvasActions(): CanvasActions {
	return use(CanvasActionsContext)
}
