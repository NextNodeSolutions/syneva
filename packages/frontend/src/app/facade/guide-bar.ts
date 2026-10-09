import { S } from '@app/store'
import {
	anyUnreviewed,
	currentFileName,
	firstGuideIndex,
	guideInputs,
	guideStale,
	hasGuide,
	nextFileIndex,
	showGuideBar,
	walkthroughRows,
} from '@entities/review/guide/guide'
import { render } from '@shared/lib/render-scheduler'

// guideInputs(S) is the one builder; these bindings read the store at each evaluation through it.

export function installGuideBindings(): void {
	S.walkthroughRows = () => walkthroughRows(guideInputs(S))
	S.hasGuide = () => hasGuide(guideInputs(S))
	S.showGuideBar = () => showGuideBar(guideInputs(S))
	S.guideStale = () => guideStale(guideInputs(S))
	S.curFileName = () => currentFileName(guideInputs(S))
	S.openOverview = () => {
		S.overviewOpen = true
		void render()
	}
	S.startGuided = () => {
		S.overviewOpen = false
		S.selectFile?.(firstGuideIndex(guideInputs(S)))
	}
	// The ACTIVE pane's sorting decides the order; the Overview is the position before the first file, so Next enters it and Prev lands on the last one.
	S.guideNext = () => S.stepInView?.(1)
	S.guidePrev = () => S.stepInView?.(-1)
	// Dim only when the review is fully signed off: while unreviewed work remains, next/prev stay live because they now seek it.
	S.guideAtStart = () => S.overviewOpen && !anyUnreviewed(guideInputs(S))
	S.guideAtLast = () =>
		!S.overviewOpen &&
		nextFileIndex(guideInputs(S), S.fileIndex) === null &&
		!anyUnreviewed(guideInputs(S))
}
