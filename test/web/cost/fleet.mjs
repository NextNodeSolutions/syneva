// The clients a drill (T7, T10) watches, all of one person: a hub that keeps its socket with the
// probe's policy module, and tabs as a browser holds them, through the frontend's own transport.
// Both write down every attempt and wait (rfc-waits.mjs judges them).
import { BrowserTab } from './fakes/browser-tab.mjs'
import { FakeHub } from './fakes/fake-hub.mjs'
import { PolicyClient } from './fakes/policy-client.mjs'
import { delay } from './fakes/timing.mjs'

const POLL_MS = 500

// `origin` is where the clients reach the web: its own, or an edge stand-in in front of it.
export async function fleetOf(ctx, account, { tabs, origin = ctx.web.origin }) {
	const paired = await ctx.hub(account, 0)
	const peer =
		origin === ctx.web.origin
			? paired
			: ctx.track(
					new FakeHub({
						hubId: paired.hubId,
						token: paired.token,
						name: paired.name,
						origin,
					}),
				)
	const clients = [new PolicyClient({ name: 'hub', peer })]
	for (let at = 0; at < tabs; at += 1)
		clients.push(
			ctx.track(
				new BrowserTab({
					name: `tab ${at}`,
					origin,
					cookie: account.browser.jar.cookie,
				}),
			),
		)
	return clients
}

// Every socket open, and every tab past the hub's `hello`: the frame the frontend's transport
// counts its backoff from, so a drill's first wait is the ladder's first step.
export function isSettled(clients) {
	return clients.every(
		client =>
			client.isOpen &&
			(!(client instanceof BrowserTab) ||
				client.frames.some(({ frame }) => frame.t === 'hello')),
	)
}

export const isBrowserTab = client => client instanceof BrowserTab

export async function until(test, timeoutMs) {
	const deadline = Date.now() + timeoutMs
	while (!test() && Date.now() < deadline) await delay(POLL_MS)
}
