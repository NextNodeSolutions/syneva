import { saveReview } from '@entities/review/api'
import { reviewerSlice } from '@entities/review/save'
import { persistSettings } from '@entities/settings/api'
import { loadSettings } from '@entities/settings/settings'
import { reactive } from '@shared/lib/reactive'
import { createSaver } from '@shared/lib/saver'

import type { ReviewState } from '@entities/review/model'
import type { SavedPrefs } from '@entities/settings/api'
import type { Store } from './store-state'

const TOAST_MS = 2800

export const S: Store = reactive<Store>({
	state: null,
	projectFiles: [],
	expandedDirs: new Set<string>(),
	collapsedDirs: new Set<string>(),
	// Display preferences come from ~/.syneva/settings.json (fetched in main.ts init), not localStorage: the file follows the reviewer across browsers and hosts, an origin does not.
	diffStyle: 'split',
	fileIndex: 0,
	preview: null,
	awaitingAgent: false,
	agentActivity: null,
	agentListening: false,
	queuedQuestions: 0,
	queuedReviews: 0,
	lastBaseDiffHash: null,
	isRefreshRequired: false,
	// Polling continues, so a same-origin restart can still propose refresh via isRefreshRequired.
	deskClosed: false,
	selected: { side: 'additions', lineNumber: 1 },
	composerOpen: false,
	fileComposerOpen: false,
	toastMsg: '',
	golineBuffer: '',
	composerBody: '',
	editingCommentId: null,
	settings: loadSettings(),
	settingsOpen: false,
	settingsTab: 'settings',
	confirmMsg: '',
	sendOpen: false,
	sendMsg: '',
	sendNote: '',
	overviewOpen: false,
	sidebarTab: 'tree',
	treeDrawerOpen: false,
	fileView: 'rendered',
	diffScrolled: false,
	foldExpanded: new Set<string>(),
	loadedOversized: new Set<string>(),
	notesOpen: false,
	notesQuery: '',
	notesLens: 'all',
	notesCursor: 0,
	notesSearchTick: 0,
	notesAdvanceAfter: null,
	resetMenuOpen: false,
	domainId: null,
	guidePaneOpen: true,
	guideExpanded: new Set<string>(),
	guideReturn: [],
	markdownTick: 0,
	domainComposer: null,
	domainComposerBody: '',
})

export function requireState(): ReviewState {
	const { state } = S
	if (!state) throw new Error('review state read before the first fetch')
	return state
}

export function $(id: string): HTMLElement {
	const el = document.getElementById(id)
	if (!el) throw new Error(`missing element #${id}`)
	return el
}
let toastTimer: ReturnType<typeof setTimeout>
export function toast(t: string): void {
	S.toastMsg = t
	clearTimeout(toastTimer)
	toastTimer = setTimeout(() => {
		S.toastMsg = ''
	}, TOAST_MS)
}

export const saver = createSaver(
	() => reviewerSlice(requireState()),
	payload => saveReview(payload),
)
// There is no manual Save button, so every state mutation (decision, comment, stage/unstage,
// approval) MUST call persist() to write the review to ~/.syneva/<repoHash>/<session>/; saves
// coalesce: at most one in flight, rapid triggers collapse into a single trailing save.
export const persist = (): void => saver.trigger()

const currentPrefs = (): SavedPrefs => ({
	settings: S.settings,
	diffStyle: S.diffStyle,
})
// Each preferences write replaces the whole ~/.syneva/settings.json, so they share one saver
// too: one write in flight, then one trailing write of the newest choice, which lands last.
export const prefsSaver = createSaver(currentPrefs, prefs =>
	persistSettings(prefs),
)
export const persistPrefs = (): void => prefsSaver.trigger()
// A page that unloads never runs the trailing write: a choice still queued leaves at once, on
// a request that outlives the page. Nothing queued, nothing written.
export function flushPrefsOnLeave(): void {
	if (prefsSaver.isPending())
		void persistSettings(currentPrefs(), { keepalive: true })
}
