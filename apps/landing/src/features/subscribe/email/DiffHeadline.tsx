import { diff } from './diff.styles'

import type { ReactElement } from 'react'

type DiffHeadlineProps = {
	// Line 1, the reader's addition: petrol +, pale blue band.
	added: string
	// Line 2, the verdict: green check, mint band, its decided word in green.
	verdict: { before: string; decided: string; after: string }
}

// The hero's headline as an email can draw it: two table rows, a mono gutter, solid bands (no client paints the site's gradients alike).
export function DiffHeadline({
	added,
	verdict,
}: DiffHeadlineProps): ReactElement {
	return (
		<table
			role="presentation"
			cellPadding={0}
			cellSpacing={0}
			style={diff.table}
		>
			<tbody>
				<tr>
					<td style={diff.gutter}>
						<span style={diff.number}>1</span>
						<span style={diff.added}>+</span>
					</td>
					<td style={{ ...diff.line, ...diff.agentBand }}>{added}</td>
				</tr>
				<tr>
					<td colSpan={2} style={diff.spacer} />
				</tr>
				<tr>
					<td style={diff.gutter}>
						<span style={diff.number}>2</span>
						<span style={diff.checked}>✓</span>
					</td>
					<td style={{ ...diff.line, ...diff.humanBand }}>
						{verdict.before}{' '}
						<span style={diff.decided}>{verdict.decided}</span>{' '}
						{verdict.after}
					</td>
				</tr>
			</tbody>
		</table>
	)
}
