import { useMemo, useState } from 'react'

import { FileDiff, WorkerPoolContextProvider } from '@pierre/diffs/react'
import { StatusMessage } from '@shared/ui/StatusMessage'
import * as stylex from '@stylexjs/stylex'

import { DIFF_WORKER_POOL } from '../lib/diff-worker-pool'
import { readDiffFiles } from '../model/diff-files'

import { DiffToolbar } from './DiffToolbar'
import { FileIndex } from './FileIndex'
import { reviewCode } from './review-code.styles'

import type { ReactElement } from 'react'
import type { DiffStyle } from '../model/diff-files'

const HIGHLIGHTER_DEFAULTS = {}

export function ReviewCode({ patch }: { patch: string }): ReactElement {
	const files = useMemo(() => readDiffFiles(patch), [patch])
	const [diffStyle, setDiffStyle] = useState<DiffStyle>('unified')
	const options = useMemo(
		() => ({ diffStyle, themeType: 'light', stickyHeader: true }) as const,
		[diffStyle],
	)
	if (!files.length)
		return <StatusMessage title="This pull request changes no file." />
	return (
		<WorkerPoolContextProvider
			poolOptions={DIFF_WORKER_POOL}
			highlighterOptions={HIGHLIGHTER_DEFAULTS}
		>
			<div {...stylex.props(reviewCode.layout)}>
				<FileIndex files={files} />
				<div {...stylex.props(reviewCode.diffs)}>
					<DiffToolbar
						fileCount={files.length}
						diffStyle={diffStyle}
						onDiffStyleChange={setDiffStyle}
					/>
					{files.map(file => (
						<section
							key={file.anchor}
							id={file.anchor}
							{...stylex.props(reviewCode.file)}
						>
							<FileDiff
								fileDiff={file.metadata}
								options={options}
							/>
						</section>
					))}
				</div>
			</div>
		</WorkerPoolContextProvider>
	)
}
