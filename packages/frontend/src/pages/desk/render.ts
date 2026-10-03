import { currentFileOrNull } from '@entities/review/changes'
import { cur, loadCurrentContents } from '@entities/review/file/contents'
import { isMarkdownPath } from '@entities/review/file/file-summary'
import { guideInputs, hasGuide } from '@entities/review/guide/guide'
import { restoreComposerFocus } from '@features/manage-comment/composer'
import { $ } from '@shared/lib/dom'
import { esc } from '@shared/lib/esc'
import { perfMark } from '@shared/lib/perf'
import { registerRenderFunnel } from '@shared/lib/render-scheduler'
import { consumePendingJump } from '@widgets/diff-view/comment-jump'
import { diffCtx } from '@widgets/diff-view/context'
import { cursorReset } from '@widgets/diff-view/cursor'
import { renderMarkdownFile } from '@widgets/diff-view/mdfile'
import { renderMovedPure } from '@widgets/diff-view/moved-note'
import {
	isOversizedPlaceholder,
	renderOversizedCard,
} from '@widgets/diff-view/oversized'
import { clearOverviewRuler } from '@widgets/diff-view/overview-ruler'

import { renderOverview } from './overview'

import type { ReviewState } from '@entities/review/model'
import type * as DiffIsland from '@widgets/diff-view/diff-instance'

type ReviewFile = ReviewState['files'][number]
let renderSequence = 0
// A deferRender is pending (scheduled through the double-rAF): further calls in the
// same window are folded into the scheduled render.
let isDeferredRenderPending = false

// One render funnel: every progress-moving mutation in every layer funnels through render();
// lower layers reach it through the scheduler seam (@shared/lib/render-scheduler) - this module
// (imported by app/main) is what installs the real funnel.
registerRenderFunnel({ render, deferRender })

// The file #diff is to show (or none). Read FRESH on every lookup - a render's supersession
// checks must see the latest store, not a captured copy.
function currentFile(): ReviewFile | null {
	return currentFileOrNull(
		diffCtx().S.state?.files,
		diffCtx().S.preview,
		diffCtx().S.fileIndex,
	)
}

// Schedule one render for mutations made in the same frame.
export function deferRender(): void {
	if (isDeferredRenderPending) return
	isDeferredRenderPending = true
	requestAnimationFrame(() =>
		requestAnimationFrame(() => {
			isDeferredRenderPending = false
			void render()
		}),
	)
}

// Release the previous renderer before another view takes over the pane.
function detachDiffInstance(): void {
	clearOverviewRuler()
	const { D } = diffCtx()
	D.instance?.cleanUp()
	D.instance = null
	D.fileDiff = null
	D.lineMap = null
}

// Guided review: the Overview page takes over the center until a file is selected.
function renderGuideOverview(): boolean {
	if (!(diffCtx().S.overviewOpen && hasGuide(guideInputs(diffCtx().S))))
		return false
	cursorReset()
	detachDiffInstance()
	renderOverview()
	return true
}

// An oversized file (server-stamped) paints a verdict-capable summary card instead of its diff -
// before the contents fetch, so opening it never blocks on a multi-MB tokenization pass.
// "Load diff anyway" (oversized.ts) clears the placeholder and falls back to the normal render.
function renderOversizedSummary(): void {
	cursorReset()
	detachDiffInstance()
	renderOversizedCard()
}

// Shown when a file's contents can't be fetched (git object gone after a rebase, transport
// failure). Names the file and points at a desk reload; the rest of the desk stays live, so the
// reviewer can navigate to other files while this one is unresolvable.
function renderContentsError(path: string): void {
	cursorReset()
	detachDiffInstance()
	$('diff').innerHTML =
		`<div class="file-note"><div class="file-note-strip moved">
    <svg class="ic"><use href="#gly-flag"></use></svg>
    <span>couldn't load <span class="file-note-name">${esc(path)}</span></span>
    <span class="file-note-meta">reload the desk to retry</span>
  </div></div>`
}

// A listed change whose two live sides read identical: the working diff this desk reviewed moved
// under it (committed, staged or reverted mid-review). Rendering the diff island would say "+0 -0"
// with a blank body - paint the stale notice instead, so the desk names the situation rather than
// silently rendering an emptied diff (amber = stale notices per DESIGN.md).
function isDiffGone(file: ReviewFile, isPreviewing: boolean): boolean {
	if (isPreviewing) return false
	// Only files whose reviewed diff claimed content changes: a zero-count listing (a file-mode full
	// read, a pure rename) is a legitimate view-only render, never staleness.
	if (!(file.added > 0 || file.removed > 0)) return false
	return cur.path === file.path && cur.oldContents === cur.newContents
}

function renderStaleDiff(file: ReviewFile): void {
	cursorReset()
	detachDiffInstance()
	$('diff').innerHTML =
		`<div class="file-note"><div class="file-note-strip stale">
    <svg class="ic"><use href="#gly-warn"></use></svg>
    <span>no diff left for <span class="file-note-name">${esc(file.path)}</span> - the review is out of date</span>
    <span class="file-note-meta">reload the desk to re-diff</span>
  </div></div>`
}

