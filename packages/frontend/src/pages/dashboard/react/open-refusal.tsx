import { HUB_PAGES } from '@entities/hub/api'
import { Notice } from '@shared/ui/notice'
import { TextLink } from '@shared/ui/text-link'
import * as stylex from '@stylexjs/stylex'

import { newReviewDialog } from './new-review-dialog.styles'
import { RefusalReason } from './refusal-reason'

import type { ReactElement, ReactNode } from 'react'
import type { OpenRefusal as Refusal } from '../use-open-desk'

// The refusal lands at the foot of a body that may scroll (the pr hint is long): bring it
// into view as it appears, or the reason would sit below the fold. Open the desk held focus
// and dropped it when it went busy (a disabled button cannot keep it): give it back, so the
// reviewer stays in the sheet and Enter tries again.
function revealRefusal(node: HTMLElement | null): void {
	if (!node) return
	node.scrollIntoView({ block: 'nearest' })
	if (document.activeElement && document.activeElement !== document.body)
		return
	node.closest('form')
		?.querySelector<HTMLElement>('button[type="submit"]')
		?.focus()
}

// What the notice says: the hub's own reason when it refused, what to check when it did not
// answer, what to do when its answer is not one this page reads, a way back in when this
// browser is signed out.
function refusalCopy(refusal: Refusal): { lead: string; rest: ReactNode } {
	if (refusal.kind === 'refused')
		return {
			lead: 'The hub did not open the desk.',
			rest: <RefusalReason reason={refusal.reason} />,
		}
	if (refusal.kind === 'unreachable')
		return {
			lead: 'The hub did not answer.',
			rest: 'Check that it is running, then try again.',
		}
	if (refusal.kind === 'unreadable')
		return {
			lead: 'The hub answered in a shape this page does not read.',
			rest: 'Reload the page: the hub may have been updated since it loaded.',
		}
	return {
		lead: 'This browser is signed out.',
		rest: (
			<TextLink href={HUB_PAGES.signIn} small>
				Sign in
			</TextLink>
		),
	}
}

// Why the hub did not open the desk, under the fields, announced as it appears.
export function OpenRefusal({ refusal }: { refusal: Refusal }): ReactElement {
	const copy = refusalCopy(refusal)
	return (
		<div ref={revealRefusal} {...stylex.props(newReviewDialog.refusal)}>
			<Notice tone="red" rule="red" role="alert" lead={copy.lead}>
				{copy.rest}
			</Notice>
		</div>
	)
}
