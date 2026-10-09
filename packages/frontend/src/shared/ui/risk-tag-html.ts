import { cx } from '@shared/lib/cx'
import { tag } from '@syneva/design-system/controls.styles'

import { riskTag } from './risk-tag.styles'

export type RiskLevelName = keyof typeof riskTag

export const RISK_LABELS: Record<RiskLevelName, string> = {
	critical: 'Critical',
	high: 'High',
	medium: 'Medium',
	low: 'Low',
}

// The imperative surfaces (the file header, the overview, the oversized card) print the same tag the React chrome composes from tag.base + riskTag[level].
export function riskTagHtml(level: RiskLevelName): string {
	return `<span class="${cx(tag.base, riskTag[level])}" data-risk="${level}">${RISK_LABELS[level]} risk</span>`
}
