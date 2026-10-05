import {
	currentFileComments,
	currentFileOrNull,
} from '@entities/review/changes'
import { buildComposer } from '@features/manage-comment/composer'
import { cx } from '@shared/lib/cx'
import { count, deskControl } from '@shared/ui/desk-control.styles'
import { iconHtml } from '@shared/ui/icon-html'
import { icon } from '@shared/ui/icon.styles'
import { tip } from '@shared/ui/tip.styles'
import { control } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { diffCtx } from '../context'

import { buildCommentThread } from './comment-thread'
import { annotation } from './comment-thread.styles'
import { fileComments } from './file-comments.styles'

import type { ThreadMeta } from '@entities/review/annotations'
import type { StaticStyle } from '@shared/lib/cx'

// ── Whole-file comments (the file header's comment thread) ───────────────────
// The desk hosts comments addressed to a file as a whole alongside the line threads: a comment
// icon in the guide bar (guided desks; the file header's own button on unguided ones) toggles a
// composer with the same Ask / Request change intents, and the file's whole-file comments render
// as one thread under the file header (like the unanchored strip, an annotation-family card).
// Thread derivation and the composer toggles live here; the composer lifecycle itself is
// composer.ts's.

// The current file's whole-file comments as one thread (all file comments share the single
// file-level anchor, so there is exactly one). Null when the file has none.
export function fileThreadMeta(): ThreadMeta | null {
	const comments = currentFileComments(
		diffCtx().S.state,
		currentFileOrNull(
			diffCtx().S.state?.files,
			diffCtx().S.preview,
			diffCtx().S.fileIndex,
		),
	)
	if (!comments.length) return null
	const [first] = comments
	if (!first) return null
	return {
		type: 'thread',
		path: first.path,
		side: first.side,
		lineNumber: first.lineNumber,
		status: comments.some(c => c.status === 'open') ? 'open' : 'resolved',
		comments,
		fileLevel: true,
	}
}

// Is the whole-file comment worth surfacing on this desk? A single-file desk (`syneva file
// <path>`) puts every comment on the one file already, so a file-level scope adds nothing -
// the trigger hides there (any existing whole-file threads keep rendering).
export function fileCommentsEnabled(): boolean {
	return diffCtx().S.state?.mode !== 'file'
}

// Where a trigger stands: inside the diff header's row (a quiet square among the header's
// icons), in the oversized card's head, or in the markdown strip's bar (a tile in both).
export type FileCommentPlacement = 'header' | 'card' | 'bar'

// The trigger's tone and size: petrol while its composer is open, wherever it stands; closed,
// quiet in the header and an outlined tile elsewhere.
function triggerStyle(
	placement: FileCommentPlacement,
	isOpen: boolean,
): StaticStyle {
	const isHeader = placement === 'header'
	const closedTone = isHeader ? control.quiet : control.outlined
	return [
		press.control,
		control.base,
		isOpen ? deskControl.ask : closedTone,
		deskControl.mini,
		isHeader ? deskControl.iconMini : fileComments.tile,
		tip.host,
	]
}

// The icon-only trigger (count badge when the file has open comments). Shared by the file
// header, the oversized card and the markdown strip; the guide bar's twin is React
// (widgets/chrome). Every trigger carries data-file-comment-trigger, the hook the composer's
// outside-click dismissal spares (app/facade/comment-thread.ts). The placement defaults to
// the header's while the header and the oversized card still call it bare.
export function fileCommentIconButton(
	placement: FileCommentPlacement = 'header',
): HTMLElement {
	const isOpen = diffCtx().S.fileComposerOpen
	const b = document.createElement('button')
	b.className = cx(triggerStyle(placement, isOpen))
	b.dataset.fileCommentTrigger = ''
	b.setAttribute('aria-pressed', String(isOpen))
	b.setAttribute(
		'data-tip',
		isOpen ? 'Close file comment (⇧C)' : 'Comment on file (⇧C)',
	)
	const glyph = iconHtml(
		'gly-comment',
		placement === 'header' ? icon.small : null,
	)
	// Open reviewer comments (agent replies join the thread but don't add objection weight -
	// the badge matches the blockers chip's count).
	const open = currentFileComments(
		diffCtx().S.state,
		currentFileOrNull(
			diffCtx().S.state?.files,
			diffCtx().S.preview,
			diffCtx().S.fileIndex,
		),
	).filter(c => c.status === 'open' && c.role !== 'agent').length
	b.innerHTML = open
		? `${glyph}<span class="${cx(count.base, count.corner)}">${open}</span>`
		: glyph
	b.addEventListener('click', () => diffCtx().S.toggleFileComposer?.())
	return b
}

