// Stage 1 reviews GitHub pull requests only; local sources join this union in stage 2.
export type ReviewMode = 'pr'

export type CodeSide = 'additions' | 'deletions'

// A span of ORIGINAL code: `additions` is the new file, `deletions` the old one, lines 1-based in that file.
// Rendered-diff numbers are never identities (the desk renumbers them per render).
export type CodeSpan = {
	path: string
	side: CodeSide
	lineNumber: number
	endLine?: number | undefined
}

// The code a guide domain or block pointed at when feedback on it was written, so the thread stays readable after a guide replacement drops the target.
export type DomainCodeRef = CodeSpan & { label?: string | undefined }
