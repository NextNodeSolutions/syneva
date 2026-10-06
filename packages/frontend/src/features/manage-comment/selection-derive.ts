import type { Side } from '@shared/diff-renderer/types'

export function sideFromLineType(
	lineType: string | null | undefined,
): Side | null {
	if (!lineType) return null
	if (lineType.includes('deletion')) return 'deletions'
	if (lineType.includes('addition')) return 'additions'
	return null
}
