import { revealThreadLines } from '@features/expand-context/expand'
import { attachDiffSelectionHandlers } from '@features/manage-comment/selection'
import {
	areOptionsEqual,
	DIFFS_TAG_NAME,
	FileDiff,
	VirtualizedFileDiff,
	Virtualizer,
} from '@pierre/diffs'
import { $ } from '@shared/lib/dom'
import { perfSpan } from '@shared/lib/perf'

import { annotations } from './annotations'
import { diffCtx } from './context'
import { cursorResync } from './cursor'
import { buildDiffMetadata } from './diff-metadata'
import { currentDiffView, diffOptions } from './diff-options'
import { diffWorkerPool, poolRenderOptions } from './diff-workers'
import { refreshDiffHeader } from './file-header'
import { clearOverviewRuler, scheduleOverviewRuler } from './overview-ruler'
import { releaseDiffInstance } from './runtime'
import { virtualNav } from './virtual-nav'

import type { AnnotationMeta } from '@entities/review/annotations'
import type { ReviewState } from '@entities/review/model'
import type { FileDiffMetadata, FileDiffOptions } from '@pierre/diffs'
import type { WorkerPoolManager } from '@pierre/diffs/worker'
import type { DiffView } from './types'

type ReviewFile = ReviewState['files'][number]
type DiffOptions = FileDiffOptions<AnnotationMeta, undefined>

// One kept instance per file; a NEW instance per file change, because Pierre keeps hunk expansions per instance across diffs (a reused instance would carry expansions over by hunk index).
type Surface = {
	key: string
	instance: FileDiff<AnnotationMeta>
	container: HTMLElement
	wrapper: HTMLElement
	options: DiffOptions
	// The brick the surface is cut to (brick-focus.ts), null for the whole file: a move to another cut starts it at its top.
	brickKey: string | null
}
let surface: Surface | null = null

// Pierre's surface choice: VirtualizedFileDiff for a very large file - it renders only the rows around the viewport, where a full render of a file that long blocks the page for seconds on every pass; measured on the file's longer side.
const VIRTUALIZE_FROM_LINES = 3000

function isVeryLarge(metadata: FileDiffMetadata): boolean {
	const lines = Math.max(
		metadata.additionLines.length,
		metadata.deletionLines.length,
	)
	return lines > VIRTUALIZE_FROM_LINES
}

function mountSurface(
	key: string,
	options: DiffOptions,
	pool: WorkerPoolManager,
	isVirtualized: boolean,
): Surface {
	releaseDiffInstance()
	const host = $('diff')
	const wrapper = document.createElement('div')
	const container = document.createElement(DIFFS_TAG_NAME)
	wrapper.append(container)
	host.replaceChildren(wrapper)
	const { D } = diffCtx()
	D.instance = isVirtualized
		? mountVirtualized({ host, wrapper, container }, options, pool)
		: new FileDiff(options, pool)
	return {
		key,
		instance: D.instance,
		container,
		wrapper,
		options,
		brickKey: null,
	}
}

type SurfaceDom = {
	host: HTMLElement
	wrapper: HTMLElement
	container: HTMLElement
}

function mountVirtualized(
	dom: SurfaceDom,
	options: DiffOptions,
	pool: WorkerPoolManager,
): VirtualizedFileDiff<AnnotationMeta> {
	const virtualizer = new Virtualizer()
	virtualizer.setup(dom.host, dom.wrapper)
	const instance = new VirtualizedFileDiff(
		options,
		virtualizer,
		undefined,
		pool,
	)
	diffCtx().D.virtual = virtualNav({
		virtualizer,
		instance,
		container: dom.container,
	})
	return instance
}

function isLive(current: Surface | null, key: string): current is Surface {
	return current?.key === key && current.instance === diffCtx().D.instance
}

// Hand changed options to a kept instance through Pierre's targeted APIs: an appearance flip only swaps theme CSS (setThemeType).
// Anything else replaces the options, and the render that follows must be forced (render() compares data, not options).
function applyOptions(kept: Surface, options: DiffOptions): boolean {
	if (areOptionsEqual(kept.options, options)) return false
	const { themeType } = options
	if (themeType && areOptionsEqual({ ...kept.options, themeType }, options)) {
		kept.instance.setThemeType(themeType)
		return false
	}
	kept.instance.setOptions(options)
	return true
}

export async function renderDiffInstance(
	file: ReviewFile,
	isCurrent: () => boolean,
): Promise<void> {
	if (!isCurrent()) return
	const endRender = perfSpan('diff:render')
	const host = $('diff')
	const view = currentDiffView()
	clearOverviewRuler()
	const metadata = buildDiffMetadata(file, view)
	const isVirtualized = isVeryLarge(metadata)
	const key = `${view.isPreviewing ? 'preview' : 'diff'}:${file.path}:${isVirtualized ? 'virtual' : 'full'}`
	const options = diffOptions(view)
	const pool = diffWorkerPool(poolRenderOptions(diffCtx().S.settings))
	const kept = isLive(surface, key) ? surface : null
	const { scrollTop: readerScrollTop } = host
	const isOptionsChanged = kept ? applyOptions(kept, options) : false
	const { D } = diffCtx()
	const brickKey = D.focus?.brick.key ?? null
	const current = {
		...(kept ?? mountSurface(key, options, pool, isVirtualized)),
		options,
		brickKey,
	}
	surface = current
	D.fileDiff = metadata
	current.instance.render({
		fileDiff: metadata,
		lineAnnotations: annotations(),
		fileContainer: current.container,
		containerWrapper: current.wrapper,
		forceRender: isOptionsChanged,
	})
	refreshDiffHeader(metadata, view.isPreviewing)
	host.scrollTop = kept?.brickKey === brickKey ? readerScrollTop : 0
	endRender({ path: file.path, isReused: Boolean(kept) })
	afterRender(view)
}

// What follows a pass: the open threads' folded lines opened, the selection handlers, the overview ruler, the cursor. The brick view's cut holds no collapsed run to open, nor the whole file's rows for the ruler to map.
function afterRender(view: DiffView): void {
	const isWholeDiff = !view.isPreviewing && !diffCtx().D.focus
	if (isWholeDiff) revealThreadLines()
	attachDiffSelectionHandlers()
	if (isWholeDiff && view.isExpandedUnchanged) scheduleOverviewRuler()
	requestAnimationFrame(cursorResync)
}
