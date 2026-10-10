// The open body as the hub reads it (POST /api/hub/desks and POST /api/hub/inventory): the repository's absolute path, the mode and source, and a guide validated by the domain rule before any desk is touched.
import os from 'node:os'
import path from 'node:path'

import { validateGuide } from '../../../domain/guide.js'

import type { ReviewMode } from '@syneva/contracts/review'
import type { DeskQuery } from '../../../application/open-desk.js'
import type { Guide } from '../../../domain/guide-shapes.js'

type ParsedOpen =
	| { query: DeskQuery; guide: Guide | undefined }
	| { error: string }

function isMode(raw: unknown): raw is ReviewMode {
	return raw === 'repo' || raw === 'file' || raw === 'pr'
}

function optionalText(
	record: Record<string, unknown>,
	key: string,
): string | undefined {
	const field = record[key]
	if (typeof field !== 'string' || !field.length) return undefined
	return field
}

// A leading `~` names the home directory of the hub's user, as a shell would expand it (a person typing a path into the dashboard writes it so); Node's path functions never do.
const HOME_PREFIX = /^~(?=$|[\\/])/

function expandHome(text: string): string {
	return text.replace(HOME_PREFIX, () => os.homedir())
}

// `root` is required and absolute (after `~`): the hub's cwd is no one's - an auto-started hub inherits whichever agent started it, so a relative root would open whatever repository that is.
// A present `guide` is validated by the domain rule before any desk is touched.
export function parseOpenRequest(body: unknown): ParsedOpen {
	if (typeof body !== 'object' || body === null)
		return { error: 'The open body must be a JSON object.' }
	const record: Record<string, unknown> = Object.fromEntries(
		Object.entries(body),
	)
	const given = optionalText(record, 'root')
	if (!given) return { error: 'open requires a non-empty `root` path.' }
	const root = expandHome(given)
	if (!path.isAbsolute(root))
		return {
			error: "Give the repository's absolute path on the hub's machine.",
		}
	const mode = record.mode ?? 'repo'
	if (!isMode(mode)) return { error: 'mode must be "repo", "file" or "pr".' }
	const target = optionalText(record, 'target')
	if (mode === 'file' && !target)
		return { error: 'file mode requires `target` (the file to review).' }
	let guide: Guide | undefined
	// A posted `guide` key is a posted guide, null included: it is validated, never ignored.
	if ('guide' in record) {
		const validation = validateGuide(record.guide)
		if (!validation.ok)
			return { error: `Invalid guide: ${validation.reason}.` }
		guide = validation.guide
	}
	return {
		query: {
			root,
			mode,
			session: optionalText(record, 'session'),
			target: mode === 'file' && target ? expandHome(target) : target,
			base: optionalText(record, 'base'),
			staged: record.staged === true,
			pathFilter: optionalText(record, 'path'),
			noGuide: record.noGuide === true,
		},
		guide,
	}
}
