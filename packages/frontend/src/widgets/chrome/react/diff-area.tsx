import { useStoreFields } from '@shared/lib/use-store-version'

import { chromeCtx } from '../context'

import type { ReactElement } from 'react'

// React owns the chrome; the diff renderer owns the contents of #diff and #ovr.
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
	return (
		<div className="diff-area">
			<div id="diff" />
			<div className="ovr" id="ovr" />
			{fab && (
				<button
					className={`diff-fab${fab === 'changes' ? ' warn' : ''}`}
					onClick={() => S.approveFile?.()}
				>
					<span>
						{fab === 'changes' ? 'Mark Reviewed' : 'Approve'}
					</span>
					<kbd>⇧A</kbd>
				</button>
			)}
		</div>
	)
}
