import { currentSplittable } from '@entities/review/file/contents'
import { restorePendingComposerFocus } from '@features/manage-comment/composer'
import {
	handleDiffSelection,
	handleLineNumberClick,
} from '@features/manage-comment/selection'

import { renderAnnotation } from './annotations'
import { diffCtx } from './context'
import { createDiffHeader, headerActions } from './file-header'
import { scheduleOverviewRuler } from './overview-ruler'
import { D } from './runtime'

import type { AnnotationMeta } from '@entities/review/annotations'
import type { FileDiffOptions } from '@pierre/diffs'
import type { DiffView } from './diff-key'

// Preview reads as a plain file: remap @pierre's addition styling to its CONTEXT (unchanged)
// styling - row tint, gutter cell bg, and gutter number color all to the neutral context values -
// so a one-sided render of an unchanged file isn't all-green. These must be set INSIDE @pierre's
// shadow (via unsafeCSS below): the context vars they reference only exist there, so a host-level
// override referencing them is invalid and silently reverts.
const PREVIEW_CSS =
	'[data-code]{--diffs-bg-addition-override:var(--diffs-bg-context);--diffs-bg-addition-emphasis-override:var(--diffs-bg-context);--diffs-bg-addition-number-override:var(--diffs-bg-context-gutter);--diffs-fg-number-addition-override:var(--diffs-fg-number)}'

// The @pierre render options for one instance. `renderHeaderMetadata` and `renderCustomHeader`
// are our own header builders (see file-header.ts).
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
		renderHeaderMetadata: headerActions,
		// Focus the composer after Pierre mounts its rows.
		onPostRender: (_node, instance, phase) => {
			if (instance !== D.instance) return
			if (phase === 'unmount') return
			requestAnimationFrame(restorePendingComposerFocus)
			if (!isPreviewing && isExpandedUnchanged) scheduleOverviewRuler()
		},
		// @pierre reserves a right-side gutter via `scrollbar-gutter: stable` on the code grid (for
		// a vertical scrollbar it hides) - drop it so rows fill the full width. PREVIEW_CSS (empty
		// unless previewing) neutralizes addition styling to context, in-shadow.
		unsafeCSS: `[data-code]{scrollbar-gutter:auto}${isPreviewing ? PREVIEW_CSS : ''}`,
		renderCustomHeader: createDiffHeader(isPreviewing),
	}
}
