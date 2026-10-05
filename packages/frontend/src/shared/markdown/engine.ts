// Fenced code highlights through @pierre/diffs' shared Shiki highlighter: the diff view's own
// instance, so a code block and the diff always render the same theme (pierre-* included), and
// grammars + themes load lazily through Pierre's resolvers instead of a second curated set.
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

// A comment body only needs its identity (cache key) and its markdown text - the shared
// markdown engine stays independent of the review model.
export type MarkdownComment = { id: string; updatedAt: string; body: string }

// One markdown renderer for both comment bodies (#17) and markdown files (#21).
// markdown-it gives exact per-block source lines (token.map) - see sourceLine below -
// which is why we use it over comark; html:false drops raw HTML at the source, and
// DOMPurify is the final gate before anything is innerHTML'd (incl. agent-authored).

// buildMd builds one renderer per use site: `html:false` for guide prose and comment bodies
// (raw HTML stays printed as literal text - agent-authored prose never becomes DOM), and
// `html:true` for the FILE view (markdownFileCommentStrip's sibling - a reviewed file may
// legitimately carry HTML like the GitHub-README <div>/<img> wrappers), which then passes
// through the same DOMPurify gate before mounting.
let md: MarkdownIt | null = null
let mdFile: MarkdownIt | null = null
// A second renderer for comment bodies with `breaks: true`, so a single newline a reviewer types
// renders as a line break (people write comments as chat, not markdown source). File/guide
// markdown keeps the standard soft-break behavior via `md`, so hard-wrapped prose isn't shredded.
let mdComment: MarkdownIt | null = null
// The latest code theme asked for: a slower load of an earlier pick must not overwrite a newer one.
let requestedTheme = ''
// Comment bodies re-render on every poll tick, and each edit mints a fresh id:updatedAt key -
// so the cache would grow without bound (an orphaned entry per edit) if left uncapped. An LRU
// keeps it bounded like the other UI caches (contents.ts, render.ts both cap at 30).
const COMMENT_CACHE_CAP = 30
const cache = new Map<string, string>()

// Stamp each commentable block-open token with its 1-based source line (1-based
// matches @pierre/diffs' additions-side numbers). Top-level blocks AND list items,
// so a comment can target an individual list item rather than the whole list.
function sourceLine(mdi: MarkdownIt): void {
	mdi.core.ruler.push('source_line', state => {
		for (const t of state.tokens)
			if (t.map && (t.level === 0 || t.type === 'list_item_open'))
				t.attrSet('data-line', String(t.map[0] + 1))
		return true
	})
}

// The shared highlighter loads async (theme + grammars); markdown-it render is sync once
// ready. Until then renderMarkdown returns an escaped-text fallback; on ready we
// repaint once so any fallbacks upgrade to rendered markdown.
// An options object over the two orthogonal renderer flavors (the linter caps boolean params):
// `isBreakOnNewline` reads comments as chat; `canCarryRawHtml` lets a reviewed file carry raw
// HTML (sanitized below). Guide/file markdown keeps one instance per flavor, shared.
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

// shiki's special `text` language is the one value that renders an unknown fence as plain text, and
// markdown-it-shiki's `fallbackLanguage` option is typed as a bundled language name - a union that
// omits it - and snapshots the loaded languages once at setup, while the shared highlighter only
// holds the grammars something already asked for. So the substitution happens at the integration's
// highlight seam: a fence whose grammar isn't loaded renders as `text` (same `language-text` class,
// meta attributes untouched) and requests its grammar; the repaint then upgrades the block.
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

// A bare fence and Pierre's plain names (text/ansi) need no grammar; a grammar attached under another
// name still answers to its aliases (a .ts diff loads `typescript`, which a `ts` fence reuses).
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

// Fence languages already requested (loaded, loading, or unknown to shiki): each loads at most once.
const requestedLanguages = new Set<string>()
// Requested during the current task: loaded together so one repaint covers every new fence.
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
	// One load per name: shiki rejects a name it has no grammar for (that fence stays plain text),
	// and the rejection must not keep the other grammars from attaching.
	const loads = await Promise.allSettled(
		languages.map(lang =>
			getSharedHighlighter({ themes: [], langs: [lang] }),
		),
	)
	if (loads.some(load => load.status === 'fulfilled')) repaint()
}

// Bumped whenever rendered output changes under the same input (a theme swap, a grammar landing),
// so a consumer that keeps rendered HTML knows it went stale.
let revision = 0

export function outputRevision(): number {
	return revision
}

// Cached comment HTML still carries the previous theme or plain fences.
function repaint(): void {
	revision++
	cache.clear()
	markdownRuntime().onLoaded()
}

// Load `theme` into the shared highlighter, then rebuild the renderers around it - unless a newer
// pick superseded it while it loaded.
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

// The settings decoder only admits themes Pierre resolves, so a failure here is a theme chunk that
// failed to load - the loader's error path (toast, retry on the next render) owns it.
export async function initializeMarkdown(themeName: string): Promise<void> {
	await applyTheme(themeName)
}

// Switch the code-block theme (settings). The diff resolves the same name through the same
// highlighter; the prose repaints once its renderers carry the new theme.
export function setMarkdownTheme(name: string): void {
	if (name === requestedTheme) return
	void switchTheme(name)
}

async function switchTheme(name: string): Promise<void> {
	try {
		if (await applyTheme(name)) repaint()
	} catch {
		// The theme chunk failed to load: code blocks keep the theme they already carry.
	}
}

// Synchronous once the highlighter is ready.
export function renderMarkdown(text: string): string {
	if (!md) return `<p>${esc(text)}</p>`
	return DOMPurify.sanitize(md.render(text || ''))
}

// The rendered FILE view: raw HTML (GitHub README wrappers, badges) comes through and passes
// the same DOMPurify gate, and the file's own relative image srcs rewrite to /api/blob so its
// assets render. Absolute/external sources pass untouched.
export function renderFileMarkdown(text: string): string {
	if (!mdFile) return `<p>${esc(text)}</p>`
	return rewriteRepoImages(DOMPurify.sanitize(mdFile.render(text || '')))
}

// An img src into a repo-relative file (md or raw HTML) served by the desk's blob route.
// Fragments are meaningless on a binary asset, so they are dropped; absolute, protocol-relative,
// external and data sources pass through. The URL construction itself is injected (the blob
// route is named only by the review-file API boundary - see runtime-config.ts).
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

// One-line markdown (guide file summaries): inline rules only, no <p> wrapper. Block-only
// syntax degrades gracefully to its inline text - guide summaries are spec'd as one-liners.
export function renderMarkdownInline(text: string): string {
	if (!md) return esc(text)
	return DOMPurify.sanitize(md.renderInline(text || ''))
}

// Comment body → sanitized HTML, cached by id+updatedAt (so an edit re-renders).
export function renderCommentBody(c: MarkdownComment): string {
	const key = `${c.id}:${c.updatedAt}`
	const cached = cache.get(key)
	if (cached) {
		cache.delete(key) // re-insert → most-recently-used
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
