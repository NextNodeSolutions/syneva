import { Link, Text } from '@react-email/components'
import { twoDigits } from '@shared/lib/two-digits'

import { COMING } from '../model/coming'

import { coming } from './coming.styles'
import { caption } from './email.styles'

import type { ReactElement } from 'react'

// What launch day brings, as the site's numbered rows, each opening its page.
export function ComingList({
	title,
	origin,
}: {
	title: string
	origin: string
}): ReactElement {
	return (
		<>
			<Text style={caption}>{title}</Text>
			<table
				role="presentation"
				cellPadding={0}
				cellSpacing={0}
				style={coming.table}
			>
				<tbody>
					{COMING.map((page, index) => (
						<tr key={page.href} style={coming.row}>
							<td style={coming.indexCell}>
								{twoDigits(index + 1)}
							</td>
							<td style={coming.textCell}>
								<Link
									href={`${origin}${page.href}`}
									style={coming.title}
								>
									{page.title}
								</Link>
								<Text style={coming.blurb}>{page.blurb}</Text>
							</td>
							<td style={coming.arrowCell}>
								<Link
									href={`${origin}${page.href}`}
									style={coming.arrow}
								>
									→
								</Link>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</>
	)
}