// A new-comment composer card (as opposed to a reply, which the open thread hosts itself) -
// only when the file composer is up, nothing is being edited, and no open thread exists to
// host it. Mirrors the line composer's annotations() rule.
function isStandaloneComposerOpen(): boolean {
	if (!diffCtx().S.fileComposerOpen || diffCtx().S.editingCommentId)
		return false
	return fileThreadMeta()?.status !== 'open'
}

function standaloneComposer(isRuled: boolean): HTMLElement | null {
	if (!isStandaloneComposerOpen()) return null
	const wrap = document.createElement('div')
	wrap.className = cx(
		annotation.slot,
		annotation.composer,
		isRuled && fileComments.rule,
	)
	wrap.appendChild(buildComposer())
	return wrap
}

// The thread card for one whole-file file-comment group, with the attribute the blockers
// chip's jump targets ([data-file-comments] [data-file-thread], comment-jump.ts).
function threadBox(thread: ThreadMeta, isRuled: boolean): HTMLElement {
	const box = document.createElement('div')
	box.className = cx(
		annotation.slot,
		thread.status === 'resolved' && annotation.resolved,
		isRuled && fileComments.rule,
	)
	box.dataset.fileThread = String(thread.lineNumber)
	box.appendChild(buildCommentThread(thread))
	return box
}

// Where a section stands: under the file header, or on the oversized card (set off from the
// card's note), or leading the rendered markdown (markdownFileCommentStrip's own).
type SectionPlacement = 'header' | 'card' | 'document'

// The section under the file header (and on the oversized card) when there is anything to show:
// optional trigger bar, the file's whole-file thread, a standalone composer when one is open.
export function fileCommentSection(
	placement: Exclude<SectionPlacement, 'document'> = 'header',
): HTMLElement | null {
	if (!fileThreadMeta() && !isStandaloneComposerOpen()) return null
	return buildSection(null, placement)
}

// The markdown rendered view replaces the whole diff pane, so it carries its own trigger plus
// the same thread/composer surfaces. The guide bar remains visible above it, so its button is
// duplicated by design (GitHub's per-file comment buttons work the same way).
// Always renders while whole-file comments are enabled - the trigger must exist even with no
// comments yet. On a single-file desk a whole-file scope means nothing, so the strip shows
// itself only when data exists (no trigger).
export function markdownFileCommentStrip(): HTMLElement | null {
	if (!fileCommentsEnabled()) {
		if (!fileThreadMeta()) return null
		return buildSection(null, 'document')
	}
	return buildSection(markdownBar(), 'document')
}

// Head row for the markdown strip: trigger + the file it addresses (the strip sits alone at
// the top of the rendered content, where a bare icon would have no owner to lean on).
function markdownBar(): HTMLElement {
	const bar = document.createElement('div')
	bar.className = cx(fileComments.bar)
	bar.appendChild(fileCommentIconButton('bar'))
	const label = document.createElement('span')
	label.className = cx(fileComments.label)
	label.textContent = `Comment on ${
		currentFileOrNull(
			diffCtx().S.state?.files,
			diffCtx().S.preview,
			diffCtx().S.fileIndex,
		)
			?.path.split('/')
			.pop() ?? 'this file'
	}`
	bar.appendChild(label)
	return bar
}

// The section's parts in order - bar, thread, composer - each after the first opening on a rule.
// data-file-comments scopes the jump to its thread (comment-jump.ts).
function buildSection(
	bar: HTMLElement | null,
	placement: SectionPlacement,
): HTMLElement {
	const section = document.createElement('div')
	section.className = cx(
		fileComments.section,
		placement === 'card' && fileComments.onCard,
		placement === 'document' && fileComments.inDocument,
	)
	section.dataset.fileComments = ''
	if (bar) section.appendChild(bar)
	const thread = fileThreadMeta()
	if (thread) section.appendChild(threadBox(thread, section.hasChildNodes()))
	const composer = standaloneComposer(section.hasChildNodes())
	if (composer) section.appendChild(composer)
	return section
}
