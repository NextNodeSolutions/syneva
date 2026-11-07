import { matchPath } from '@syneva/contracts/paths'

import { PAGE_ROUTES } from './page-routes'

export function isReviewPath(pathname: string): boolean {
	return matchPath(PAGE_ROUTES.review, pathname) !== null
}
