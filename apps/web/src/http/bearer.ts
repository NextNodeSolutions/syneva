// A Bearer credential, from `Authorization: Bearer <token>`: a hub's token (pairing, its socket),
// control-center's OPS_TOKEN. '' when there is none.
const BEARER_PREFIX = 'Bearer '

export function bearerOf(request: Request): string {
	const header = request.headers.get('authorization') ?? ''
	if (!header.startsWith(BEARER_PREFIX)) return ''
	return header.slice(BEARER_PREFIX.length).trim()
}
