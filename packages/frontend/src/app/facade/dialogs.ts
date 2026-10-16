import { helpGroups } from '@app/keys'
import { isCurrentDesk } from '@app/poll'
import { prefsSaver, saver, S } from '@app/store'
import { resetReview, shutdownDesk } from '@entities/review/api'
import { flowIndex } from '@entities/review/changes'
import { reviewLineCount } from '@entities/review/file/file-summary'
import { sendReviewToAgent } from '@features/send-review/send'
import { $ } from '@shared/lib/dom'
import { render } from '@shared/lib/render-scheduler'
import {
	askConfirm,
	bindConfirm,
	confirmNo,
	confirmYes,
} from '@widgets/dialogs/confirm'
import { D } from '@widgets/diff-view/runtime'

import { toast } from '../store'

import type { ResetScope } from '@syneva/contracts/review'

function plural(count: number, noun: string): string {
	return `${count} ${noun}${count === 1 ? '' : 's'}`
}

// Files out of the flow - pure renames - stay out of the file and line totals so the numbers match the progress bar and the gate.
function reviewStats(): {
	files: number
	lines: number
	comments: number
	rejections: number
} {
	const { outOfFlow } = flowIndex(S.state, {
		distill: S.settings.hideReviewed,
	})
	const scope = (S.state?.files ?? []).filter(f => !outOfFlow.has(f.path))
	let lines = 0
	for (const f of scope) lines += reviewLineCount(f)
	return {
		files: scope.length,
		lines,
		comments: (S.state?.comments ?? []).filter(
			c => c.role === 'user' && c.status === 'open',
		).length,
		rejections: (S.state?.changes ?? []).filter(
			c => c.status === 'rejected',
		).length,
	}
}

function reviewReceipt(): string {
	const { files, lines, comments, rejections } = reviewStats()
	return [
		plural(files, 'file'),
		plural(lines, 'changed line'),
		comments ? plural(comments, 'comment') : '',
		rejections ? plural(rejections, 'rejected hunk') : '',
	]
		.filter(Boolean)
		.join(', ')
}

// An attached agent picks the review up the instant it is sent, so there is no taking it back - this is the moment to look and to leave an overall instruction for the whole review.
function openSendModal(message: string): void {
	S.sendMsg = message
	S.sendNote = ''
	S.sendOpen = true
	setTimeout(() => $('sendNote').focus(), 0) // focus lands after the modal is in the DOM
}

export function installDialogBindings(): void {
	bindConfirm(message => {
		S.confirmMsg = message
	})
	installSendBindings()
	installCloseBinding()
	installHelpBindings()
}

function installSendBindings(): void {
	S.promptFinish = () => {
		const { files, lines, comments, rejections } = reviewStats()
		const extras = [
			comments ? plural(comments, 'comment') : '',
			rejections ? plural(rejections, 'rejected hunk') : '',
		].filter(Boolean)
		const what = files === 1 ? 'the file' : `all ${files} files`
		const tail = extras.length ? extras.join(', ') : 'all clean'
		openSendModal(
			`You've reviewed ${what} - ${plural(lines, 'changed line')}, ${tail}. Send the review back to the agent?`,
		)
	}
	S.confirmSend = () => {
		openSendModal(
			`You're about to send your review: ${reviewReceipt()}. Send to the agent?`,
		)
	}
	S.sendConfirm = () => {
		const note = S.sendNote.trim()
		S.sendOpen = false
		void S.send?.(note)
	}
	S.sendCancel = () => {
		S.sendOpen = false
		S.sendNote = ''
	}
	installResetBinding()
}

function installResetBinding(): void {
	S.resetMenuOpen = false
	S.setResetMenu = open => {
		S.resetMenuOpen = open
	}
	S.reset = async scope => {
		const body = await resetReview(scope)
		if (!isCurrentDesk(body.serverInstanceId)) return
		S.state = body.state
		S.resetMenuOpen = false
		D.fileDiff = null
		void render()
		toast(RESET_TOASTS[scope])
	}
	installSendAction()
}

const RESET_TOASTS: Record<ResetScope, string> = {
	review: 'Reset review - notes kept',
	approved: 'Approved files reset',
	all: 'Reset all - review and notes',
}

const CLOSE_SAVE_FLUSH_MS = 800
const CLOSE_WINDOW_DELAY_MS = 250

// The browser Close ends the whole desk, not just the round; the server tells any parked agent listener ({kind:"closed"}) before exiting - `syneva stop` with its proper paperwork; state is saved continuously, so nothing else to hand over.
function installCloseBinding(): void {
	// One click loses the workspace, so it routes through the same destructive-action dialog the ⇧Q hotkey uses.
	S.confirmClose = () => {
		askConfirm(
			'Close the desk? Syneva stops; the review state is saved and the agent is told the review ended.',
			() => void S.closeDesk?.(),
		)
	}
	S.closeDesk = async () => {
		// Flush the trailing saves first so Close can't drop the freshest review mutations or preference (bounded - a wedged desk must still close).
		// Preferences only settle: a forced write would put this desk's copy back over a newer dashboard choice.
		await Promise.all([
			saver.drain(CLOSE_SAVE_FLUSH_MS),
			prefsSaver.settle(CLOSE_SAVE_FLUSH_MS),
		])
		// Paint the cover first: the desk dies within the request's grace window, and a refused script-close leaves the cover as the tab's terminal state.
		S.deskClosed = true
		try {
			await shutdownDesk()
		} catch {
			/* the desk dies within the request grace window either way; the cover already shows */
		}
		toast('Desk closed')
		// The desk opens its tab via the OS opener, so script-close is usually refused: harmless where it works, invisible where it doesn't - the cover already shows.
		setTimeout(() => window.close(), CLOSE_WINDOW_DELAY_MS)
	}
}

// Post only the reviewer-owned slice, never the whole (multi-MB) ReviewState.
function installSendAction(): void {
	S.send = sendReviewToAgent
}

function installHelpBindings(): void {
	S.helpGroups = helpGroups
	S.confirmYes = confirmYes
	S.confirmNo = confirmNo
}
