import { useMemo } from 'react'

import { StatusMessage } from '@shared/ui/StatusMessage'
import * as stylex from '@stylexjs/stylex'

import { matchDeskKey } from '../model/desk-keys'
import { readDiffFiles } from '../model/diff-files'
import { buildFileTree } from '../model/file-tree'
import { useDesk } from '../model/use-desk'

import { DeskBar } from './DeskBar'
import { DeskWorkspace } from './DeskWorkspace'
import { reviewDesk } from './review-desk.styles'

import type { ReviewCode } from '@syneva/contracts/projects'
import type { KeyboardEvent, ReactElement } from 'react'

// The desk hears its keys itself, so it takes the focus when it opens.
function focusDesk(node: HTMLDivElement | null): void {
	node?.focus({ preventScroll: true })
}

export function ReviewDesk({ code }: { code: ReviewCode }): ReactElement {
	const tree = useMemo(
		() => buildFileTree(readDiffFiles(code.diff, code.unavailableFiles)),
		[code.diff, code.unavailableFiles],
	)
	const desk = useDesk(tree)
	const runKey = (event: KeyboardEvent<HTMLDivElement>): void => {
		const command = matchDeskKey(event)
		if (!command || event.defaultPrevented) return
		event.preventDefault()
		desk.run(command)
	}
	return (
		<div
			ref={focusDesk}
			tabIndex={-1}
			onKeyDown={runKey}
			{...stylex.props(reviewDesk.desk)}
		>
			<DeskBar
				code={code}
				isTreeDrawerOpen={desk.state.isTreeDrawerOpen}
				onTreeDrawerToggle={desk.toggleTreeDrawer}
			/>
			{desk.activeFile ? (
				<DeskWorkspace tree={tree} desk={desk} file={desk.activeFile} />
			) : (
				<div {...stylex.props(reviewDesk.empty)}>
					<StatusMessage title="This pull request changes no file." />
				</div>
			)}
		</div>
	)
}
