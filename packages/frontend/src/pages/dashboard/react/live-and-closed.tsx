import { closedDesks } from '../closed'
import { ledgerContext } from '../ledger-context'
import { useHeldOrder } from '../use-held-order'

import { ClosedDesks } from './closed-desks'
import { DeskLedger } from './desk-ledger'
import { HoldList } from './hold-list'

import type { DeskClosed } from '@entities/hub/journal'
import type { Style } from '@shared/lib/cx'
import type { ReactElement } from 'react'
import type { DashboardState } from '../use-dashboard'
import type { LedgerGroup } from './desk-ledger'

// A page's live desks, in the groups it lists them by, then the desks closed before them that
// it keeps (`isKept`): the body Reviews, Plans and a repository's page share. The ledger holds
// its order while the reviewer is in it (use-held-order.ts).
export function LiveAndClosed({
	dashboard,
	groups,
	texts,
	isKept,
	css,
}: {
	dashboard: DashboardState
	groups: readonly LedgerGroup[]
	texts: { empty: string; closed: string }
	isKept: (closed: DeskClosed) => boolean
	css: Style
}): ReactElement {
	const held = useHeldOrder(groups, { isHeld: dashboard.isListHeld })
	const { events } = dashboard.journal
	return (
		<HoldList hold={dashboard.hold} css={css}>
			<DeskLedger
				groups={held}
				context={ledgerContext(dashboard)}
				emptyText={texts.empty}
			/>
			<ClosedDesks
				closed={closedDesks(events, dashboard.livePaths).filter(isKept)}
				events={events}
				now={dashboard.hub.now}
				title={texts.closed}
			/>
		</HoldList>
	)
}
