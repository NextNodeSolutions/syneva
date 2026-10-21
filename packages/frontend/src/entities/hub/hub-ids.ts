import {
	isWebHubId,
	LOCAL_HUB_ID,
	splitWebDeskId,
	webDeskId,
} from '@syneva/contracts/bridge'

// How ids read across hubs (RFC 0001, 4.8). A paired hub's desks and plans reach the page under
// web ids (`<16 hex hub id><local id>`, already so on the wire); its projects do not, and two
// laptops can hold a repository at the same path, so a project id is scoped here, at the entity
// boundary, the way the web scopes a desk's. The local hub's ids stay as they are.

// The hub an id names: the prefix of a web id, the local hub for any other.
export function hubOfId(id: string): string {
	return splitWebDeskId(id)?.hubId ?? LOCAL_HUB_ID
}

// An id the hub derived (a project's), named under the hub it came from. Never scoped twice: an
// id that already carries its hub's prefix stays.
export function scopedId(hubId: string, id: string): string {
	if (!isWebHubId(hubId) || id.startsWith(hubId)) return id
	return webDeskId(hubId, id)
}
