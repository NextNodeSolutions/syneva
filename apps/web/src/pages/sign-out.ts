// GET /logout: one button, since signing out is a POST (a cross-site link must not sign anyone
// out); the Hub page can link here.
import { WEB_PATHS } from '@syneva/contracts/web'

import { ARROW, crumbs, escapeHtml, page } from './shell.js'

export function signOutPage(email: string | null): string {
	const who = email ? ` as <code>${escapeHtml(email)}</code>` : ''
	return page({
		title: 'Sign out · Syneva',
		body: `<div>${crumbs('Sign out')}
<h1>Sign out of this browser?</h1>
<p class="lede">You are signed in${who}. Your paired hubs stay paired and keep running; sign in again to see them.</p>
<form method="post" action="${WEB_PATHS.logout}"><button class="btn" type="submit">Sign out${ARROW}</button></form></div>`,
	})
}
