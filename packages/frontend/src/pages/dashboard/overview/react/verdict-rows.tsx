import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import type { VerdictTotals } from '@entities/hub/journal-stats'
import type { ReactElement } from 'react'

const PERCENT = 100

// The verdicts of a set of rounds, one ruled line each: the verdict in words, its count and
// share, and a thin bar in its signal (green kept, red undone, amber requested). Each bar
// stands on its own line beside its label: the review's signals sit too close to one another
// to be told apart side by side in one stacked bar, so the words carry the identity and the
// colour only repeats it.
const verdictRows = stylex.create({
	list: { marginTop: '14px' },
	row: {
		display: 'grid',
		gridTemplateColumns: 'minmax(0, 1fr) auto',
		rowGap: '6px',
		paddingBlock: '9px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		fontSize: '12.5px',
	},
	count: {
		fontFamily: font['--mono'],
		fontSize: '12px',
		color: color['--muted'],
	},
	strong: { color: color['--ink'] },
	track: {
		gridColumn: '1 / -1',
		height: '3px',
		backgroundColor: color['--line'],
		overflow: 'hidden',
	},
	fill: { display: 'block', height: '100%', transformOrigin: 'left' },
	share: (fraction: number) => ({ transform: `scaleX(${fraction})` }),
	kept: { backgroundColor: color['--green'] },
	undone: { backgroundColor: color['--red'] },
	requested: { backgroundColor: color['--amber'] },
})

type VerdictLine = {
	key: string
	label: string
	count: number
	tone: stylex.StyleXStyles
}

function VerdictRow({
	line,
	all,
}: {
	line: VerdictLine
	all: number
}): ReactElement {
	const fraction = all ? line.count / all : 0
	return (
		<li data-enter="rise" {...stylex.props(verdictRows.row)}>
			<span>{line.label}</span>
			<span {...stylex.props(verdictRows.count)}>
				<span {...stylex.props(verdictRows.strong)}>{line.count}</span>
				{all ? ` · ${Math.round(fraction * PERCENT)}%` : ''}
			</span>
			<span {...stylex.props(verdictRows.track)} aria-hidden="true">
				<span
					{...stylex.props(
						verdictRows.fill,
						line.tone,
						verdictRows.share(fraction),
					)}
				/>
			</span>
		</li>
	)
}

export function VerdictRows({
	totals,
}: {
	totals: VerdictTotals
}): ReactElement {
	const all = totals.accepted + totals.rejected + totals.requestedChanges
	const lines: VerdictLine[] = [
		{
			key: 'kept',
			label: 'Kept',
			count: totals.accepted,
			tone: verdictRows.kept,
		},
		{
			key: 'undone',
			label: 'Undone',
			count: totals.rejected,
			tone: verdictRows.undone,
		},
		{
			key: 'requested',
			label: 'Changes requested',
			count: totals.requestedChanges,
			tone: verdictRows.requested,
		},
	]
	return (
		<ul {...stylex.props(verdictRows.list)}>
			{lines.map(line => (
				<VerdictRow key={line.key} line={line} all={all} />
			))}
		</ul>
	)
}
