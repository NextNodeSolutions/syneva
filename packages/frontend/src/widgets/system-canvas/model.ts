import type { RiskLevel } from '@entities/review/guide/model'
import type { GuideModel } from '@entities/review/guide/system-model'

// A domain as the canvas names it: its place in the reading order (the number its elements wear, the overview's list counts the same way), its risk, and what the reviewer still owes it.
export type CanvasDomain = {
	id: string
	number: number
	title: string
	risk: RiskLevel
	isStale: boolean
	// Spans still to read line by line (criticalSpans not yet decided).
	toRead: number
	decided: number
	total: number
}

export type SystemCanvasProps = {
	model: GuideModel
	domains: CanvasDomain[]
	// The domain the reviewer points at in the overview's list: its elements light up.
	focusDomain: string | null
	onOpenDomain: (id: string) => void
}

// How the scene is drawn: the plan React Flow lays flat, or the isometric drawing of the same graph raised into platforms and blocks.
export type Projection = 'plan' | 'iso'

// The part the reviewer selected, shared by every projection of the scene.
export type Selection = {
	selected: string | null
	onSelect: (id: string | null) => void
}
