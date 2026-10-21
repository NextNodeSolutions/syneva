// Who the sign-in and pairing limits count (apps/web's auth/client-keys.ts): an IPv6 client is its
// /64 whatever address or spelling it sends, a /48 has a share of the day's emails, an IPv4
// address is one client and its IPv4-mapped spelling the same. wrangler dev hands the Worker the
// cf-connecting-ip a request carries, so each check speaks from the addresses it names (the
// documentation ranges: 2001:db8::/32, 198.51.100.0/24).
import { BRIDGE_PATHS } from '../../packages/contracts/dist/bridge.js'
import { WEB_PATHS } from '../../packages/contracts/dist/web.js'

import { HTTP_ACCEPTED, HTTP_OK, HTTP_TOO_MANY } from './statuses.mjs'
import { createBrowser } from './web-client.mjs'

// apps/web's auth/magic-link.ts: links per client an hour (RL_AUTH's ten a minute too), and per
// network a day.
const LINKS_PER_CLIENT = 10
const LINKS_PER_NETWORK = 50
// The /64s after ONE_HOST's: 2001:db8:5e:2::/64 and on.
const FIRST_OTHER_HOST = 2

// Ten addresses of one /64, in as many spellings.
const ONE_HOST = [
	'2001:db8:5e:1::1',
	'2001:DB8:5E:1::2',
	'2001:0db8:005e:0001::3',
	'2001:db8:5e:1:0:0:0:4',
	'2001:db8:5e:1:ffff:ffff:ffff:ffff',
	'2001:db8:5e:1:1234:5678:9abc:def0',
	'2001:db8:5e:1::a:b',
	'2001:db8:5e:1:0::5',
	'2001:db8:5e:1:a::',
	'2001:db8:5e:0001:0:0:0.0.0.6',
]

export async function checkClientLimits({ report, web }) {
	report.section('who the limits count')
	const browser = createBrowser(web.origin)
	let asked = 0
	const ask = address => {
		asked += 1
		return browser.post(
			WEB_PATHS.magicLink,
			{ email: `limits-${asked}@example.com` },
			{ 'cf-connecting-ip': address },
		)
	}
	await checkHost(report, ask)
	await checkNetwork(report, ask)
	await checkIpv4(report, ask)
	await checkPairingHost({ report, browser })
}

async function checkHost(report, ask) {
	const answers = await askedFrom(ONE_HOST, ask)
	const past = await ask('2001:db8:5e:1:abcd::9')
	report.check(
		'one IPv6 /64 is one client, whatever address or spelling: ten links, then 429 TOO_MANY_LINKS',
		answers.every(answer => answer.status === HTTP_ACCEPTED) &&
			past.status === HTTP_TOO_MANY &&
			past.body.code === 'TOO_MANY_LINKS',
		`${answers.map(answer => answer.status).join(' ')} then ${past.status}`,
	)
}

// The first /64 spent ten of the /48's share; four more spend the rest, and the next is refused
// with its own budget untouched. Another /48 is another share.
async function checkNetwork(report, ask) {
	const links = LINKS_PER_NETWORK - LINKS_PER_CLIENT
	const addresses = Array.from({ length: links }, (_, index) => {
		const host = FIRST_OTHER_HOST + Math.floor(index / LINKS_PER_CLIENT)
		return `2001:db8:5e:${host}::${(index % LINKS_PER_CLIENT) + 1}`
	})
	const answers = await askedFrom(addresses, ask)
	const spent = await ask('2001:db8:5e:ff::1')
	report.check(
		"each /64 of a /48 has its own ten, until the /48's fifty a day: then 429, from a fresh /64",
		answers.every(answer => answer.status === HTTP_ACCEPTED) &&
			spent.status === HTTP_TOO_MANY,
		`${answers.filter(answer => answer.status === HTTP_ACCEPTED).length}/${answers.length} then ${spent.status}`,
	)
	const other = await ask('2001:db8:5f:1::1')
	report.check(
		'another /48 still gets its link',
		other.status === HTTP_ACCEPTED,
		`${other.status}`,
	)
}

async function checkIpv4(report, ask) {
	const answers = await askedFrom(
		Array.from({ length: LINKS_PER_CLIENT }, () => '198.51.100.7'),
		ask,
	)
	const mapped = await ask('::ffff:198.51.100.7')
	const neighbour = await ask('198.51.100.8')
	report.check(
		'an IPv4 address is one client, its IPv4-mapped spelling the same; its neighbour another',
		answers.every(answer => answer.status === HTTP_ACCEPTED) &&
			mapped.status === HTTP_TOO_MANY &&
			neighbour.status === HTTP_ACCEPTED,
		`${mapped.status} ${neighbour.status}`,
	)
}

// RL_AUTH's pairing budget by the same keys: ten device codes from one /64, then 429.
async function checkPairingHost({ report, browser }) {
	const ask = address =>
		browser.post(
			BRIDGE_PATHS.deviceCode,
			{ name: 'limits', version: 'smoke' },
			{ 'cf-connecting-ip': address },
		)
	const addresses = Array.from(
		{ length: LINKS_PER_CLIENT },
		(_, index) => `2001:db8:6a:1::${index + 1}`,
	)
	const answers = await askedFrom(addresses, ask)
	const past = await ask('2001:db8:6a:1:ffff::1')
	report.check(
		'a device code is limited per /64 too: ten, then 429 RATE_LIMITED',
		answers.every(answer => answer.status === HTTP_OK) &&
			past.status === HTTP_TOO_MANY &&
			past.body.code === 'RATE_LIMITED',
		`${answers.map(answer => answer.status).join(' ')} then ${past.status}`,
	)
}

// One after the other, as one client would ask.
async function askedFrom(addresses, ask) {
	const answers = []
	for (const address of addresses) answers.push(await ask(address))
	return answers
}
