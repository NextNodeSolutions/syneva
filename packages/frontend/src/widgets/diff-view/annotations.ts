import {
	currentComments,
	currentChanges,
	currentFile,
	groupLineComments,
	isFileComment,
	toDisplayLine,
	fromDisplayLine,
	currentFileOrNull,
} from '@entities/review/changes'
import { isUnanchored } from '@entities/review/changes'
import { acceptChange } from '@features/decide-change/decisions'
import { buildComposer } from '@features/manage-comment/composer'
import { cx } from '@shared/lib/cx'
import { deskControl } from '@shared/ui/desk-control.styles'
import { kbdHtml } from '@shared/ui/kbd-html'
import { control } from '@syneva/design-system/controls.styles'
import { kbd } from '@syneva/design-system/inline.styles'
import { press } from '@syneva/design-system/press.styles'

import { verdict } from './annotations.styles'
import { changeAnnotations } from './change-annotations'
import { buildCommentThread } from './comment-thread/comment-thread'
import { annotation } from './comment-thread/comment-thread.styles'
import { diffCtx } from './context'
import { D } from './runtime'
import { stableAnnotations } from './stable-annotations'

import type {
	AnnotationMeta,
	ChangeMeta,
	ThreadMeta,
} from '@entities/review/annotations'
import type {
	ChangeState,
	ReviewComment,
	ReviewState,
} from '@entities/review/model'
import type { StaticStyle } from '@shared/lib/cx'
import type { AnnotationInput } from './types'

type ReviewFile = ReviewState['files'][number]

// Comment groups keyed `side:rawLine` (see groupLineComments), whole-file comments excluded -
// they anchor to the file header (file-comments.ts), not a rendered line.
function commentGroups(): Map<string, ReviewComment[]> {
	return groupLineComments(
		currentComments(
			diffCtx().S.state,
			currentFileOrNull(
				diffCtx().S.state?.files,
				diffCtx().S.preview,
				diffCtx().S.fileIndex,
			),
		).filter(c => !isFileComment(c)),
	)
}

// Open threads whose anchor is gone render in the strip above the diff instead (an annotation at a
// non-existent line would silently never attach).
function isUnanchoredGroup(group: ReviewComment[], file: ReviewFile): boolean {
	return (
		group.some(c => c.status === 'open') &&
		group.some(c => isUnanchored(c, file))
	)
}

type ThreadAnnotations = {
	annotations: AnnotationInput[]
	/** the ids of changes an open thread already covers (see changeAnnotations) */
	coveredChangeIds: Set<string>
}

function threadAnnotations(
	groups: Map<string, ReviewComment[]>,
	file: ReviewFile,
): ThreadAnnotations {
	const threads: AnnotationInput[] = []
	const coveredChangeIds = new Set<string>()
	const changes = currentChanges(
		diffCtx().S.state,
		currentFileOrNull(
			diffCtx().S.state?.files,
			diffCtx().S.preview,
			diffCtx().S.fileIndex,
		),
	)
	for (const group of groups.values()) {
		const [first] = group
		if (!first) continue
		if (isUnanchoredGroup(group, file)) continue
		const change = changes.find(
			ch =>
				ch.status === 'pending' &&
				ch.side === first.side &&
				ch.lineNumber === first.lineNumber,
		)
		if (change) coveredChangeIds.add(change.id)
		// The annotation goes to @pierre in DISPLAY coordinates (it matches rendered gutter
		// numbers); the metadata keeps the raw line so thread actions filter comments correctly.
		threads.push({
			side: first.side,
			lineNumber: toDisplayLine(first.side, first.lineNumber, D.lineMap),
			metadata: {
				type: 'thread',
				path: first.path,
				side: first.side,
				lineNumber: first.lineNumber,
				status: group.some(c => c.status === 'open')
					? 'open'
					: 'resolved',
				comments: group,
				changeId: change?.id,
			},
		})
	}
	return { annotations: threads, coveredChangeIds }
}

