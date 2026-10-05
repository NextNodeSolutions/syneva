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

// Preview reads as a plain file: remap @pierre's addition styling to its CONTEXT (unchanged)
// styling - row tint, gutter cell bg, and gutter number color all to the neutral context values -
// so a one-sided render of an unchanged file isn't all-green. These must be set INSIDE @pierre's
// shadow (via unsafeCSS below): the context vars they reference only exist there, so a host-level
// override referencing them is invalid and silently reverts.
const PREVIEW_CSS =
	'[data-code]{--diffs-bg-addition-override:var(--diffs-bg-context);--diffs-bg-addition-emphasis-override:var(--diffs-bg-context);--diffs-bg-addition-number-override:var(--diffs-bg-context-gutter);--diffs-fg-number-addition-override:var(--diffs-fg-number)}'

// The cold-open stages the bench reads (shared/lib/perf.ts): rows on screen, then rows carrying
// token colors. Without a worker pool, Pierre paints nothing until its shared highlighter holds the
// theme, and paints plain rows only while the file's grammar is still loading - so on a cold open
// both stages usually land together. Pierre exposes no "highlighted" signal: a colored token is
// read as a row span with an inline style, which holds while `useCSSClasses` stays off.
// Only the first landing of each stage matters.
function stampPaint(container: HTMLElement): void {
	if (perfFirst('render:colored')) return
	if (!perfFirst('render:painted')) perfMark('render:painted')
	if (container.shadowRoot?.querySelector('[data-line]>span[style]'))
		perfMark('render:colored')
}

// The two render flags of the pass, read fresh from the store (see DiffView).
export function currentDiffView(): DiffView {
	const { S } = diffCtx()
	return {
		isPreviewing: !!S.preview,
		isExpandedUnchanged: S.settings.unchangedLines === 'expand',
	}
}

// Focus the composer after Pierre mounts its rows. A module-level function, like every callback
// below: the options must compare equal across passes (areOptionsEqual) for the instance to keep
// its render, so no callback may be a fresh closure.
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

// The @pierre render options for one instance. The header is our own (file-header.ts): Pierre
// slots its host, the render pass fills it.
export function diffOptions(
	view: DiffView,
): FileDiffOptions<AnnotationMeta, undefined> {
	const { isPreviewing, isExpandedUnchanged } = view
	return {
		// The code theme is the user's pick regardless of appearance (the settings dropdown groups
		// dark and light themes; mixing is allowed). Both slots get it - themeType only decides
		// which slot @pierre reads plus its own chrome colors, which follow the appearance.
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
		// @pierre reserves a right-side gutter via `scrollbar-gutter: stable` on the code grid (for
		// a vertical scrollbar it hides) - drop it so rows fill the full width. PREVIEW_CSS (empty
		// unless previewing) neutralizes addition styling to context, in-shadow.
		unsafeCSS: `[data-code]{scrollbar-gutter:auto}${isPreviewing ? PREVIEW_CSS : ''}`,
		renderCustomHeader: slotDiffHeader,
	}
}
