import { currentSplittable } from '@entities/review/file/contents'
import { restorePendingComposerFocus } from '@features/manage-comment/composer'
import {
	handleDiffSelection,
	handleLineNumberClick,
} from '@features/manage-comment/selection'
import { perfFirst, perfMark } from '@shared/lib/perf'

import { renderAnnotation } from './annotations'
import { diffCtx } from './context'
import { slotDiffHeader } from './file-header'
import { scheduleOverviewRuler } from './overview-ruler'
import { D } from './runtime'

import type { AnnotationMeta } from '@entities/review/annotations'
import type { FileDiffOptions, PostRenderPhase } from '@pierre/diffs'
import type { DiffView } from './types'

// Preview reads as a plain file: remap Pierre's addition styling to its CONTEXT styling so a one-sided render of an unchanged file is not all-green.
// Must be set INSIDE Pierre's shadow (via unsafeCSS) - the context vars referenced exist only there, and a host-level override referencing them is invalid and silently reverts.
const PREVIEW_CSS =
	'[data-code]{--diffs-bg-addition-override:var(--diffs-bg-context);--diffs-bg-addition-emphasis-override:var(--diffs-bg-context);--diffs-bg-addition-number-override:var(--diffs-bg-context-gutter);--diffs-fg-number-addition-override:var(--diffs-fg-number)}'

function stampPaint(container: HTMLElement): void {
	if (perfFirst('render:colored')) return
	if (!perfFirst('render:painted')) perfMark('render:painted')
	if (container.shadowRoot?.querySelector('[data-line]>span[style]'))
		perfMark('render:colored')
}

export function currentDiffView(): DiffView {
	const { S } = diffCtx()
	return {
		isPreviewing: !!S.preview,
		isExpandedUnchanged: S.settings.unchangedLines === 'expand',
	}
}

function handlePostRender(
	container: HTMLElement,
	instance: object,
	phase: PostRenderPhase,
): void {
	if (instance !== D.instance) return
	if (phase === 'unmount') return
	stampPaint(container)
	requestAnimationFrame(restorePendingComposerFocus)
	const { isPreviewing, isExpandedUnchanged } = currentDiffView()
	if (!isPreviewing && isExpandedUnchanged) scheduleOverviewRuler()
}

export function diffOptions(
	view: DiffView,
): FileDiffOptions<AnnotationMeta, undefined> {
	const { isPreviewing, isExpandedUnchanged } = view
	return {
		// The code theme is the user's pick regardless of appearance (the settings dropdown groups dark and light themes; mixing is allowed); themeType only decides which slot Pierre reads plus its chrome colors.
		theme: {
			dark: diffCtx().S.settings.theme,
			light: diffCtx().S.settings.theme,
		},
		themeType:
			diffCtx().S.settings.appearance === 'light' ? 'light' : 'dark',
		diffStyle: currentSplittable(
			diffCtx().S.preview ??
				diffCtx().S.state?.files[diffCtx().S.fileIndex],
		)
			? diffCtx().S.diffStyle
			: 'unified',
		diffIndicators: isPreviewing
			? 'none'
			: diffCtx().S.settings.diffIndicators,
		expandUnchanged: isExpandedUnchanged,
		overflow: diffCtx().S.settings.overflow,
		hunkSeparators: diffCtx().S.settings.hunkSeparators,
		lineDiffType: diffCtx().S.settings.lineDiffType,
		enableLineSelection: true,
		renderAnnotation,
		onLineNumberClick: handleLineNumberClick,
		onLineSelectionStart: handleDiffSelection,
		onLineSelectionChange: handleDiffSelection,
		onLineSelected: handleDiffSelection,
		onLineSelectionEnd: handleDiffSelection,
		onPostRender: handlePostRender,
		unsafeCSS: `[data-code]{scrollbar-gutter:auto}${isPreviewing ? PREVIEW_CSS : ''}`,
		renderCustomHeader: slotDiffHeader,
	}
}
