// Diff-rendering primitives shared by the line map and the imperative diff view.
// The review entity re-exports them onto its model surface.
export type Side = 'additions' | 'deletions'
export type DiffStyle = 'split' | 'unified'

// The line/range the action popover + composer currently target. These are DISPLAY
// coordinates (the rendered diff's gutter numbers, which drift from real file lines once
// decisions are replayed) - convert via the current line map before persisting.
export type Selection = {
	side: Side
	lineNumber: number
	endLine?: number | undefined
}
