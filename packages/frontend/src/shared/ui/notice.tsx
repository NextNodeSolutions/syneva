import * as stylex from '@stylexjs/stylex'

import { Button } from './button'
import { CrossIcon } from './cross-icon'
import { notice } from './notice.styles'
import { touchTarget } from './touch-target.styles'

import type {
	ComponentPropsWithRef,
	MouseEvent,
	ReactElement,
	ReactNode,
} from 'react'

type NoticeTone = 'petrol' | 'green' | 'red' | 'neutral'

type NoticeProps = {
	tone: NoticeTone
	lead: ReactNode
	rule?: 'ink' | 'red' | undefined
	onDismiss?: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined
	children?: ReactNode
} & Pick<ComponentPropsWithRef<'div'>, 'role'>

const RULE_STYLE = { ink: notice.inkRule, red: notice.redRule } as const

export function Notice({
	tone,
	lead,
	rule,
	onDismiss,
	children,
	...region
}: NoticeProps): ReactElement {
	return (
		<div
			{...region}
			{...stylex.props(
				notice.root,
				onDismiss && notice.dismissible,
				rule && RULE_STYLE[rule],
			)}
		>
			<span
				{...stylex.props(notice.square, notice[tone])}
				aria-hidden="true"
			/>
			<div>
				<p {...stylex.props(notice.lead)}>{lead}</p>
				{children && <p {...stylex.props(notice.rest)}>{children}</p>}
			</div>
			{onDismiss && (
				<Button
					tone="quiet"
					size="small"
					square
					css={touchTarget.small}
					aria-label="Dismiss"
					onClick={onDismiss}
				>
					<CrossIcon />
				</Button>
			)}
		</div>
	)
}
