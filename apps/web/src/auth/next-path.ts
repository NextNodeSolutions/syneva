// Where a sign-in lands: a path on this web only, as core's auth.ts reads `next`. An absolute URL
// or a protocol-relative //host would be an open redirect, and a prefix test is not enough (a
// browser reads "/\evil.com" and "/<tab>/evil.com" as //evil.com), so the value resolves against
// a placeholder origin, survives only if it stays there, is rebuilt from its parsed path, and one
// resolving to "//..." is refused.
const NEXT_BASE = 'http://web.invalid/'
const NEXT_ORIGIN = new URL(NEXT_BASE).origin
const MAX_NEXT_LENGTH = 2048

export function safeNext(next: string | null | undefined): string {
	if (!next?.startsWith('/') || next.length > MAX_NEXT_LENGTH) return '/'
	if (!URL.canParse(next, NEXT_BASE)) return '/'
	const target = new URL(next, NEXT_BASE)
	if (target.origin !== NEXT_ORIGIN) return '/'
	if (target.pathname.startsWith('//')) return '/'
	return `${target.pathname}${target.search}${target.hash}`
}
