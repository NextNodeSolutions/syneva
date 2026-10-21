// The Worker's secrets and digests, on Web Crypto only: random tokens and ids, the sha256 a token
// is stored as, the HMAC a session id is stored as, and the constant-time compare of a presented
// secret. A database dump holds digests, never a token, a session id or a code.
const UTF8 = new TextEncoder()
const HEX_RADIX = 16
const HEX_WIDTH = 2
const TOKEN_BYTES = 32

// The person reads and types it: 32 symbols, no 0/O nor 1/I (RFC 6.1 F2), so a byte masked to
// five bits picks one without bias.
const USER_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
// Eight of the alphabet's symbols: no I, O, 0 or 1, which read as each other.
const USER_CODE_SHAPE = /^[A-HJ-NP-Z2-9]{8}$/
const USER_CODE_MASK = 31
const USER_CODE_LENGTH = 8
const USER_CODE_HALF = 4

function randomBytes(count: number): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(count))
}

function hexOf(bytes: ArrayBuffer | Uint8Array): string {
	return [...new Uint8Array(bytes)]
		.map(byte => byte.toString(HEX_RADIX).padStart(HEX_WIDTH, '0'))
		.join('')
}

function base64url(bytes: Uint8Array): string {
	const binary = String.fromCharCode(...bytes)
	return btoa(binary)
		.replaceAll('+', '-')
		.replaceAll('/', '_')
		.replace(/=+$/, '')
}

// 32 random bytes, base64url: a hub's token, a session id, a magic link's or a device's code.
export function randomToken(): string {
	return base64url(randomBytes(TOKEN_BYTES))
}

export function randomHex(bytes: number): string {
	return hexOf(randomBytes(bytes))
}

export async function sha256Hex(text: string): Promise<string> {
	return hexOf(await crypto.subtle.digest('SHA-256', UTF8.encode(text)))
}

export async function hmacHex(secret: string, text: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		UTF8.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	)
	return hexOf(await crypto.subtle.sign('HMAC', key, UTF8.encode(text)))
}

// Constant time whatever the lengths: both sides are hashed first, so the compare never
// short-circuits on a length and timingSafeEqual always sees two equal-length digests.
export async function isSameSecret(
	presented: string,
	expected: string,
): Promise<boolean> {
	if (!presented || !expected) return false
	const [left, right] = await Promise.all([
		crypto.subtle.digest('SHA-256', UTF8.encode(presented)),
		crypto.subtle.digest('SHA-256', UTF8.encode(expected)),
	])
	return crypto.subtle.timingSafeEqual(left, right)
}

// XXXX-XXXX, as the CLI prints it and the person types it.
export function userCode(): string {
	const symbols = [...randomBytes(USER_CODE_LENGTH)].map(
		byte => USER_CODE_ALPHABET[byte & USER_CODE_MASK] ?? '',
	)
	return `${symbols.slice(0, USER_CODE_HALF).join('')}-${symbols.slice(USER_CODE_HALF).join('')}`
}

// What the person typed, as stored: case, dashes and spaces ignored. Null when it cannot be one.
export function normalizedUserCode(typed: string): string | null {
	const code = typed.toUpperCase().replaceAll(/[\s-]/g, '')
	if (!USER_CODE_SHAPE.test(code)) return null
	return code
}

export function displayedUserCode(stored: string): string {
	return `${stored.slice(0, USER_CODE_HALF)}-${stored.slice(USER_CODE_HALF)}`
}
