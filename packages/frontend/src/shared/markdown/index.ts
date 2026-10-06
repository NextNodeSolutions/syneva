import { esc } from '@shared/lib/esc'

import { markdownRuntime } from './runtime-config'

import type * as MarkdownEngine from './engine'
import type { MarkdownComment } from './engine'

let engine: typeof MarkdownEngine | undefined
let loading: Promise<void> | undefined
let themeName = ''

export function markdownRevision(): number {
	return engine ? 1 + engine.outputRevision() : 0
}

function loadMarkdown(): void {
	loading ??= initializeMarkdown()
}

async function initializeMarkdown(): Promise<void> {
	try {
		const module = await import('@shared/markdown/engine')
		const theme = themeName || markdownRuntime().getTheme()
		await module.initializeMarkdown(theme)
		module.setMarkdownTheme(themeName || theme)
		engine = module
		markdownRuntime().onLoaded()
	} catch {
		loading = undefined
		markdownRuntime().onLoadError()
	}
}

export function setMarkdownTheme(name: string): void {
	themeName = name
	engine?.setMarkdownTheme(name)
}

export function renderMarkdown(text: string): string {
	if (engine) return engine.renderMarkdown(text)
	loadMarkdown()
	return `<p>${esc(text)}</p>`
}

export function renderFileMarkdown(text: string): string {
	if (engine) return engine.renderFileMarkdown(text)
	loadMarkdown()
	return `<p>${esc(text)}</p>`
}

export function renderMarkdownInline(text: string): string {
	if (engine) return engine.renderMarkdownInline(text)
	loadMarkdown()
	return esc(text)
}

export function renderCommentBody(comment: MarkdownComment): string {
	if (engine) return engine.renderCommentBody(comment)
	loadMarkdown()
	return `<p>${esc(comment.body)}</p>`
}
