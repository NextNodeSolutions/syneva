import { revealThreadLines } from '@features/expand-context/expand'
import { attachDiffSelectionHandlers } from '@features/manage-comment/selection'
import { areOptionsEqual, DIFFS_TAG_NAME, FileDiff } from '@pierre/diffs'
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

import type { AnnotationMeta } from '@entities/review/annotations'
import type { ReviewState } from '@entities/review/model'
import type { FileDiffOptions } from '@pierre/diffs'
import type { WorkerPoolManager } from '@pierre/diffs/worker'

type ReviewFile = ReviewState['files'][number]
type DiffOptions = FileDiffOptions<AnnotationMeta, undefined>

// One FileDiff per file on screen - Pierre's model: keep the instance while its host stays
// mounted and call render() again when the data changes; Pierre skips what did not change (the
// same diff keeps its highlighted render, the same annotations keep their DOM, see
// diff-metadata.ts and stable-annotations.ts). Another file - or a preview - gets a fresh
// instance: Pierre keeps hunk expansions per instance across diffs, so one instance reused across
// files would carry expansions over by hunk index.
type Surface = {
	key: string
	instance: FileDiff<AnnotationMeta>
	container: HTMLElement
	wrapper: HTMLElement
	options: DiffOptions
}
let surface: Surface | null = null

function mountSurface(
	key: string,
	options: DiffOptions,
	pool: WorkerPoolManager,
): Surface {
	const { D } = diffCtx()
	const instance = new FileDiff(options, pool)
	const wrapper = document.createElement('div')
	wrapper.className = 'diff-wrap'
	const container = document.createElement(DIFFS_TAG_NAME)
	wrapper.append(container)
	D.instance?.cleanUp()
	$('diff').replaceChildren(wrapper)
	D.instance = instance
	return { key, instance, container, wrapper, options }
}

// The kept surface is live only while it is still this file's AND still the mounted instance:
// render.ts cleans the instance up whenever another view takes the pane.
function isLive(current: Surface | null, key: string): current is Surface {
	return current?.key === key && current.instance === diffCtx().D.instance
}

// Hand changed options to a kept instance through Pierre's targeted APIs: an appearance flip only
// swaps theme CSS (setThemeType); anything else replaces the options, and the render that follows
// must be forced (render() compares data, not options). Returns whether it must.
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
	// One stamp per diff pass (the bench reads interaction latency from it): the span covers the
	// metadata and Pierre's synchronous DOM build - tokenizing runs in its worker pool, and colors
	// that land later re-render through Pierre itself.
	const endRender = perfSpan('diff:render')
	const host = $('diff')
	const view = currentDiffView()
	const key = `${view.isPreviewing ? 'preview' : 'diff'}:${file.path}`
	clearOverviewRuler()
	const metadata = buildDiffMetadata(file, view)
	const options = diffOptions(view)
	const pool = diffWorkerPool(poolRenderOptions(diffCtx().S.settings))
	const kept = isLive(surface, key) ? surface : null
	const { scrollTop: readerScrollTop } = host
	const isOptionsChanged = kept ? applyOptions(kept, options) : false
	const current = kept
		? { ...kept, options }
		: mountSurface(key, options, pool)
	surface = current
	diffCtx().D.fileDiff = metadata
	current.instance.render({
		fileDiff: metadata,
		lineAnnotations: annotations(),
		fileContainer: current.container,
		containerWrapper: current.wrapper,
		forceRender: isOptionsChanged,
	})
	refreshDiffHeader(metadata, view.isPreviewing)
	// A kept instance updates in place and keeps the reader where they were; a new file starts at
	// the top.
	host.scrollTop = kept ? readerScrollTop : 0
	endRender({ path: file.path, isReused: Boolean(kept) })
	if (!view.isPreviewing) revealThreadLines()
	attachDiffSelectionHandlers()
	if (!view.isPreviewing && view.isExpandedUnchanged) scheduleOverviewRuler()
	requestAnimationFrame(cursorResync)
}
