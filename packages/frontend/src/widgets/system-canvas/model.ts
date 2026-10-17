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
