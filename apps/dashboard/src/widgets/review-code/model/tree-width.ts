export const TREE_WIDTH = {
	initial: 280,
	min: 180,
	max: 520,
	step: 16,
} as const

export function clampTreeWidth(width: number): number {
	return Math.min(TREE_WIDTH.max, Math.max(TREE_WIDTH.min, width))
}
