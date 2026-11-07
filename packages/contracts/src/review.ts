export type ReviewMode = 'repo' | 'file' | 'pr'

// The code a guide domain or block pointed at when feedback on it was written, so the thread stays readable after a guide replacement drops the target.
export type DomainCodeRef = {
	path: string
	side: 'additions' | 'deletions'
	lineNumber: number
	endLine?: number | undefined
	label?: string | undefined
}
