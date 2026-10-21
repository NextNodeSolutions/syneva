// The sign-in page (GET /login) and its states: the form, "check your inbox" once a link is on its
// way, the expired link, and a refusal said under the field (a malformed address, too many tries).
// It posts to the magic-link route without a script; the Worker answers a form with a redirect.
// The emailed link shows the `confirm` state: whose account it opens, and the button that posts it.
import { MAGIC_LINK_MINUTES, WEB_PATHS } from '@syneva/contracts/web'

import { ARROW, crumbs, escapeHtml, page, terminal } from './shell.js'

export type SignInState =
	| { kind: 'form'; next: string; error?: string | undefined }
	| { kind: 'sent' }
	| { kind: 'expired'; next: string }
	| { kind: 'confirm'; email: string; token: string }

const PAIRING_FIGURE = terminal({
	title: 'how a hub shows up here',
	lines: [
		'# on your machine, next to the repos',
		'syneva login',
		'# it prints a code: confirm it here, signed in',
	],
	caption:
		'This browser keeps a session cookie for 30 days, never your address.',
})

export function signInPage(state: SignInState): string {
	return page({
		title: 'Sign in · Syneva',
		body: `${bodyOf(state)}\n${PAIRING_FIGURE}`,
	})
}

function bodyOf(state: SignInState): string {
	if (state.kind === 'sent')
		return `<div>${crumbs('Sign in')}
<h1>Check your inbox.</h1>
<p class="lede">If the address is right, a sign-in link is on its way. It works once, for ${MAGIC_LINK_MINUTES} minutes, in any browser you open it in.</p>
<div class="acts"><a class="btn quiet" href="${WEB_PATHS.login}">Use another address</a></div></div>`
	if (state.kind === 'confirm') return confirmBody(state)
	if (state.kind === 'expired')
		return `<div>${crumbs('Sign in')}
<h1>That link no longer opens.</h1>
<p class="lede">A sign-in link works once, for ${MAGIC_LINK_MINUTES} minutes. Ask for a new one.</p>
${form(state.next)}</div>`
	return `<div>${crumbs('Sign in')}
<h1>Your hubs, from any browser.</h1>
<p class="lede">Type your address and follow the link we email: it signs this browser in. The desks you see here are the ones your paired hubs open.</p>
${form(state.next, state.error)}</div>`
}

function form(next: string, error?: string): string {
	const invalid = error
		? ' aria-invalid="true" aria-describedby="email-error"'
		: ''
	const said = error
		? `<p class="err" id="email-error" role="alert">${escapeHtml(error)}</p>`
		: ''
	return `<form method="post" action="${WEB_PATHS.magicLink}"><label for="email">Email address</label>
<input type="hidden" name="next" value="${escapeHtml(next)}">
<div class="row"><input id="email" name="email" type="email" autocomplete="email" spellcheck="false" autocapitalize="off" required autofocus${invalid}>
<button class="btn" type="submit">Email me a link${ARROW}</button></div>
${said}</form>`
}

// Nothing happens until the button: the address is said first, so a link someone else asked for
// (and sent to sign this browser in to their account) is seen for what it is.
function confirmBody(state: { email: string; token: string }): string {
	const email = `<code>${escapeHtml(state.email)}</code>`
	return `<div>${crumbs('Sign in')}
<h1>Sign in to Syneva?</h1>
<p class="lede">This link signs this browser in as ${email}. If you did not ask for it, or that is not your address, close this page: nothing happens until you press the button.</p>
<form method="post" action="${WEB_PATHS.authCallback}"><input type="hidden" name="token" value="${escapeHtml(state.token)}">
<button class="btn" type="submit">Sign in as ${email}${ARROW}</button></form></div>`
}