// Which of the non-diff views (if any) takes over #diff. None of them read the fetched
// contents, but the fetch still warms the per-file cache for a later switch.
function renderReplacementView(
	file: ReviewFile,
	isPreviewing: boolean,
): boolean {
	// Markdown file in rendered mode: formatted preview with block-anchored comments instead of
	// the @pierre/diffs view.
	if (
		!isPreviewing &&
		diffCtx().S.state?.mode === 'file' &&
		isMarkdownPath(file.path) &&
		diffCtx().S.fileView === 'rendered'
	) {
		cursorReset()
		detachDiffInstance()
		renderMarkdownFile()
		return true
	}
	// A pure rename (identical content, distinct paths) has no diff to show - the muted
	// "renamed old -> new, no changes" note replaces the diff.
	if (!isPreviewing && file.renamePure && file.oldPath) {
		cursorReset()
		detachDiffInstance()
		renderMovedPure(file, file.oldPath)
		return true
	}
	return false
}

// The render pass: the single function every progress-moving mutation funnels through, plus the
// gate that decides what #diff shows for the current file. The diff itself is rendered by the
// @pierre island (diff-instance.ts); the header builders live in file-header.ts.
async function renderCenter(sequence: number): Promise<void> {
	// A closed desk shows its cover and nothing else: the work surface (and #diff with it) is
	// unmounted, so a late render request - a poll merge, a store change - has nowhere to paint.
	if (diffCtx().S.deskClosed) return
	if (renderGuideOverview()) return
	const file = currentFile()
	// Nothing to show: the pre-init window (main.ts hasn't adopted the first fetch yet), or a reload
	// whose rebuilt review came back empty. Empty the pane rather than render a fabricated file.
	if (!file) {
		cursorReset()
		detachDiffInstance()
		$('diff').replaceChildren()
		return
	}
	const isPreviewing = !!diffCtx().S.preview
	if (!isPreviewing && isOversizedPlaceholder(file)) {
		renderOversizedSummary()
		return
	}
	// Pull this file's contents from the per-file endpoint before rendering anything that reads
	// them (the markdown/moved/diff views all follow). A "stale" result means the reviewer
	// switched files mid-fetch - abort silently, a newer render() is already handling the current
	// file. An "error" means the contents can't be fetched (git object gone after a rebase); show an
	// error card naming the file so navigation to other files keeps working.
	const contentsStatus = await loadCurrentContents(
		file,
		diffCtx().S.preview,
		() => currentFile() === file,
	)
	if (contentsStatus === 'stale' || sequence !== renderSequence) return
	if (contentsStatus === 'error') {
		renderContentsError(file.path)
		return
	}
	if (isDiffGone(file, isPreviewing)) {
		renderStaleDiff(file)
		return
	}
	if (renderReplacementView(file, isPreviewing)) return
	await renderDiffIsland(file, sequence)
}

// The @pierre/diffs island is a separately loaded module (it carries the tokenizing renderer);
// load it lazily on the first diff render. Loading yields to navigation, reset, and newer render
// requests, so every await re-checks the sequence and the shown file.
async function renderDiffIsland(
	file: ReviewFile,
	sequence: number,
): Promise<void> {
	const isCurrent = (): boolean =>
		sequence === renderSequence && currentFile() === file
	let island: typeof DiffIsland
	try {
		island = await import('@widgets/diff-view/diff-instance')
	} catch {
		if (!isCurrent()) return
		detachDiffInstance()
		const message = document.createElement('div')
		message.className = 'file-note'
		message.textContent =
			'The diff renderer could not load. Refresh this tab to retry.'
		$('diff').replaceChildren(message)
		return
	}
	if (!isCurrent()) return
	await island.renderDiffInstance(file, isCurrent)
}

// Every progress-moving mutation (decision, approval, reset, reload) funnels through render,
// so it is the progress strip's single repaint point. It must run AFTER the render work has
// PAINTED, not merely after renderCenter returns: the transition clock starts at style-commit,
// and a file switch's first frame is spent tokenizing + laying out the new diff DOM - a bar
// started before (or during) that frame lands already-finished, i.e. no visible motion. The
// double rAF puts the width change on the first idle frame after that paint.
export async function render(): Promise<void> {
	const sequence = ++renderSequence
	perfMark('render:start')
	try {
		await renderCenter(sequence)
		// A cross-file jump stashed a target before the (scheduled, awaitable) file-switch
		// render; the new file's view is on screen now, so land on it. One consumption per
		// set - the executor no-ops when this render wasn't the target's file.
		consumePendingJump(currentFile())
	} finally {
		// The diff DOM (and any inline composer inside it) was just rebuilt from scratch - re-focus
		// the open composer and restore its caret from the store, so typing survives a render
		// triggered mid-compose (e.g. accepting a change while replying).
		restoreComposerFocus()
	}
}
