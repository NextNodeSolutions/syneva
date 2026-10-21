import '@syneva/design-system/fonts.css'
import './desk.css'
import '@shared/markdown/prose.css'
import { createRoot } from 'react-dom/client'

import { adoptDeskStatus } from '@app/desk-instance'
import { installCommentBindings } from '@app/facade/comment-thread'
import { installDialogBindings } from '@app/facade/dialogs'
import { installDomainFeedbackBindings } from '@app/facade/domain-feedback'
import { installGuideBindings } from '@app/facade/guide-bar'
import { installGuideDomainBindings } from '@app/facade/guide-domain'
import { installNavigationBindings, warmNextFile } from '@app/facade/navigate'
import { installNotesBindings } from '@app/facade/notes'
import { installProjectTreeBindings } from '@app/facade/project-tree'
import { installFileActionBindings } from '@app/facade/review-header'
import { installKeys } from '@app/keys'
import { fetchState } from '@entities/review/api'
import { deskName } from '@entities/review/desk-name'
import { fetchTree } from '@entities/review/file/api'
import { repoBlobUrl } from '@entities/review/file/api'
import { defaultFileView } from '@entities/review/file/file-summary'
import { guideInputs, hasGuide } from '@entities/review/guide/guide'
import { fetchPrefs } from '@entities/settings/api'
import { applyAppearance, DEFAULT_SETTINGS } from '@entities/settings/settings'
import { deferRender, render } from '@pages/desk/render'
import { observeDeskAnswers } from '@shared/api/client'
import { $ } from '@shared/lib/dom'
import { setMarkdownTheme } from '@shared/markdown'
import { configureMarkdownRuntime } from '@shared/markdown/runtime-config'
import { ensureIcons } from '@shared/ui/icons'
import { bindChromeCtx } from '@widgets/chrome/context'
import { setBaseTitle } from '@widgets/chrome/react/review-progress'
import { bindDiffCtx } from '@widgets/diff-view/context'
import { D } from '@widgets/diff-view/runtime'

import { bindFeaturePorts } from './feature-ctx'
import { App } from './react/app'
import { hearRequest, installRelayNoticeBindings } from './relay-notice'
import { persist, requireState, toast } from './store'
import { S } from './store'

import type { ApiError } from '@shared/api/client'

const FAB_REVEAL_SCROLL_PX = 140
bindFeaturePorts()
// Bound before the React root mounts and before any render or action: every desk render pass and diff-island mutation goes through this seam, which throws until app composition has bound it.
// D stays the plain holder because @pierre's element-identity checks break on a reactive proxy.
bindDiffCtx({ S, D, requireState, deferRender, persist, toast })
bindChromeCtx(S)
installKeys()
// Installed before the React tree mounts, so the first template evaluation already sees them.
installProjectTreeBindings()
installNavigationBindings()
installNotesBindings()
installGuideBindings()
installGuideDomainBindings()
installDomainFeedbackBindings()
installFileActionBindings()
installCommentBindings()
installDialogBindings()
installRelayNoticeBindings()

// What the desk's requests met is heard once for the whole tab, whichever action sent them: an
// answer at once (relay-notice.ts), a refusal through app/desk-relay.ts, off the first paint's path.
async function reportRefusal(error: ApiError, sentAt: number): Promise<void> {
	try {
		const relay = await import('@app/desk-relay')
		relay.noteRefusal(error, sentAt)
	} catch {
		/* a chunk that cannot load leaves the failure to the action that met it */
	}
}
observeDeskAnswers(({ sentAt, refusal }) => {
	if (refusal) void reportRefusal(refusal, sentAt)
	else hearRequest(null, sentAt)
})

createRoot($('root')).render(<App />)

