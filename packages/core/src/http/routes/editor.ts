import { repoPath, resolveContained } from '../../application/containment.js'
import { BAD_PATH } from '../failure.js'
import {
	HTTP_INTERNAL,
	HTTP_OK,
	HTTP_UNPROCESSABLE,
	readJsonBody,
	json,
	fail,
} from '../http.js'

import type { RouteRequest } from '../router.js'

// Decoded at the transport boundary: a body without a usable path is the caller's error (the
// route answers 400); the line value passes raw - the editor capability normalizes it.
function parseOpenEditorRequest(
	payload: unknown,
): { path: string; line: unknown } | null {
	if (typeof payload !== 'object' || payload === null) return null
	const filePath =
		'path' in payload && typeof payload.path === 'string'
			? payload.path
			: ''
	if (!filePath) return null
	return {
		path: filePath,
		line: 'lineNumber' in payload ? payload.lineNumber : undefined,
	}
}

// The file must be the repo's, after symlinks too (the same boundary /file and /blob keep): the
// editor gets a path inside the desk's root or nothing. A file not there yet keeps its lexical
// path - the editor opens a new buffer. Only the machine's own requests may hand it to the OS's
// opener (ports.ts, EditorScope).
export async function openInEditor({
	ctx,
	request,
	channel,
}: RouteRequest): Promise<Response> {
	const body: unknown = await readJsonBody(request)
	const target = parseOpenEditorRequest(body)
	if (!target) return fail(BAD_PATH)
	const abs = repoPath(ctx.state.root, target.path)
	if (!abs) return fail(BAD_PATH)
	const contained = await resolveContained(
		ctx.state.root,
		target.path,
		ctx.git.workspace,
	)
	if ('error' in contained && contained.error === 'escape')
		return fail(BAD_PATH)
	const launched = await ctx.editor.open(ctx.state.root, abs, target.line, {
		osOpener: channel === 'direct',
	})
	if (!launched.ok)
		return fail({
			// A preference the reviewer must fix answers 422; a failed launch is the desk's error.
			status:
				launched.code === 'EDITOR_FAILED'
					? HTTP_INTERNAL
					: HTTP_UNPROCESSABLE,
			code: launched.code,
			error: launched.message,
			fix: EDITOR_FIXES[launched.code] ?? EDITOR_FIX,
		})
	return json(HTTP_OK, { ok: true })
}

const EDITOR_FIX = 'Update the editor command in Settings.'

const EDITOR_FIXES: Readonly<Record<string, string>> = {
	EDITOR_FAILED: 'Check the editor command in Settings and try again.',
	EDITOR_LOCAL_ONLY:
		"Set an editor command in Settings on the hub's machine, for example `code -g {file}:{line}`.",
}
