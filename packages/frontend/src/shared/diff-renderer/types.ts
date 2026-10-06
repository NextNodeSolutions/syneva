export type Side = 'additions' | 'deletions'
export type DiffStyle = 'split' | 'unified'

// DISPLAY coordinates (the rendered gutters drift from real file lines once decisions are replayed) - convert via the current line map before persisting.
export type Selection = {
	side: Side
	lineNumber: number
	endLine?: number | undefined
}
