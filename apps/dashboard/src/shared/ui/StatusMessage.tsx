import * as stylex from '@stylexjs/stylex'

import { statusMessage } from './status-message.styles'

import type { ReactElement, ReactNode } from 'react'

type StatusTone = 'neutral' | 'error'

const ROLES = {
	neutral: 'status',
	error: 'alert',
} as const satisfies Record<StatusTone, 'status' | 'alert'>

type StatusMessageProps = {
	title: string
	tone?: StatusTone
	children?: ReactNode
}

export function StatusMessage({
	title,
	tone = 'neutral',
	children,
}: StatusMessageProps): ReactElement {
	return (
		<div {...stylex.props(statusMessage.box)} role={ROLES[tone]}>
			<p
				{...stylex.props(
					statusMessage.title,
					tone === 'error' && statusMessage.error,
				)}
			>
				{title}
			</p>
			{children && (
				<p {...stylex.props(statusMessage.detail)}>{children}</p>
			)}
		</div>
	)
}
