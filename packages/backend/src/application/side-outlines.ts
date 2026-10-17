// The outline of one side of a changed file, parsed once per content: both sides' texts are read in a batch (change-symbols.ts), then every block of the file is cut and named over the same outlines.
import { hash } from '../domain/identity.js'
import { outlineLanguage } from '../domain/outline.js'

import type { SourceOutline } from '../domain/outline.js'
import type { ChangeState } from '../domain/review.js'
import type { GitPort } from './ports.js'

export type Side = ChangeState['side']
export type SideTexts = Map<string, string>

export function sideKey(side: Side, filePath: string): string {
	return `${side}\0${filePath}`
}

// Process-global: a reload re-reads the sides but re-parses only what changed (the key is the content's hash), and two desks over one repo share the work.
const OUTLINE_CACHE_CAP = 2000
const outlineCache = new Map<string, SourceOutline | null>()

function outlineOf(
	filePath: string,
	text: string,
	git: GitPort,
): SourceOutline | null {
	const key = `${outlineLanguage(filePath)}\0${hash(text)}`
	if (outlineCache.has(key)) return outlineCache.get(key) ?? null
	const outline = git.parser.outline(filePath, text)
	outlineCache.set(key, outline)
	const oldest = outlineCache.keys().next().value
	if (outlineCache.size > OUTLINE_CACHE_CAP && oldest)
		outlineCache.delete(oldest)
	return outline
}

export function outlineFor(
	side: Side,
	filePath: string,
	texts: SideTexts,
	git: GitPort,
): SourceOutline | null {
	const text = texts.get(sideKey(side, filePath))
	if (!text) return null
	return outlineOf(filePath, text, git)
}
