import { useStoreFields } from '@shared/lib/use-store-version'
import * as stylex from '@stylexjs/stylex'
import { chromeCtx } from '@widgets/chrome/context'

import { ProjectLevel } from './project-level'
import { reading } from './reading-surface.styles'

import type { ReactElement } from 'react'

// The reading surface: what the center shows in place of the code while the reviewer reads the guide's levels. The project level is the whole changeset; the levels below it open from there. Its controls answer their own Enter (data-guide-controls), so a focused domain row opens that domain, not the first one.
export function ReadingSurface(): ReactElement {
	const { S } = chromeCtx()
	useStoreFields('state', 'markdownTick')
	const { state } = S
	if (!state) return <></>
	return (
		<div
			{...stylex.props(reading.surface)}
			data-reading=""
			data-guide-controls=""
		>
			<ProjectLevel state={state} />
		</div>
	)
}
