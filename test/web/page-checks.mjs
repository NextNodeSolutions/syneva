// The Worker's own pages under their policy (RFC 7): nothing loads but what a page is made of (its
// one inline sheet, by the hash of the sheet it actually serves), no script, no frame, no sniffing,
// no referrer; the frontend's shells never framed either.
import { createHash } from 'node:crypto'

import { WEB_PATHS } from '../../packages/contracts/dist/web.js'

import { HTTP_NOT_FOUND, HTTP_OK } from './statuses.mjs'

const SHEET = /<style>([\s\S]*?)<\/style>/

// Null when the page is under its policy; else what is missing, for the check's detail.
export function pagePolicyGap(response, text) {
	const policy = response.headers.get('content-security-policy') ?? ''
	const [, sheet = ''] = SHEET.exec(text) ?? []
	const hash = createHash('sha256').update(sheet).digest('base64')
	const wanted = [
		"default-src 'none'",
		`style-src 'sha256-${hash}'`,
		"frame-ancestors 'none'",
		"form-action 'self'",
		"base-uri 'none'",
	]
	const missing = wanted.filter(directive => !policy.includes(directive))
	if (/script-src/.test(policy)) missing.push('no script-src')
	if (response.headers.get('x-frame-options') !== 'DENY')
		missing.push('x-frame-options: DENY')
	if (response.headers.get('x-content-type-options') !== 'nosniff')
		missing.push('nosniff')
	if (response.headers.get('referrer-policy') !== 'no-referrer')
		missing.push('referrer-policy: no-referrer')
	if (!missing.length) return null
	return `${missing.join(', ')} (got ${policy})`
}

// A page fetched, its status and whether its policy holds.
export async function guardedPage(browser, route) {
	const response = await browser.fetch(route, {
		headers: { accept: 'text/html' },
	})
	const text = await response.text()
	return { response, text, gap: pagePolicyGap(response, text) }
}

export async function checkSignedOutPages({ report, browser }) {
	const login = await guardedPage(browser, WEB_PATHS.login)
	report.check(
		"the sign-in page loads only its own sheet: default-src 'none', the sheet's hash, no frame",
		login.response.status === HTTP_OK && !login.gap,
		login.gap ?? `${login.response.status}`,
	)
	const missing = await guardedPage(browser, '/nothing-here')
	report.check(
		'the not-found page is under the same policy',
		missing.response.status === HTTP_NOT_FOUND && !missing.gap,
		missing.gap ?? `${missing.response.status}`,
	)
}

export async function checkSignedInPages({ report, browser }) {
	const back = `${WEB_PATHS.device}?code=ABCD-EFGH`
	const out = await guardedPage(
		browser,
		`${WEB_PATHS.logout}?next=${encodeURIComponent(back)}`,
	)
	report.check(
		'the sign-out page is under the same policy, and keeps its `next` for sign-in',
		out.response.status === HTTP_OK &&
			!out.gap &&
			out.text.includes(`name="next" value="${back}"`),
		out.gap ?? `${out.response.status}`,
	)
	const shell = await browser.fetch('/reviews')
	await shell.body?.cancel()
	report.check(
		"a dashboard shell is never framed: frame-ancestors 'none', DENY, nosniff",
		shell.status === HTTP_OK &&
			shell.headers.get('content-security-policy') ===
				"frame-ancestors 'none'" &&
			shell.headers.get('x-frame-options') === 'DENY' &&
			shell.headers.get('x-content-type-options') === 'nosniff',
		`${shell.headers.get('content-security-policy')}`,
	)
}
