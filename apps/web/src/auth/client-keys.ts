// Who asks, as the limits count it (RFC 6.1 F1, F2). Cloudflare names the client's address in
// cf-connecting-ip (wrangler dev too): IPv4 dotted, or IPv6 in any spelling. An IPv6 client holds
// at least a /64 (SLAAC hands a device one, privacy addresses rotate inside it, a VPS gets one),
// so an address is worth nothing as a key there: the host is its /64. A site or a free tunnel
// broker hands out a /48, the network, which bounds what rotating /64s inside it buys. An IPv4
// address is both: one address is what a client gets, and a carrier's NAT already puts many people
// behind one. An IPv4-mapped IPv6 address is its IPv4 address.
export type ClientKeys = { host: string; network: string }

const HEXTETS = 8
const HOST_HEXTETS = 4
const NETWORK_HEXTETS = 3
// ::ffff:a.b.c.d: five zero hextets, then 0xffff, then the IPv4 address.
const MAPPED_ZEROS = 5
const MAPPED_MARK = 0xff_ff
const HEXTET = /^[0-9a-f]{1,4}$/
// "::" appears at most once, and splits the address in two.
const COMPRESSED_HALVES = 2
const HEX_RADIX = 16
const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
const BYTE_MAX = 255
const BYTE_SPAN = 256
const UNKNOWN: ClientKeys = { host: 'unknown', network: 'unknown' }

export function clientKeys(request: Request): ClientKeys {
	const address = (request.headers.get('cf-connecting-ip') ?? '')
		.trim()
		.toLowerCase()
	const quad = ipv4Bytes(address)
	if (quad) return ipv4Keys(quad)
	const hextets = ipv6Hextets(address)
	if (!hextets) return UNKNOWN
	const mapped = mappedIpv4(hextets)
	if (mapped) return ipv4Keys(mapped)
	return {
		host: `${prefixOf(hextets, HOST_HEXTETS)}::/64`,
		network: `${prefixOf(hextets, NETWORK_HEXTETS)}::/48`,
	}
}

function ipv4Keys(bytes: number[]): ClientKeys {
	const address = bytes.join('.')
	return { host: address, network: address }
}

// The leading hextets, in their shortest spelling, so every spelling of a prefix is one key.
function prefixOf(hextets: number[], count: number): string {
	return hextets
		.slice(0, count)
		.map(hextet => hextet.toString(HEX_RADIX))
		.join(':')
}

function ipv4Bytes(text: string): number[] | null {
	const match = IPV4.exec(text)
	if (!match) return null
	const bytes = match.slice(1).map(Number)
	if (bytes.some(byte => byte > BYTE_MAX)) return null
	return bytes
}

function mappedIpv4(hextets: number[]): number[] | null {
	const isMapped =
		hextets.slice(0, MAPPED_ZEROS).every(hextet => hextet === 0) &&
		hextets[MAPPED_ZEROS] === MAPPED_MARK
	if (!isMapped) return null
	return hextets
		.slice(MAPPED_ZEROS + 1)
		.flatMap(hextet => [Math.floor(hextet / BYTE_SPAN), hextet % BYTE_SPAN])
}

// The eight hextets of an IPv6 address, "::" expanded; null for anything else.
function ipv6Hextets(address: string): number[] | null {
	if (!address.includes(':')) return null
	const halves = address.split('::')
	if (halves.length > COMPRESSED_HALVES) return null
	const [head = '', tail = ''] = halves
	const left = groupsOf(head)
	const right = groupsOf(tail)
	if (!left || !right) return null
	const missing = HEXTETS - left.length - right.length
	const isCompressed = halves.length === COMPRESSED_HALVES
	if (isCompressed ? missing < 1 : missing !== 0) return null
	return [...left, ...Array.from({ length: missing }, () => 0), ...right]
}

// One side of "::" as hextets, a trailing dotted IPv4 as its two; [] for an empty side.
function groupsOf(side: string): number[] | null {
	if (!side) return []
	const parts = side.split(':')
	const last = parts.at(-1) ?? ''
	const quad = last.includes('.') ? ipv4Bytes(last) : []
	if (!quad) return null
	const hex = quad.length ? parts.slice(0, -1) : parts
	if (!hex.every(part => HEXTET.test(part))) return null
	const groups = hex.map(part => Number.parseInt(part, HEX_RADIX))
	const [first = 0, second = 0, third = 0, fourth = 0] = quad
	if (!quad.length) return groups
	return [...groups, first * BYTE_SPAN + second, third * BYTE_SPAN + fourth]
}
