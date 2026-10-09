import { currentFileOrNull, fileFinished } from '@entities/review/changes'
import { fetchPreviewFile } from '@entities/review/file/api'
import { peekContents, prefetchContents } from '@entities/review/file/contents'
import { defaultFileView } from '@entities/review/file/file-summary'
import { guideInputs, hasGuide, navOrder } from '@entities/review/guide/guide'
import { nextUnreviewed } from '@entities/review/guide/seek'
import { deferRender, render } from '@pages/desk/render'
import { setPendingJump } from '@widgets/diff-view/comment-jump'
import { cursorReset } from '@widgets/diff-view/cursor'
import { D } from '@widgets/diff-view/runtime'

import { S, toast } from '../store'

import type { FileRow } from '@entities/review/file/tree-rows'
import type { PreviewFile, ReviewState } from '@entities/review/model'

type ReviewFile = ReviewState['files'][number]

export function installNavigationBindings(): void {
	installFileSelection()
	installFileStepping()
	installSignOffAdvance()
	installSpanJump()
}

// A guide reference or an owned block lands on its exact file, side and line: a file in the review is selected (the render funnel consumes the jump once the rows exist - offscreen rows of a virtualized file through its navigator), unchanged context outside the diff opens as the read-only preview.
function installSpanJump(): void {
	S.jumpToSpan = span => {
		const { state } = S
		if (!state) return
		setPendingJump({
			path: span.path,
			side: span.side,
			lineNumber: span.lineNumber,
			fileLevel: false,
			unanchored: false,
		})
		const index = state.files.findIndex(file => file.path === span.path)
		const shown = currentFileOrNull(state.files, S.preview, S.fileIndex)
		if (index >= 0 && shown?.path === span.path && !S.overviewOpen) {
			void render()
			return
		}
		if (index >= 0) S.selectFile?.(index)
		else S.previewFile?.(span.path)
	}
}

// Bumped by every selection that replaces the rendered file and by every preview request; an in-flight preview whose token is no longer current is discarded, so a late response can't overwrite a newer selection.
let navGeneration = 0

function installFileSelection(): void {
	S.selectFile = i => {
		const { state } = S
		if (i < 0 || !state?.files[i]) return
		navGeneration++ // invalidate any in-flight preview for the file being left
		S.treeDrawerOpen = false
		S.overviewOpen = false
		S.preview = null
		S.diffScrolled = false // the new file renders at the top (see render.ts) - hide the floating action
		S.fileIndex = i
		S.fileView = defaultFileView(state.files[i], S.settings.markdownView)
		D.fileDiff = null
		cursorReset()
		deferRender()
		warmNextFile()
	}
	S.previewFile = path => {
		void openPreview(path)
	}
}

async function openPreview(path: string): Promise<void> {
	const gen = ++navGeneration
	const preview = await readPreviewFile(path)
	if (gen !== navGeneration) return
	if (!preview) return
	S.overviewOpen = false
	S.preview = preview
	D.fileDiff = null
	cursorReset()
	await render()
}

// Two sortings, one review state - a sign-off in either view approves globally.
const walkthroughActive = (): boolean =>
	hasGuide(guideInputs(S)) && S.sidebarTab === 'walkthrough'

function nextInWalkthrough(dir: 1 | -1): number | null {
	const order = navOrder(guideInputs(S))
	if (!order.length) return null
	const pos = order.indexOf(S.fileIndex)
	return order[(pos + dir + order.length) % order.length] ?? null
}

function nextInTree(dir: 1 | -1): FileRow | null {
	const rows = (S.treeRows?.() ?? []).filter(
		(row): row is FileRow => row.kind === 'file' || row.kind === 'test',
	)
	if (!rows.length) return null
	const shown = currentFileOrNull(
		S.state?.files,
		S.preview,
		S.fileIndex,
	)?.path
	const pos = rows.findIndex(row => row.path === shown)
	return rows[(pos + dir + rows.length) % rows.length] ?? null
}

// Warm the file the next step will actually open (the active pane's sorting): its contents, so the step never waits on the wire, then its highlight in Pierre's worker cache, so it opens colored.
export function warmNextFile(): void {
	const next = walkthroughActive()
		? nextInWalkthrough(1)
		: (nextInTree(1)?.fileIndex ?? null)
	if (next === null) return
	const file = S.state?.files[next]
	if (file) void warmFile(file)
}

async function warmFile(file: ReviewFile): Promise<void> {
	await prefetchContents(file, S.loadedOversized)
	const contents = peekContents(file, null)
	if (!contents) return
	try {
		const { primeDiffHighlight } =
			await import('@widgets/diff-view/diff-prime')
		await primeDiffHighlight(file, contents)
	} catch {
		/* a failed warm-up is silent: the open re-fetches and renders the error card */
	}
}

function installFileStepping(): void {
	// One dispatch for "open the file this tree row points at": stepInView's tree fallthrough and the explicit tree-order keys share it, so the two can never drift apart.
	const openTreeRow = (dir: 1 | -1): void => {
		const row = nextInTree(dir)
		if (!row) return
		if (typeof row.fileIndex === 'number') S.selectFile?.(row.fileIndex)
		else S.previewFile?.(row.path)
	}
	S.stepInView = dir => {
		if (S.overviewOpen) {
			if (dir === 1) {
				S.startGuided?.()
				return
			}
			const order = navOrder(guideInputs(S))
			const last =
				order.length > 0 ? (order[order.length - 1] ?? null) : null
			if (last !== null) S.selectFile?.(last)
			return
		}
		if (walkthroughActive()) {
			const target = nextInWalkthrough(dir)
			if (target !== null) S.selectFile?.(target)
			return
		}
		openTreeRow(dir)
	}
	S.nextFile = () => S.stepInView?.(1)
	S.prevFile = () => S.stepInView?.(-1)
	S.treeStep = openTreeRow
}

function installSignOffAdvance(): void {
	// The armed notes flow wins; else the next UNSIGNED file in the ACTIVE pane's sorting - the scan walks cyclically and skips what is already signed off: approving hands over the next work item, and a reviewed neighbor is not work.
	// Plain next/prev keeps the raw order; only the sign-off advance seeks; when nothing unsigned remains the completion gate takes over.
	S.afterSignOff = path => {
		if (S.notesAfterSignOff?.(path)) return
		const { state } = S
		if (!state) return
		const order = walkthroughActive()
			? navOrder(guideInputs(S))
			: (S.treeRows?.() ?? [])
					.filter(
						(row): row is FileRow =>
							row.kind === 'file' || row.kind === 'test',
					)
					.map(row => row.fileIndex)
					.filter((i): i is number => typeof i === 'number')
		const next = nextUnreviewed(order, S.fileIndex, i => {
			const f = state.files[i]
			return !f || fileFinished(state, f.path)
		})
		if (next !== null) S.selectFile?.(next)
	}
}

// A preview is UI-only (never persisted or wired): its single contents ride inline via previewContents; contentHash is unused - previews are never approved.
async function readPreviewFile(path: string): Promise<PreviewFile | null> {
	try {
		const body = await fetchPreviewFile(path)
		return {
			path,
			hasHunks: false,
			contentHash: '',
			changeKind: 'modified',
			added: 0,
			removed: 0,
			previewContents: body.contents,
		}
	} catch {
		toast('Could not open file')
		return null
	}
}
