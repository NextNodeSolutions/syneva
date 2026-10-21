import { lazy, Suspense } from 'react'

import { isHeldOff } from '@entities/hub/held'
import { useStoreFields } from '@shared/lib/use-store-version'
import * as stylex from '@stylexjs/stylex'

import { chromeCtx } from '../context'
import { deskCover, deskNotice } from '../layout'

import { ClosedCover } from './closed-cover'
import { covers } from './desk-covers.styles'

import type { ReactElement } from 'react'

// What the hub's stream can raise rides with the stream, off the cold open: app/main.tsx loads
// these chunks before it starts the stream, and only the stream moves S.hubStatus, so they are in
// the page before either can show (a chunk asked for once the hub is down could not load).
const HeldNotice = lazy(async () => {
	const module = await import('./held-notice')
	return { default: module.HeldNotice }
})
const SignedOutCover = lazy(async () => {
	const module = await import('./signed-out-cover')
	return { default: module.SignedOutCover }
})

export function DeskCovers(): ReactElement {
	const { S } = chromeCtx()
	useStoreFields(
		'state',
		'deskClosed',
		'isRefreshRequired',
		'hubStatus',
		'hubRetryAt',
	)
	const notice = deskNotice(S)
	const cover = deskCover(S)
	const held = isHeldOff(S.hubStatus) ? S.hubStatus : null
	return (
		<>
			<Suspense fallback={null}>
				{notice === 'held' && held && (
					<HeldNotice status={held} retryAt={S.hubRetryAt} />
				)}
				{cover === 'signed-out' && <SignedOutCover />}
			</Suspense>
			{notice === 'refresh' && (
				<div {...stylex.props(covers.notice)} role="status">
					<strong {...stylex.props(covers.noticeLead)}>
						Desk restarted.
					</strong>{' '}
					Finish pending actions and copy any unsaved text, then
					refresh this tab to reconnect.
				</div>
			)}
			{cover === 'closed' && (
				<ClosedCover session={S.state ? S.state.session : ''} />
			)}
		</>
	)
}
