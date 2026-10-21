// The two Node modules core may import, as nodejs_compat provides them on Workers (RFC 0001,
// 3.1), declared down to the functions core calls. The Workers type check (tsconfig.workers.json)
// has no @types/node, so any other Node module, global or function fails it: grow this file only
// with a function nodejs_compat implements.

declare module 'node:path' {
	interface PlatformPath {
		readonly sep: string
		readonly posix: PlatformPath
		basename(path: string, suffix?: string): string
		dirname(path: string): string
		isAbsolute(path: string): boolean
		join(...paths: string[]): string
		normalize(path: string): string
		relative(from: string, to: string): string
		resolve(...paths: string[]): string
	}
	const path: PlatformPath
	export default path
}

declare module 'node:crypto' {
	interface Hash {
		update(data: string | Uint8Array): Hash
		digest(encoding: 'hex'): string
	}
	export function createHash(algorithm: 'sha1' | 'sha256'): Hash
	export function randomUUID(): string
	export function timingSafeEqual(
		left: Uint8Array,
		right: Uint8Array,
	): boolean
	const crypto: {
		createHash: typeof createHash
		randomUUID: typeof randomUUID
		timingSafeEqual: typeof timingSafeEqual
	}
	export default crypto
}
