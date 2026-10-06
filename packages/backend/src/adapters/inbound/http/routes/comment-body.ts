import { commentSide, parseLineNumber } from '../../../../domain/comments.js'

import type { CommentInput } from '../../../../domain/comments.js'

// Transport shape validation for the shared ask/comment body ({ path, body, lineNumber, side }), posted by both /comment and /ask; line 0 is the whole-file anchor (no diff side, so a carried side is normalized away).
// Returns null on what it cannot default; the route answers 422.
export function parseCommentRequest(payload: unknown): CommentInput | null {
	if (typeof payload !== 'object' || payload === null) return null
	const filePath =
		'path' in payload && typeof payload.path === 'string'
			? payload.path
			: ''
	const text =
		'body' in payload && typeof payload.body === 'string'
			? payload.body.trim()
			: ''
	if (!filePath || !text) return null
	const line = 'lineNumber' in payload ? payload.lineNumber : undefined
	const lineNumber = parseLineNumber(line)
	if (lineNumber === null) return null
	return {
		path: filePath,
		lineNumber,
		side: commentSide(
			'side' in payload && payload.side === 'deletions'
				? 'deletions'
				: 'additions',
			lineNumber,
		),
		body: text,
		role: 'role' in payload && payload.role === 'user' ? 'user' : 'agent',
	}
}
