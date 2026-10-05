import { useStoreFields } from '@shared/lib/use-store-version'
import * as stylex from '@stylexjs/stylex'

import { chromeCtx } from '../context'

import { covers } from './desk-covers.styles'

import type { ReactElement } from 'react'

// Full-surface status layers: the refresh notice (a restarted desk may require a
// different UI bundle) and the desk-closed cover (one-way for the tab; polling
// continues so a same-origin restart can propose the refresh above).
export function DeskCovers(): ReactElement {
	const { S } = chromeCtx()
	useStoreFields('state', 'deskClosed', 'isRefreshRequired')
	return (
		<>
			{S.isRefreshRequired && (
				<div {...stylex.props(covers.notice)} role="status">
					<strong {...stylex.props(covers.noticeLead)}>
						Desk restarted.
					</strong>{' '}
					Finish pending actions and copy any unsaved text, then
					refresh this tab to reconnect.
				</div>
			)}
			{S.deskClosed && !S.isRefreshRequired && (
				<div {...stylex.props(covers.cover)} role="status">
					<div {...stylex.props(covers.card)}>
						<h2 {...stylex.props(covers.title)}>Desk closed.</h2>
						<p {...stylex.props(covers.paragraph)}>
							This desk left the hub. All review state is saved on
							disk; the attached agent was told the review ended.
						</p>
						<p {...stylex.props(covers.paragraph)}>
							Reopen it in the repo with{' '}
							<code {...stylex.props(covers.code)}>
								{`syneva open --session ${S.state ? S.state.session : ''}`}
							</code>
							, or go{' '}
							<a {...stylex.props(covers.link)} href="/">
								back to the dashboard
							</a>
							.
						</p>
					</div>
				</div>
			)}
		</>
	)
}