ensureIcons()
configureMarkdownRuntime({
	getTheme: () => S.settings.theme,
	// The imperative surfaces repaint through the funnel; the React prose (the guide pane) re-renders on the tick.
	onLoaded: () => {
		S.markdownTick++
		void render()
	},
	onLoadError: () =>
		toast('Markdown rendering could not load. Reopen the file to retry.'),
	// The blob route is named only by the review-file API boundary - shared markdown receives the resolver injected here (repo-relative images rewrite to /blob).
	repoImageSrc: repoBlobUrl,
})
// Boot Pierre's highlight workers as soon as the review is known, so their boot (with the first file's grammar) overlaps the first contents fetch and the diff island's load; the island adopts the same pool singleton.
async function bootDiffWorkers(firstPaths: string[]): Promise<void> {
	try {
		const workers = await import('@widgets/diff-view/diff-workers')
		workers.diffWorkerPool(
			workers.poolRenderOptions(S.settings),
			firstPaths,
		)
	} catch {
		/* a boot failure only delays the first colored paint; the pools error path repaints */
	}
}

// The hub's stream starts once the first file is on its way to the screen, where the tab used to
// start polling: its module (the socket, the hub's store, the pulse decoder) loads then, off the
// first paint's path, with the notices it can raise (widgets/chrome/react/desk-covers.tsx): once
// the hub is down, no chunk loads. A chunk that cannot load leaves the tab as it was painted, and
// says so.
async function followHub(): Promise<void> {
	try {
		const [{ followDesk }] = await Promise.all([
			import('@app/desk-stream'),
			import('@widgets/chrome/react/held-notice'),
			import('@widgets/chrome/react/signed-out-cover'),
		])
		followDesk()
	} catch {
		toast(
			'Live updates could not load. Reload this tab to follow the agent.',
		)
	}
}

async function renderFirstFile(): Promise<void> {
	await render()
	warmNextFile()
}

// No top-level await: a lazy chunk that imports from this entry (the guide decoders, loaded during the first state fetch) would wait for the entry to finish evaluating while the entry waited for it.
async function boot(): Promise<void> {
	const [prefs, state, tree] = await Promise.all([
		fetchPrefs(),
		fetchState(),
		fetchTree(),
	])
	S.settings = { ...DEFAULT_SETTINGS, ...prefs.settings }

	if (prefs.diffStyle === 'split' || prefs.diffStyle === 'unified')
		S.diffStyle = prefs.diffStyle
	applyAppearance(S.settings) // font + size before first paint
	setMarkdownTheme(S.settings.theme)
	S.state = adoptDeskStatus(state)
	void bootDiffWorkers(
		S.state.files
			.slice(S.fileIndex, S.fileIndex + 1)
			.map(file => file.path),
	)
	S.projectFiles = tree.files ?? []
	S.lastBaseDiffHash = S.state.baseDiffHash
	const name = deskName(S.state)
	if (name) document.title = `Syneva - ${name}`
	setBaseTitle(document.title)
	S.selected = {
		side: S.state.changes[0]?.side ?? 'additions',
		lineNumber: S.state.changes[0]?.lineNumber ?? 1,
	}
	const firstFile = S.state.files.at(S.fileIndex)
	if (firstFile)
		S.fileView = defaultFileView(firstFile, S.settings.markdownView)
	if (hasGuide(guideInputs(S))) {
		S.overviewOpen = true
		S.sidebarTab =
			S.settings.sidebarDefault === 'walkthrough' ? 'walkthrough' : 'tree'
	}
	void renderFirstFile()
	// #diff is the persistent scroll container (x-ignore), so this listener is attached once and survives every re-render/file switch.
	$('diff').addEventListener('scroll', () => {
		S.diffScrolled = $('diff').scrollTop > FAB_REVEAL_SCROLL_PX
	})
	void followHub()
}

// A first load that fails leaves its trace, as an uncaught error does, and the tab says so. The
// desk's hub being offline is the strip's to say, and the stream reloads the tab once the hub is
// back (desk-stream.ts); any other failure asks for a refresh, as a reload that cannot read the
// review does (desk-adopt.ts), and nothing follows the hub for a review the tab never had.
async function start(): Promise<void> {
	try {
		await boot()
	} catch (error) {
		reportError(error)
		const relay = await import('@app/desk-relay').catch(() => null)
		if (relay?.isHubOffline(error)) await followHub()
		else S.isRefreshRequired = true
	}
}

void start()
