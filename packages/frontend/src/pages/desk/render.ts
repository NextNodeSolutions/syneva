import { currentFileOrNull } from '@entities/review/changes'
import { cur, loadCurrentContents } from '@entities/review/file/contents'
import { isMarkdownPath } from '@entities/review/file/file-summary'
import { guideInputs, hasGuide } from '@entities/review/guide/guide'
import { restoreComposerFocus } from '@features/manage-comment/composer'
import { cx } from '@shared/lib/cx'
import { $ } from '@shared/lib/dom'
import { esc } from '@shared/lib/esc'
import { perfMark } from '@shared/lib/perf'
import { registerRenderFunnel } from '@shared/lib/render-scheduler'
import { iconHtml } from '@shared/ui/icon-html'
import { consumePendingJump } from '@widgets/diff-view/comment-jump'
import { diffCtx } from '@widgets/diff-view/context'
import { cursorReset } from '@widgets/diff-view/cursor'
import { fileNote } from '@widgets/diff-view/file-note.styles'
import { renderMarkdownFile } from '@widgets/diff-view/mdfile'
import { renderMovedPure } from '@widgets/diff-view/moved-note'
import {
	isOversizedPlaceholder,
	renderOversizedCard,
} from '@widgets/diff-view/oversized'
import { clearOverviewRuler } from '@widgets/diff-view/overview-ruler'
import { releaseDiffInstance } from '@widgets/diff-view/runtime'

import { renderOverview } from './overview'

import type { ReviewState } from '@entities/review/model'
import type * as DiffIsland from '@widgets/diff-view/diff-instance'

type ReviewFile = ReviewState['files'][number]
let renderSequence = 0
let isDeferredRenderPending = false

// One render funnel: every progress-moving mutation in every layer funnels through render(); lower layers reach it through the scheduler seam and this module (imported by app/main) installs the real funnel.
registerRenderFunnel({ render, deferRender })

// Read FRESH on every lookup - a render's supersession checks must see the latest store, not a captured copy.
function currentFile(): ReviewFile | null {
	return currentFileOrNull(
		diffCtx().S.state?.files,
		diffCtx().S.preview,
		diffCtx().S.fileIndex,
	)
}

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

function detachDiffInstance(): void {
	clearOverviewRuler()
	const { D } = diffCtx()
	releaseDiffInstance()
	D.fileDiff = null
	D.lineMap = null
}

function renderGuideOverview(): boolean {
	if (!(diffCtx().S.overviewOpen && hasGuide(guideInputs(diffCtx().S))))
		return false
	cursorReset()
	detachDiffInstance()
	renderOverview()
	return true
}

// An oversized file paints a verdict-capable summary card instead of its diff, BEFORE the contents fetch, so opening it never blocks on a multi-MB tokenization pass; "Load diff anyway" clears the placeholder.
function renderOversizedSummary(): void {
	cursorReset()
	detachDiffInstance()
	renderOversizedCard()
}

function renderContentsError(path: string): void {
	cursorReset()
	detachDiffInstance()
	$('diff').innerHTML =
		`<div class="${cx(fileNote.wrap)}"><div class="${cx(fileNote.strip)}">
    ${iconHtml('gly-flag', fileNote.icon)}
    <span>couldn't load <span class="${cx(fileNote.name)}">${esc(path)}</span></span>
    <span class="${cx(fileNote.meta)}">reload the desk to retry</span>
  </div></div>`
}

// A listed change whose two live sides read identical means the working diff this desk reviewed
// moved under it (committed, staged or reverted mid-review): paint the stale notice rather than
// rendering the "+0 -0" blank body of the diff island.
function isDiffGone(file: ReviewFile, isPreviewing: boolean): boolean {
	if (isPreviewing) return false
	if (!(file.added > 0 || file.removed > 0)) return false
	return cur.path === file.path && cur.oldContents === cur.newContents
}

function renderStaleDiff(file: ReviewFile): void {
	cursorReset()
	detachDiffInstance()
	$('diff').innerHTML =
		`<div class="${cx(fileNote.wrap)}"><div class="${cx(fileNote.strip, fileNote.stale)}">
    ${iconHtml('gly-warn')}
    <span>no diff left for <span class="${cx(fileNote.name)}">${esc(file.path)}</span> - the review is out of date</span>
    <span class="${cx(fileNote.meta)}">reload the desk to re-diff</span>
  </div></div>`
}

function renderReplacementView(
	file: ReviewFile,
	isPreviewing: boolean,
): boolean {
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
	if (!isPreviewing && file.renamePure && file.oldPath) {
		cursorReset()
		detachDiffInstance()
		renderMovedPure(file, file.oldPath)
		return true
	}
	return false
}

async function renderCenter(sequence: number): Promise<void> {
	if (diffCtx().S.deskClosed) return
	if (renderGuideOverview()) return
	const file = currentFile()
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

// The @pierre/diffs island is a separately loaded module; load it lazily on the first diff render, and loading yields to navigation, reset and newer render requests - every await re-checks the sequence and the shown file.
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
		message.className = cx(fileNote.wrap)
		message.textContent =
			'The diff renderer could not load. Refresh this tab to retry.'
		$('diff').replaceChildren(message)
		return
	}
	if (!isCurrent()) return
	await island.renderDiffInstance(file, isCurrent)
}

// The progress strip repaint must run AFTER the render work has PAINTED, not merely after
// renderCenter returns: the transition clock starts at style-commit and a file switch's first frame
// is spent tokenizing + laying out the new diff DOM, so a bar started before that frame lands
// already-finished; the double rAF puts the width change on the first idle frame after the paint.
export async function render(): Promise<void> {
	const sequence = ++renderSequence
	perfMark('render:start')
	try {
		await renderCenter(sequence)
		consumePendingJump(currentFile())
	} finally {
		restoreComposerFocus()
	}
}
