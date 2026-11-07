import * as stylex from '@stylexjs/stylex'

import { fileIndex } from './file-index.styles'

import type { ReactElement } from 'react'

export function FilePath({ path }: { path: string }): ReactElement {
	const nameStart = path.lastIndexOf('/') + 1
	return (
		<span {...stylex.props(fileIndex.path)}>
			<span {...stylex.props(fileIndex.directory)}>
				{path.slice(0, nameStart)}
			</span>
			{path.slice(nameStart)}
		</span>
	)
}
