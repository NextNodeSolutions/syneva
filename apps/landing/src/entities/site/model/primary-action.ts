import { LAUNCH_STAGE } from './project'
import { HOME_HREF, PAGES } from './site-map'

export const SIGNUP_ID = 'signup'

const SIGNUP_LABEL = 'Get notified'

export type Action = { href: string; label: string }

export function primaryAction(liveLabel: string, page: App.PageKind): Action {
	if (LAUNCH_STAGE === 'live')
		return { href: PAGES.getStarted.href, label: liveLabel }
	const signupPage = page === 'lost' ? HOME_HREF : ''
	return { href: `${signupPage}#${SIGNUP_ID}`, label: SIGNUP_LABEL }
}
