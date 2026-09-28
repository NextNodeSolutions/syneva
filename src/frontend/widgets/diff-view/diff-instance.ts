import { revealThreadLines } from '@features/expand-context/expand'
import { attachDiffSelectionHandlers } from '@features/manage-comment/selection'
import { FileDiff, DIFFS_TAG_NAME } from '@pierre/diffs'
import { $ } from '@shared/lib/dom'

import { annotations } from './annotations'
import { cursorResync } from './cursor'
import { buildDiffMetadata } from './diff-metadata'
import { diffOptions } from './diff-options'
import { clearOverviewRuler, scheduleOverviewRuler } from './overview-ruler'
import { D } from './runtime'

import type { ReviewState } from '@entities/review/model'
import type { DiffView } from './diff-key'

type ReviewFile = ReviewState['files'][number]
let renderedPath: string | undefined

export async function renderDiffInstance(
	file: ReviewFile,
	view: DiffView,
	isCurrent: () => boolean,
): Promise<void> {
	if (!isCurrent()) return
	const host = $('diff')
	const scrollTop =
		D.instance && renderedPath === file.path ? host.scrollTop : 0
	clearOverviewRuler()
	const metadata = buildDiffMetadata(file, view)
	const instance = new FileDiff(diffOptions(view))
	const wrapper = document.createElement('div')
	wrapper.className = 'diff-wrap'
	const container = document.createElement(DIFFS_TAG_NAME)
	wrapper.append(container)
	D.instance?.cleanUp()
	host.replaceChildren(wrapper)
	D.instance = instance
	D.fileDiff = metadata
	instance.render({
		fileDiff: metadata,
		lineAnnotations: annotations(),
		fileContainer: container,
		containerWrapper: wrapper,
	})
	host.scrollTop = scrollTop
	renderedPath = file.path
	if (!view.isPreviewing) revealThreadLines()
	attachDiffSelectionHandlers()
	if (!view.isPreviewing && view.isExpandedUnchanged) scheduleOverviewRuler()
	requestAnimationFrame(cursorResync)
}

export function detachInstance(): void {
	clearOverviewRuler()
	D.instance?.cleanUp()
	D.instance = null
	D.fileDiff = null
	D.lineMap = null
	renderedPath = undefined
}

export function disposeInstances(): void {
	detachInstance()
}
