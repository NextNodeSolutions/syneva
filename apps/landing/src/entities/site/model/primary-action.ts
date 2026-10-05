import { LAUNCH_STAGE } from './project'
import { HOME_HREF, PAGES } from './site-map'

// The signup every page but the 404 closes with (the start band), by its
// anchor: this layer names it, the band carries it.
export const SIGNUP_ID = 'signup'

const SIGNUP_LABEL = 'Get notified'

export type Action = { href: string; label: string }

// Where a primary action leads. Once Syneva is live: the setup guide, in the
// caller's own words. Until then: the signup under one label, on the page
// itself, or on the home from the 404, which closes with none.
export function primaryAction(liveLabel: string, page: App.PageKind): Action {
	if (LAUNCH_STAGE === 'live')
		return { href: PAGES.getStarted.href, label: liveLabel }
	const signupPage = page === 'lost' ? HOME_HREF : ''
	return { href: `${signupPage}#${SIGNUP_ID}`, label: SIGNUP_LABEL }
}