// A new line comment (not a reply, not an edit) opens as its own composer annotation under the
// selected line. Suppressed only when an OPEN thread already sits there - that thread hosts the
// reply composer itself (in the diff, or in the unanchored strip). A resolved thread renders as a
// collapsed summary and never hosts a composer, so the new comment still needs its own row.
// diffCtx().S.selected is display space; groups are keyed raw.
function composerAnnotations(
	file: ReviewFile,
	groups: Map<string, ReviewComment[]>,
): AnnotationInput[] {
	if (!diffCtx().S.composerOpen || diffCtx().S.editingCommentId) return []
	const rawLine = fromDisplayLine(
		diffCtx().S.selected.side,
		diffCtx().S.selected.lineNumber,
		D.lineMap,
	)
	const group = groups.get(`${diffCtx().S.selected.side}:${rawLine}`)
	if (group?.some(c => c.status === 'open')) return []
	return [
		{
			side: diffCtx().S.selected.side,
			lineNumber: diffCtx().S.selected.lineNumber,
			metadata: {
				type: 'composer',
				side: diffCtx().S.selected.side,
				lineNumber: diffCtx().S.selected.lineNumber,
				path: file.path,
			},
		},
	]
}

// When a thread and a change land on the same display line, the decision bar must sit immediately
// under the hunk with the thread below it - annotations render in array order, so changes go
// first, the composer last. Reused across passes while unchanged (stable-annotations.ts).
export function annotations(): AnnotationInput[] {
	const file = currentFile(
		diffCtx().S.state?.files,
		diffCtx().S.preview,
		diffCtx().S.fileIndex,
	)
	const groups = commentGroups()
	const threads = threadAnnotations(groups, file)
	return stableAnnotations([
		...changeAnnotations(threads.coveredChangeIds),
		...threads.annotations,
		...composerAnnotations(file, groups),
	])
}

// The change a thread hangs off, for the verdict bar under it: its own change for a change
// annotation, its changeId for a thread, null when neither resolves.
function changeFor(c: ThreadMeta | ChangeMeta): ChangeState | null {
	const { changes } = diffCtx().requireState()
	if (c.type === 'change') return changes.find(x => x.id === c.id) ?? null
	if (!c.changeId) return null
	return changes.find(x => x.id === c.changeId) ?? null
}

// The verdict pair: Undo a plain tile, Keep the solid green. Each button names the decision it
// records in data-verdict, the hook wireVerdict binds (class names are hashed).
const VERDICT = [press.control, control.base, deskControl.mini]
const VERDICT_BUTTONS = `<button class="${cx(VERDICT, deskControl.undo)}" data-verdict="rejected">Undo${kbdHtml('⇧N')}</button><button class="${cx(VERDICT, deskControl.keep)}" data-verdict="accepted">Keep${kbdHtml('⇧Y', kbd.onFill)}</button>`

// The verdict bar under a change or a thread: the two decision buttons, wired by wireVerdict below.
function verdictBar(placement: StaticStyle): HTMLElement {
	const bar = document.createElement('div')
	bar.className = cx(verdict.bar, placement)
	bar.innerHTML = VERDICT_BUTTONS
	return bar
}

// `a` is @pierre/diffs' annotation callback argument (loose by contract); the
// metadata we tucked into it is our own typed AnnotationMeta.
export function renderAnnotation(a: { metadata: AnnotationMeta }): HTMLElement {
	const c = a.metadata
	// A new-comment composer injected under the selected line (reply/edit render inside a
	// thread instead - see buildCommentThread).
	if (c.type === 'composer') {
		const el = document.createElement('div')
		el.className = cx(annotation.slot, annotation.composer)
		el.appendChild(buildComposer())
		return el
	}
	const change = changeFor(c)
	const el = document.createElement('div')
	el.className = cx(
		annotation.slot,
		c.type === 'thread' && c.status === 'resolved' && annotation.resolved,
	)
	// A bare change pins its bar over the line it decides; a thread that covers one takes the
	// bar in flow above its first message, so the two never overlap.
	if (c.type === 'change') el.appendChild(verdictBar(verdict.pinned))
	else {
		if (change) el.appendChild(verdictBar(verdict.aboveThread))
		el.appendChild(buildCommentThread(c))
	}
	wireVerdict(el, change)
	return el
}

// The verdict bar's two buttons act on the change the annotation sits on, when there is one.
function wireVerdict(el: HTMLElement, change: ChangeState | null): void {
	const accept = el.querySelector<HTMLButtonElement>(
		'[data-verdict="accepted"]',
	)
	const reject = el.querySelector<HTMLButtonElement>(
		'[data-verdict="rejected"]',
	)
	if (!change || !accept || !reject) return
	accept.addEventListener(
		'click',
		() => void acceptChange(change.id, 'accepted'),
	)
	reject.addEventListener(
		'click',
		() => void acceptChange(change.id, 'rejected'),
	)
}
