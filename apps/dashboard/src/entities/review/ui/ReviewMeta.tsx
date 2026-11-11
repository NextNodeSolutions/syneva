import { formatAge } from '@shared/lib/format-age'
import { useNow } from '@shared/lib/use-now'

import type { ReviewSummary } from '@syneva/contracts/projects'
import type { ReactElement } from 'react'

export function ReviewMeta({
	review,
}: {
	review: ReviewSummary
}): ReactElement {
	const now = useNow()
	const { number, author, head, base, updatedAt } = review
	return (
		<>
			#{number} · {author} · {head} → {base} · updated{' '}
			{formatAge(updatedAt, now)}
		</>
	)
}
