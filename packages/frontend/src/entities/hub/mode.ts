import { isWebHubId, LOCAL_HUB_ID } from '@syneva/contracts/bridge'

// Whether the page is served by a hub on this machine or by the web (RFC 0001, 3.3). The one rule,
// read from the hubs the stream names, never from the address bar: the local hub's hello names
// `LOCAL_HUB_ID`; the web's object sends `hub` frames (the local stream never does) and speaks
// for a paired hub by its 16-hex web id. The first frame that says either settles it, and the
// mode is null until one has.
export type HubMode = 'local' | 'web'

export function modeOfHubId(hubId: string): HubMode | null {
	if (hubId === LOCAL_HUB_ID) return 'local'
	if (isWebHubId(hubId)) return 'web'
	return null
}
