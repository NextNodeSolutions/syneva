// The device page (GET /device), where the person confirms the code `syneva login` printed: the
// code typed in, the hub it pairs (its name and CLI version, as the CLI asked with) with Approve
// and Deny, and what happened. The CLI hears the answer on its next ask. Every state names the
// account a hub pairs to, with a way out for the wrong one: sign out, then back to the same code.
import { WEB_PATHS } from '@syneva/contracts/web'

import { ARROW, crumbs, escapeHtml, page, prose, terminal } from './shell.js'

export type DeviceState =
	| { kind: 'enter'; error?: string | undefined }
	| {
			kind: 'confirm'
			userCode: string
			hubName: string
			hubVersion: string
			// The approval proof (auth/approval-proof.ts) Approve posts.
			proof: string
			error?: string | undefined
	  }
	| { kind: 'approved'; hubName: string }
	| { kind: 'denied' }
	| { kind: 'closed'; reason: string }

const LOGIN_FIGURE = terminal({
	title: 'where the code comes from',
	lines: [
		'# on the machine whose hub you pair',
		'syneva login',
		'# To pair this hub (…), open … and confirm the code XXXX-XXXX.',
	],
	caption: 'A code lives ten minutes and pairs one hub, once.',
})

// `email` is the signed-in account's.
export function devicePage(state: DeviceState, email: string): string {
	return page({
		title: 'Pair a hub · Syneva',
		body: `<div>${crumbs('Pair a hub')}
${bodyOf(state, email)}
${accountLine(state, email)}</div>
${LOGIN_FIGURE}`,
	})
}

// A person signed in as someone else (a shared browser, a second account) signs out here; sign-in
// lands back on this code.
function accountLine(state: DeviceState, email: string): string {
	const back =
		state.kind === 'confirm'
			? `${WEB_PATHS.device}?code=${encodeURIComponent(state.userCode)}`
			: WEB_PATHS.device
	const signOut = `${WEB_PATHS.logout}?next=${encodeURIComponent(back)}`
	return `<p class="help" id="account">Signed in as <code>${escapeHtml(email)}</code>. Not you? <a href="${escapeHtml(signOut)}">Sign out</a> and sign in with the account this hub belongs to.</p>`
}

function bodyOf(state: DeviceState, email: string): string {
	if (state.kind === 'confirm') return confirm(state, email)
	if (state.kind === 'approved')
		return said(
			`${state.hubName} is paired.`,
			'Its desks show up on the dashboard as soon as its hub connects; the terminal says when.',
		)
	if (state.kind === 'denied')
		return said(
			'Denied.',
			'Nothing was paired: `syneva login` stops asking and says so.',
		)
	if (state.kind === 'closed')
		return said('This code no longer pairs anything.', state.reason)
	return enter(state.error)
}

function enter(error?: string): string {
	const invalid = error
		? ' aria-invalid="true" aria-describedby="code-error"'
		: ''
	const shown = error
		? `<p class="err" id="code-error" role="alert">${escapeHtml(error)}</p>`
		: ''
	return `<h1>Pair a hub with this account.</h1>
<p class="lede">Type the code <code>syneva login</code> printed in your terminal.</p>
<form method="get" action="${WEB_PATHS.device}"><label for="code">Code</label>
<div class="row"><input id="code" name="code" spellcheck="false" autocapitalize="characters" autocomplete="off" placeholder="XXXX-XXXX" required autofocus${invalid}>
<button class="btn" type="submit">Continue${ARROW}</button></div>
${shown}</form>`
}

function confirm(
	state: Extract<DeviceState, { kind: 'confirm' }>,
	email: string,
): string {
	const field = `<input type="hidden" name="userCode" value="${escapeHtml(state.userCode)}">`
	const proof = `<input type="hidden" name="confirm" value="${escapeHtml(state.proof)}">`
	const error = state.error
		? `<p class="err" role="alert">${escapeHtml(state.error)}</p>`
		: ''
	return `<h1>Pair ${escapeHtml(state.hubName)}?</h1>
<p class="lede">The hub on <code>${escapeHtml(state.hubName)}</code> (syneva ${escapeHtml(state.hubVersion)}) asked with the code <code>${escapeHtml(state.userCode)}</code>. Approve only if that is the code your terminal shows: the hub then pairs to <code>${escapeHtml(email)}</code>, shows its desks here, and this page acts on them as a local tab does.</p>
${error}<div class="acts"><form method="post" action="${WEB_PATHS.device}">${field}${proof}<input type="hidden" name="approve" value="1"><button class="btn" type="submit">Approve${ARROW}</button></form>
<form method="post" action="${WEB_PATHS.device}">${field}<input type="hidden" name="approve" value="0"><button class="btn quiet" type="submit">Deny</button></form></div>`
}

function said(heading: string, lede: string): string {
	return `<h1>${escapeHtml(heading)}</h1>
<p class="lede">${prose(lede)}</p>
<div class="acts"><a class="btn" href="/">All desks${ARROW}</a></div>`
}
