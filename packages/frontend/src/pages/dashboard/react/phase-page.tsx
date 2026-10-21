import { HUB_PAGES } from '@entities/hub/api'
import { hubPlace } from '@entities/hub/hub-place'
import { ButtonLink } from '@shared/ui/button-link'
import { CommandChip } from '@shared/ui/command-chip'
import { RetryCountdown } from '@shared/ui/retry-countdown'

import { headCopy } from '../head-copy'

import { PageHead } from './page-head'

import type { ReactElement } from 'react'
import type { HeadCopy } from '../head-copy'
import type { HubPhase } from '../hub-phase'

const HEAD_ACTIONS: Record<NonNullable<HeadCopy['action']>, ReactElement> = {
	'start-hub': (
		<CommandChip command="syneva start" label="Command to start the hub" />
	),
	'sign-in': (
		<ButtonLink tone="primary" size="large" arrow href={HUB_PAGES.signIn}>
			Sign in
		</ButtonLink>
	),
}

// A page with nothing to list yet: the hub is still answering its first read, this browser is
// signed out, or the stream waits to try again (and says when).
export function PhasePage({ phase }: { phase: HubPhase }): ReactElement {
	const copy = headCopy(phase, hubPlace())
	const lede =
		'retryAt' in phase ? (
			<>
				{copy.lede} <RetryCountdown retryAt={phase.retryAt} />
			</>
		) : (
			copy.lede
		)
	return (
		<PageHead title={copy.title} lede={lede} isPending={copy.isPending}>
			{copy.action && HEAD_ACTIONS[copy.action]}
		</PageHead>
	)
}
