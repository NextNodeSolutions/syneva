import { S, toast } from '@app/store'
import {
	currentFileOrNull,
	fileFinished,
	fileObjections,
} from '@entities/review/changes'
import { currentSplittable } from '@entities/review/file/contents'
import { isMarkdownPath } from '@entities/review/file/file-summary'
import { hasReviewedMaterial } from '@entities/review/file/reviewed'
import { persistSettings } from '@entities/settings/api'
import { applyAppearance } from '@entities/settings/settings'
import { approveCurrentFile } from '@features/decide-change/decisions'
import { openInEditor } from '@features/open-editor/open-editor'
import { render } from '@shared/lib/render-scheduler'
import { setMarkdownTheme } from '@shared/markdown'
import { D } from '@widgets/diff-view/runtime'

export function installFileActionBindings(): void {
	installLayoutBindings()
	installSignOffBindings()
}

function installLayoutBindings(): void {
	S.setStyle = style => {
		S.diffStyle = style
		void persistSettings({ settings: S.settings, diffStyle: S.diffStyle })
		void render()
	}
	S.setFileView = view => {
		S.fileView = view
		D.fileDiff = null
		void render()
	}
	S.applySettings = () => {
		void persistSettings({ settings: S.settings, diffStyle: S.diffStyle })
		applyAppearance(S.settings)
		setMarkdownTheme(S.settings.theme)
		void render()
	}
	S.openSettings = () => {
		S.settingsOpen = true
	}
	S.closeSettings = () => {
		S.settingsOpen = false
	}
}

function installSignOffBindings(): void {
	S.approveFile = () => {
		// fabState() hides the button without a current file; keeping the action a no-op means it can never reach currentFile(S.state?.files, S.preview, S.fileIndex)'s throw (same contract as openInEditor).
		if (!currentFileOrNull(S.state?.files, S.preview, S.fileIndex)) return
		void approveCurrentFile()
	}
	S.fabState = () => {
		if (S.overviewOpen || S.preview) return null
		const path = S.state?.files[S.fileIndex]?.path
		if (!path || fileFinished(S.state, path)) return null
		return fileObjections(S.state, path) ? 'changes' : 'clean'
	}
	S.isMarkdownFile = () => {
		const { state } = S
		const file =
			state?.mode === 'file' ? state.files[S.fileIndex] : undefined
		return !!file && isMarkdownPath(file.path)
	}
	S.hasReviewed = () => hasReviewedMaterial(S.state)
	S.toggleHideReviewed = () => {
		S.settings = { ...S.settings, hideReviewed: !S.settings.hideReviewed }
		void persistSettings({ settings: S.settings, diffStyle: S.diffStyle })
		void render()
		toast(
			S.settings.hideReviewed
				? 'Hide accepted changes on'
				: 'Hide accepted changes off',
		)
	}
	S.splitApplies = () =>
		currentSplittable(S.preview ?? S.state?.files[S.fileIndex])
	// The cursor (and S.selected) hold DISPLAY coordinates - replayed decisions renumber the rendered diff - so convert to the real file line before handing it to an external process.
	S.openInEditor = () => openInEditor()
}
