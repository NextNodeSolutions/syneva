import { openEditor } from '@entities/review/api'
import { currentFileOrNull, fromDisplayLine } from '@entities/review/changes'
import { featureCtx } from '@features/context'
import { ApiError } from '@shared/api/client'

export async function openInEditor(): Promise<void> {
	const file = currentFileOrNull(
		featureCtx().S.state?.files,
		featureCtx().S.preview,
		featureCtx().S.fileIndex,
	)
	if (!file) {
		featureCtx().toast('No file selected')
		return
	}
	const selection = featureCtx().cursorSelection() ?? featureCtx().S.selected
	const lineNumber = fromDisplayLine(
		selection.side,
		selection.lineNumber,
		featureCtx().lineMap(),
	)
	try {
		const reply = await openEditor({ path: file.path, lineNumber })
		const failure = reply.error ?? 'Could not open editor'
		featureCtx().toast(reply.ok ? 'Opened in editor' : failure)
	} catch (error) {
		// A refusal carries the hub's sentence for the reviewer: the editor command to fix, or,
		// from the web, that a file opens only in an editor its machine's settings name.
		featureCtx().toast(
			error instanceof ApiError ? error.message : 'Could not open editor',
		)
	}
}
