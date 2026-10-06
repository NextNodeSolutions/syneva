import { promises as fs } from 'node:fs'

import { resolveContained } from '../../../../application/containment.js'
import { BAD_PATH, cannotRead } from '../failure.js'
import { HTTP_OK, fail } from '../http.js'

import type { RouteRequest } from '../router.js'

// Mime types by extension for /blob: repo-referenced images from the rendered markdown view; everything else falls back to a generic binary type.
// The strict boundary is the containment check, not the mime map (the desk serves any repo file's TEXT via /file).
const MIME_BY_EXTENSION: Record<string, string> = {
	svg: 'image/svg+xml',
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	gif: 'image/gif',
	webp: 'image/webp',
	avif: 'image/avif',
	bmp: 'image/bmp',
	ico: 'image/x-icon',
}

function mimeOf(path: string): string {
	const ext = path.split('.').pop()?.toLowerCase() ?? ''
	return MIME_BY_EXTENSION[ext] ?? 'application/octet-stream'
}

// GET /blob: one repo file's raw bytes for the rendered markdown view's relative image srcs (the engine rewrites them to point here). Same containment boundary as /file: repo-relative, no escapes.
export async function serveBlob({
	ctx,
	res,
	url,
}: RouteRequest): Promise<void> {
	const rel = url.searchParams.get('path') ?? ''
	const resolved = await resolveContained(
		ctx.state.root,
		rel,
		ctx.git.workspace,
	)
	if ('error' in resolved && resolved.error === 'escape')
		return fail(res, BAD_PATH)
	if (!('abs' in resolved)) return fail(res, cannotRead(rel))
	try {
		const bytes = await fs.readFile(resolved.abs)
		res.writeHead(HTTP_OK, { 'content-type': mimeOf(rel) })
		res.end(bytes)
	} catch {
		fail(res, cannotRead(rel))
	}
}
