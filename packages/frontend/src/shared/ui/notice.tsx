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
	// The sheet's rule when it is more than a note: `ink` for a toast over the
	// page, `red` for a refusal.
	rule?: 'ink' | 'red' | undefined
	// The dismiss click, so the caller can tell a key's activation (detail 0) from a press.
	onDismiss?: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined
	children?: ReactNode
} & Pick<ComponentPropsWithRef<'div'>, 'role'>

const RULE_STYLE = { ink: notice.inkRule, red: notice.redRule } as const

// A notice: what happened in one lead sentence, then what it means. The tone's
// square is decoration (the words say it). A role (status, alert) is the
// caller's: only the caller knows whether this notice is news.
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
