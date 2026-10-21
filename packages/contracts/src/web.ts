// The web (apps/web, RFC 0001, phase 2): what it serves beside the hub routes of routes.ts and
// the bridge of bridge.ts, and the shapes those routes speak. Sign-in is a magic link: the person
// types an address, the Worker emails a link, following it opens a session; the session is a
// cookie the browser carries and the Worker checks before any object is touched (RFC 6.3, R9).
// A hub pairs with `syneva login` (pairing.ts): the device page is where the person approves the
// code the CLI printed. Every page here is the Worker's own HTML, as the local hub's key page is
// core's: the bundle's shells stay the same on both sides.
import { HUB_PATHS } from './routes.js'

export const WEB_PATHS = {
	// GET: the sign-in page, a form posting to `magicLink`; `?next=<path>` where to land once
	// signed in (a same-origin path, anything else is dropped), `?sent=1` the "check your inbox"
	// state. The same path as the local hub's key page, so a signed-out answer points at one place.
	login: HUB_PATHS.login,
	// POST (same origin): ends the session and clears the cookie, then redirects to `login`.
	logout: HUB_PATHS.logout,
	// POST MagicLinkRequest: emails a sign-in link. Answers 202 whether or not the address has an
	// account (nothing to enumerate), 429 past the limits of RFC 6.1 F1 (3 per address per hour,
	// 10 per client address per hour, 2,000 per day), 400 on a malformed address.
	magicLink: '/auth/magic-link',
	// GET ?token=<token>: the link in the email. It changes nothing (a mail scanner's fetch spends
	// nothing): a page names the account the link signs in as, with one button that POSTs the
	// token here (same origin, the form field `token`). The POST takes it, one use within 15
	// minutes of the request and five tries, opens the session (the cookie) and redirects (303) to
	// the request's `next`, else `/`. A token that is unknown, used or expired lands on `login`
	// with `?expired=1`, on either.
	authCallback: '/auth/callback',
	// GET ?code=<user code>: where `syneva login` sends the person (`DeviceCodeAnswer`'s
	// `verificationUrl`), signed in; POST DeviceApprovalRequest approves or denies the code.
	device: '/device',
	// GET: who is signed in (WebMe); 401 otherwise.
	me: '/api/web/me',
	// GET: the person's paired hubs (WebHubsAnswer), what the `hub` frames also say; DELETE
	// `/api/web/hubs/<hubId>`: revokes one (its socket closes with `revoked`, its row stays with
	// `revokedAt`), from the Hub page. The hub's own revocation, at `syneva logout`, is
	// `BRIDGE_PATHS.hubRevoke` with its token.
	hubs: '/api/web/hubs',
} as const

export const WEB_HUBS_PREFIX = `${WEB_PATHS.hubs}/`

// The session cookie: a random id the Worker keeps as a digest in `sessions`; `HttpOnly`,
// `Secure`, `SameSite=Lax`, `Path=/`, 30 days. Named here for the smoke and the tests only: no
// script reads it.
export const WEB_SESSION_COOKIE = 'syneva_session'
export const WEB_SESSION_DAYS = 30
export const MAGIC_LINK_MINUTES = 15

export type MagicLinkRequest = { email: string; next?: string | undefined }
export type MagicLinkAnswer = { sent: true }

export type WebMe = { userId: string; email: string }

// A paired hub as the web's row says it: `online` from the object (a hub socket open now),
// `lastSeenAt` the last time it connected (the object writes nothing on close: RFC 6.3, R3),
// `version` the CLI version it paired or last connected with.
export type WebHub = {
	id: string
	name: string
	version: string
	online: boolean
	pairedAt: string
	lastSeenAt: string | null
}
export type WebHubsAnswer = { hubs: WebHub[] }

// POST /device: the code as printed (`XXXX-XXXX`, case and dashes ignored); `approve: false`
// denies it, and the CLI stops asking with `DEVICE_DENIED`.
export type DeviceApprovalRequest = { userCode: string; approve: boolean }
export type DeviceApprovalAnswer =
	| { approved: true; hubName: string }
	| { approved: false }
