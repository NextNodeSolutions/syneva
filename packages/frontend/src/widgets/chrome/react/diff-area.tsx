import { useStoreFields } from '@shared/lib/use-store-version'
import { deskControl } from '@shared/ui/desk-control.styles'
import { Kbd } from '@shared/ui/kbd'
import { kbd } from '@shared/ui/kbd.styles'
import * as stylex from '@stylexjs/stylex'
import { control } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { chromeCtx } from '../context'

import { diffArea } from './diff-area.styles'

import type { ReactElement } from 'react'

// React owns the chrome; the diff renderer owns the contents of #diff and #ovr (the
// ruler shows itself by clearing `hidden` when the unchanged lines are expanded).
export function DiffArea(): ReactElement {
	const { S } = chromeCtx()
	useStoreFields(
		'state',
		'fileIndex',
		'preview',
		'overviewOpen',
		'settings',
		'diffScrolled',
	)
	const fab = S.diffScrolled ? (S.fabState?.() ?? null) : null
	const objections = fab === 'changes'
	return (
		<div {...stylex.props(diffArea.area)}>
			<div id="diff" {...stylex.props(diffArea.scroller)} />
			<div id="ovr" hidden {...stylex.props(diffArea.ruler)} />
			{fab && (
				<button
					{...stylex.props(
						press.control,
						control.base,
						deskControl.mini,
						objections ? deskControl.caution : deskControl.keep,
						diffArea.fab,
					)}
					onClick={() => S.approveFile?.()}
				>
					{objections ? 'Mark reviewed' : 'Approve'}
					<Kbd keys="⇧A" css={objections ? kbd.onTint : kbd.onFill} />
				</button>
			)}
		</div>
	)
}
