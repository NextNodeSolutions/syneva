// Fenced code highlights through @pierre/diffs' shared Shiki highlighter - the diff view's own instance, so a code block and the diff always render the same theme (pierre-* included).
// Grammars/theme load lazily through Pierre's resolvers.
import { areLanguagesAttached, getSharedHighlighter } from '@pierre/diffs'
import { esc } from '@shared/lib/esc'
import { fromHighlighter } from '@shikijs/markdown-it/core'
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import footnote from 'markdown-it-footnote'
// markdown-it-task-lists ships no types and has no @types package.
// @ts-expect-error: could not find a declaration file for module 'markdown-it-task-lists'
import taskLists from 'markdown-it-task-lists'

import { markdownRuntime } from './runtime-config'

import type { DiffsHighlighter } from '@pierre/diffs'

export type MarkdownComment = { id: string; updatedAt: string; body: string }

// One markdown renderer for comment bodies and markdown files; markdown-it gives exact per-block source lines (token.map) - why it is used over comark.
// html:false drops raw HTML at the source, and DOMPurify is the final gate before anything is innerHTML'd (incl. agent-authored).

let md: MarkdownIt | null = null
let mdFile: MarkdownIt | null = null
// A second renderer with breaks: true so a single newline a reviewer types renders as a line break (people write comments as chat); file/guide markdown keeps the standard soft-break behavior, so hard-wrapped prose is not shredded.
let mdComment: MarkdownIt | null = null
let requestedTheme = ''
// Comment bodies re-render on every poll tick and each edit mints a fresh id:updatedAt key, so the cache would grow without bound (an orphaned entry per edit); an LRU keeps it bounded like the other UI caches (both cap at 30).
const COMMENT_CACHE_CAP = 30
const cache = new Map<string, string>()

function sourceLine(mdi: MarkdownIt): void {
	mdi.core.ruler.push('source_line', state => {
		for (const t of state.tokens)
			if (t.map && (t.level === 0 || t.type === 'list_item_open'))
				t.attrSet('data-line', String(t.map[0] + 1))
		return true
	})
}

type MarkdownFlavor = {
	isBreakOnNewline?: boolean
	canCarryRawHtml?: boolean
}

function buildMd(
	highlighter: DiffsHighlighter,
	theme: string,
	flavor: MarkdownFlavor = {},
): MarkdownIt {
	const renderer = new MarkdownIt({
		html: flavor.canCarryRawHtml ?? false,
		linkify: true,
		breaks: flavor.isBreakOnNewline ?? false,
	})
		.use(footnote)
		.use(taskLists, { label: true })
		.use(fromHighlighter(highlighter, { theme }))
		.use(sourceLine)
	const { highlight } = renderer.options
	if (highlight)
		renderer.options.highlight = withLazyLanguages(highlight, highlighter)
	return renderer
}

// shiki's special `text` language renders an unknown fence as plain text, and markdown-it-shiki's fallbackLanguage omits it while snapshotting loaded languages once at setup; the shared highlighter only holds what something already asked for.
// So the substitution happens at the highlight seam: a fence whose grammar is not loaded renders as text and requests its grammar; the repaint upgrades the block.
const PLAIN_TEXT_LANGUAGE = 'text'
function withLazyLanguages(
	highlight: NonNullable<MarkdownIt['options']['highlight']>,
	highlighter: DiffsHighlighter,
): MarkdownIt['options']['highlight'] {
	return (code, lang, attrs) => {
		if (isLanguageLoaded(highlighter, lang))
			return highlight(code, lang, attrs)
		requestLanguage(lang)
		return highlight(code, PLAIN_TEXT_LANGUAGE, attrs)
	}
}

function isLanguageLoaded(
	highlighter: DiffsHighlighter,
	lang: string,
): boolean {
	return (
		!lang ||
		areLanguagesAttached(lang) ||
		highlighter.getLoadedLanguages().includes(lang)
	)
}

const requestedLanguages = new Set<string>()
const pendingLanguages = new Set<string>()

function requestLanguage(lang: string): void {
	if (requestedLanguages.has(lang)) return
	requestedLanguages.add(lang)
	if (pendingLanguages.size === 0)
		queueMicrotask(() => void loadPendingLanguages())
	pendingLanguages.add(lang)
}

async function loadPendingLanguages(): Promise<void> {
	const languages = [...pendingLanguages]
	pendingLanguages.clear()
	const loads = await Promise.allSettled(
		languages.map(lang =>
			getSharedHighlighter({ themes: [], langs: [lang] }),
		),
	)
	if (loads.some(load => load.status === 'fulfilled')) repaint()
}

let revision = 0

export function outputRevision(): number {
	return revision
}

function repaint(): void {
	revision++
	cache.clear()
	markdownRuntime().onLoaded()
}

async function applyTheme(theme: string): Promise<boolean> {
	requestedTheme = theme
	const highlighter = await getSharedHighlighter({
		themes: [theme],
		langs: [],
	})
	if (theme !== requestedTheme) return false
	md = buildMd(highlighter, theme)
	mdFile = buildMd(highlighter, theme, { canCarryRawHtml: true })
	mdComment = buildMd(highlighter, theme, { isBreakOnNewline: true })
	return true
}

// The settings decoder only admits themes Pierre resolves, so a failure here is a theme chunk that failed to load - the loader's error path (toast, retry on the next render) owns it.
export async function initializeMarkdown(themeName: string): Promise<void> {
	await applyTheme(themeName)
}

export function setMarkdownTheme(name: string): void {
	if (name === requestedTheme) return
	void switchTheme(name)
}

async function switchTheme(name: string): Promise<void> {
	try {
		if (await applyTheme(name)) repaint()
	} catch {
		/* a theme chunk that fails to load keeps the rendered files on their current theme; the loader error path owns the retry */
	}
}

export function renderMarkdown(text: string): string {
	if (!md) return `<p>${esc(text)}</p>`
	return DOMPurify.sanitize(md.render(text || ''))
}

export function renderFileMarkdown(text: string): string {
	if (!mdFile) return `<p>${esc(text)}</p>`
	return rewriteRepoImages(DOMPurify.sanitize(mdFile.render(text || '')))
}

const NON_REPO_SRC = /^(https?:|data:|blob:|\/)/i
function repoImageUrl(src: string): string {
	const raw = src.trim()
	if (!raw || NON_REPO_SRC.test(raw)) return raw
	return markdownRuntime().repoImageSrc(raw.split('#')[0] ?? raw)
}

function rewriteRepoImages(html: string): string {
	if (!html.includes('<img')) return html
	const doc = new DOMParser().parseFromString(html, 'text/html')
	for (const img of doc.querySelectorAll('img[src]')) {
		img.setAttribute('src', repoImageUrl(img.getAttribute('src') ?? ''))
	}
	return doc.body.innerHTML
}

export function renderMarkdownInline(text: string): string {
	if (!md) return esc(text)
	return DOMPurify.sanitize(md.renderInline(text || ''))
}

export function renderCommentBody(c: MarkdownComment): string {
	const key = `${c.id}:${c.updatedAt}`
	const cached = cache.get(key)
	if (cached) {
		cache.delete(key)
		cache.set(key, cached)
		return cached
	}
	if (!mdComment) return `<p>${esc(c.body)}</p>` // not ready yet - don't cache the fallback
	const html = DOMPurify.sanitize(mdComment.render(c.body || ''))
	cache.set(key, html)
	while (cache.size > COMMENT_CACHE_CAP) {
		const oldest = cache.keys().next()
		if (oldest.done) break
		cache.delete(oldest.value)
	}
	return html
}
