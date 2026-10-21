// GET /logout: one button, since signing out is a POST (a cross-site link must not sign anyone
// out); the Hub page can link here, and the device page's "not you?" with `?next=` its code, where
// sign-in lands after.
import { WEB_PATHS } from '@syneva/contracts/web'

import { ARROW, crumbs, escapeHtml, page } from './shell.js'

export function signOutPage(email: string | null, next = '/'): string {
	const who = email ? ` as <code>${escapeHtml(email)}</code>` : ''
	const back = `<input type="hidden" name="next" value="${escapeHtml(next)}">`
	return page({
		title: 'Sign out · Syneva',
		body: `<div>${crumbs('Sign out')}
<h1>Sign out of this browser?</h1>
<p class="lede">You are signed in${who}. Your paired hubs stay paired and keep running; sign in again to see them.</p>
<form method="post" action="${WEB_PATHS.logout}">${back}<button class="btn" type="submit">Sign out${ARROW}</button></form></div>`,
	})
}
