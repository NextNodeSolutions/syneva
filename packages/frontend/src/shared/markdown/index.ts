import { esc } from '@shared/lib/esc'

import { markdownRuntime } from './runtime-config'

import type * as MarkdownEngine from './engine'
import type { MarkdownComment } from './engine'

let engine: typeof MarkdownEngine | undefined
let loading: Promise<boolean> | undefined
let themeName = ''

export function markdownRevision(): number {
	return engine ? 1 + engine.outputRevision() : 0
}

// Starts the engine's load (once; a failed one is tried again on the next call), settling on
// whether it rendered: a page that renders markdown all at once (a plan) waits for it rather
// than painting the plain fallback first, and starts it beside its own fetch.
export function loadMarkdown(): Promise<boolean> {
	loading ??= initializeMarkdown()
	return loading
}

async function initializeMarkdown(): Promise<boolean> {
	try {
		const module = await import('@shared/markdown/engine')
		const theme = themeName || markdownRuntime().getTheme()
		await module.initializeMarkdown(theme)
		module.setMarkdownTheme(themeName || theme)
		engine = module
		markdownRuntime().onLoaded()
		return true
	} catch {
		loading = undefined
		markdownRuntime().onLoadError()
		return false
	}
}

export function setMarkdownTheme(name: string): void {
	themeName = name
	engine?.setMarkdownTheme(name)
}

export function renderMarkdown(text: string): string {
	if (engine) return engine.renderMarkdown(text)
	void loadMarkdown()
	return `<p>${esc(text)}</p>`
}

export function renderFileMarkdown(text: string): string {
	if (engine) return engine.renderFileMarkdown(text)
	void loadMarkdown()
	return `<p>${esc(text)}</p>`
}

export function renderGuideMarkdown(text: string): string {
	if (engine) return engine.renderGuideMarkdown(text)
	void loadMarkdown()
	return `<p>${esc(text)}</p>`
}

export function renderPlanMarkdown(text: string): string {
	if (engine) return engine.renderPlanMarkdown(text)
	void loadMarkdown()
	return `<pre>${esc(text)}</pre>`
}

export function renderMarkdownInline(text: string): string {
	if (engine) return engine.renderMarkdownInline(text)
	void loadMarkdown()
	return esc(text)
}

export function renderCommentBody(comment: MarkdownComment): string {
	if (engine) return engine.renderCommentBody(comment)
	void loadMarkdown()
	return `<p>${esc(comment.body)}</p>`
}
