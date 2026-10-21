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
// A plan's renderer: guide prose, whose figures stay its placeholders (figureFence).
let mdPlan: MarkdownIt | null = null
let requestedTheme = ''
// Comment bodies re-render on every pulse and each edit mints a fresh id:updatedAt key, so the cache would grow without bound (an orphaned entry per edit); an LRU keeps it bounded like the other UI caches (both cap at 30).
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
	hasFigures?: boolean
}

// The info string a plan's figure fence opens with (a diagram block in the guide's JSON shape).
const FIGURE_LANGUAGE = 'syneva'

type RenderRule = NonNullable<MarkdownIt['renderer']['rules']['fence']>

// A plan's figure fence at the body's top level renders as a placeholder carrying its source,
// unhighlighted: the plan page cuts the rendered body at it and draws the figure there, so the
// body still renders in one pass (its footnotes and link references reach across figures).
// The placeholder is a code block, so a figure that is not drawn still reads as its source;
// one nested in a list or a quote stays a plain code block.
function figureFence(fence: RenderRule | undefined): RenderRule {
	return (...args) => {
		const [tokens, index, options, , self] = args
		const token = tokens[index]
		if (token?.level === 0 && token.info.trim() === FIGURE_LANGUAGE)
			return `<pre data-plan-figure><code>${esc(token.content)}</code></pre>\n`
		return fence ? fence(...args) : self.renderToken(tokens, index, options)
	}
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
	if (flavor.hasFigures)
		renderer.renderer.rules.fence = figureFence(
			renderer.renderer.rules.fence,
		)
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
	mdPlan = buildMd(highlighter, theme, { hasFigures: true })
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

// Guide prose keeps the comment-safe renderer (no raw HTML from an agent) but cites repository images like a markdown file does, so they rewrite to the repo's blob route.
export function renderGuideMarkdown(text: string): string {
	if (!md) return `<p>${esc(text)}</p>`
	return rewriteRepoImages(DOMPurify.sanitize(md.render(text || '')))
}

// A plan reads as guide prose whose figure fences stay placeholders (figureFence). Its images
// are not the repository's: a plan's page has no repository to resolve them against.
export function renderPlanMarkdown(text: string): string {
	if (!mdPlan) return `<pre>${esc(text)}</pre>`
	return DOMPurify.sanitize(mdPlan.render(text || ''))
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
