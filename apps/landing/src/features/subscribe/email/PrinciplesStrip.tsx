import { PRINCIPLES } from '@entities/site/model/project'
import { twoDigits } from '@shared/lib/two-digits'

import { principles } from './coming.styles'

import type { ReactElement } from 'react'

const PER_ROW = 2

// The home's principles, closing the card two by two.
export function PrinciplesStrip(): ReactElement {
	const rows = [PRINCIPLES.slice(0, PER_ROW), PRINCIPLES.slice(PER_ROW)]
	return (
		<table
			role="presentation"
			cellPadding={0}
			cellSpacing={0}
			style={principles.table}
		>
			<tbody>
				{rows.map((row, rowIndex) => (
					<tr key={row.join()}>
						{row.map((principle, index) => (
							<td key={principle} style={principles.cell}>
								<span style={principles.index}>
									{twoDigits(rowIndex * PER_ROW + index + 1)}
								</span>
								{principle}
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	)
}
