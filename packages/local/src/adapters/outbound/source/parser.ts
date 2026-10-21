import { outlineLanguage } from '@syneva/core/domain/outline'
// The parser facet the review reads code through: a script goes to oxc, Markdown to the heading outliner, any other file has no outline.
import { markdownOutline } from '@syneva/core/domain/outline-markdown'

import { scriptOutline } from './script-outline.js'

import type { ParserPort } from '@syneva/core/application/ports'
import type { SourceOutline } from '@syneva/core/domain/outline'

function outline(path: string, text: string): SourceOutline | null {
	const language = outlineLanguage(path)
	if (language === 'markdown') return markdownOutline(text)
	if (language !== 'script') return null
	try {
		return scriptOutline(path, text)
	} catch {
		return null
	}
}

export const nodeParser: ParserPort = Object.freeze({ outline })
