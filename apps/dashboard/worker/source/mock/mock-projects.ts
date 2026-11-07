import infra12 from './diffs/infra-12.diff?raw'
import paymentsApi57 from './diffs/payments-api-57.diff?raw'
import paymentsApi60 from './diffs/payments-api-60.diff?raw'
import storefront128 from './diffs/storefront-128.diff?raw'
import storefront131 from './diffs/storefront-131.diff?raw'

import type { ProjectRef, ReviewSummary } from '@syneva/contracts/projects'

export type MockReview = Omit<ReviewSummary, 'updatedAt' | 'churn'> & {
	minutesAgo: number
	diff: string
}

export type MockProject = {
	project: ProjectRef
	reviews: readonly MockReview[]
}

export const MOCK_PROJECTS: readonly MockProject[] = [
	{
		project: { owner: 'acme', repo: 'storefront' },
		reviews: [
			{
				number: 128,
				title: 'Show delivery estimates in the cart summary',
				author: 'mira-chen',
				base: 'main',
				head: 'feat/delivery-estimates',
				isDraft: false,
				minutesAgo: 35,
				diff: storefront128,
			},
			{
				number: 131,
				title: 'Remove the retired coupon banner',
				author: 'jonas-weber',
				base: 'main',
				head: 'chore/remove-coupon-banner',
				isDraft: true,
				minutesAgo: 1570,
				diff: storefront131,
			},
		],
	},
	{
		project: { owner: 'acme', repo: 'payments-api' },
		reviews: [
			{
				number: 57,
				title: 'Retry failed webhook deliveries with exponential backoff',
				author: 'sam-okafor',
				base: 'main',
				head: 'feat/webhook-retries',
				isDraft: false,
				minutesAgo: 190,
				diff: paymentsApi57,
			},
			{
				number: 60,
				title: 'Rename the ledger package to accounting',
				author: 'mira-chen',
				base: 'main',
				head: 'refactor/accounting-package',
				isDraft: false,
				minutesAgo: 2930,
				diff: paymentsApi60,
			},
		],
	},
	{
		project: { owner: 'acme', repo: 'infra' },
		reviews: [
			{
				number: 12,
				title: 'Run preview environments on a smaller instance class',
				author: 'lena-park',
				base: 'main',
				head: 'ops/preview-sizing',
				isDraft: false,
				minutesAgo: 310,
				diff: infra12,
			},
		],
	},
	{ project: { owner: 'acme', repo: 'docs' }, reviews: [] },
]
