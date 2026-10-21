// The bridge (RFC 0001, section 4): the frames a hub pushes to the tabs watching it, its paths,
// its bounds and its close codes. One vocabulary for every push transport: the local hub's
// stream (`GET /api/hub/ws`), the probe a paired hub opens to the web, and the web's tab
// sockets. JSON text frames, each at most `BRIDGE_LIMITS.frameBytes`.
import { HUB_PATHS } from './routes.js'

import type { DeskStatus, PollPayload } from './browser.js'
import type { DeskSummary, HubEvent } from './hub.js'
import type { PairingState } from './pairing.js'
import type { PlanSummary } from './plans.js'

// The hub id the local hub speaks for itself; a paired hub speaks its web id instead (RFC 4.8).
export const LOCAL_HUB_ID = 'local'

// A web hub id: 16 hex characters the web draws at pairing (RFC 4.2). Fixed-width, so a web desk
// id - the hub id followed by the local desk id (RFC 4.8) - names its hub by its first 16
// characters, with no mapping kept anywhere.
const WEB_HUB_ID = /^[a-f0-9]{16}$/
const WEB_HUB_ID_LENGTH = 16

export function isWebHubId(id: string): boolean {
	return WEB_HUB_ID.test(id)
}

// The id a paired hub's desk goes by on the web: `/d/<webDeskId>/` keeps the local page's shape.
// A plan's record goes by its web id the same way, so every route that names an id names its hub.
export function webDeskId(hubId: string, deskId: string): string {
	return `${hubId}${deskId}`
}

// The hub a web desk id names and that desk's local id; null when it names no hub's desk.
export function splitWebDeskId(
	webId: string,
): { hubId: string; deskId: string } | null {
	const hubId = webId.slice(0, WEB_HUB_ID_LENGTH)
	const deskId = webId.slice(WEB_HUB_ID_LENGTH)
	if (!isWebHubId(hubId) || !deskId) return null
	return { hubId, deskId }
}

// Who a hub is: the first frame of every stream. `instanceId` changes on every hub start.
export type HubIdentity = {
	id: string
	// The machine's hostname.
	name: string
	// The CLI version the hub runs.
	version: string
	instanceId: string
	startedAt: string
}

// What a desk tab watches between two reads of its state: the payload `/poll` serves (the poll
// fields and the desk's status) and the desk's instance id, which `/poll` compares through its
// `?instance=` query and a stream carries instead (RFC 4.8): a new one asks the tab to refresh.
export type DeskPulse = PollPayload &
	DeskStatus & {
		serverInstanceId: string
	}

// The part of a pulse whose size does not grow with the review: a hash, a flag, the desk's
// status (its activity line is capped) and the instance id, a few hundred bytes whatever the desk
// holds. Everything else - the guide, where it stands against the diff, the conversation - grows
// with the review; a field added to DeskPulse joins those unless it is picked here.
export type DeskPulseHead = Pick<
	DeskPulse,
	'baseDiffHash' | 'guideExpected' | 'serverInstanceId' | keyof DeskStatus
>

// A pulse whose whole frame would pass `frameBytes` (a long conversation, a large guide) travels
// as its head and `partial`: frames are bounded by design, so such a desk neither goes unheard
// nor closes its readers' sockets. `digest` moves whenever a part left out moves; a tab reads the
// whole pulse at GET /api/desks/<id>/pulse (API_PATHS.pulse) when the digest is not the one it
// last read, never on a timer. A whole pulse carries no `partial`.
export type PartialDeskPulse = DeskPulseHead & {
	partial: { digest: string }
}

export type RelayMethod = 'GET' | 'POST' | 'DELETE'

// HUB_TIMEOUT, HUB_OFFLINE and CANCELLED are the web's own answers to a relay; a hub sends
// TOO_LARGE (its answer past `responseBytes`, the tab gets 413) and TOO_MANY (an addition to RFC
// 4.4: `inFlightPerUser` relays already in flight on the hub's side too, the tab gets 429).
export type RelayFailure =
	| 'HUB_TIMEOUT'
	| 'HUB_OFFLINE'
	| 'TOO_LARGE'
	| 'CANCELLED'
	| 'TOO_MANY'

export type BridgeFrame =
	| { t: 'hubs-end' }
	// First frame after connect.
	| { t: 'hello'; hub: HubIdentity }
	// A desk opened, reloaded or restored, or its summary changed.
	| { t: 'desk'; hubId: string; desk: DeskSummary }
	| { t: 'closed'; hubId: string; deskId: string }
	// A desk's pulse changed: coalesced per desk, latest wins; partial when the whole would not fit
	// a frame.
	| {
			t: 'pulse'
			hubId: string
			deskId: string
			pulse: DeskPulse | PartialDeskPulse
	  }
	// Journal events once on disk, oldest first, each with its hub's own seq: a reader keys them
	// on (hubId, seq), so a tail replayed after a reconnect deduplicates.
	| { t: 'journal'; hubId: string; events: HubEvent[] }
	// A plan record created or changed (a new version, an approval, a status change), with the
	// live desk reviewing it when the frame was shaped. The `desk` frames keep that link as desks
	// come and go: a desk whose `plan` names the record reviews it, until its `closed` frame. An
	// addition to RFC 4.4: the dashboard read the plan library on a timer, and the stream
	// replaces that read too.
	| { t: 'plan'; hubId: string; plan: PlanSummary }
	// Closes a snapshot: `hello`, one `desk` and one `pulse` per desk, the journal tail, every
	// plan (on the local stream, the hub's pairing), then this.
	| { t: 'snapshot-end'; hubId: string }
	// Where the hub's pairing with the web stands (pairing.ts), each time it moves. An addition to
	// RFC 4.4: the local hub tells its own tabs, so the Hub page follows its probe without asking;
	// a probe never sends it to the web.
	| { t: 'pairing'; hubId: string; pairing: PairingState }
	// The web's object tells its tabs where each of the person's paired hubs stands: one per hub
	// when a tab connects (the Worker hands the object the person's hubs with the upgrade, since
	// the object stores nothing), then one each time a hub socket opens or closes. `version` and
	// `lastSeenAt` are what the web's rows say (the CLI version the hub paired or last connected
	// with, the last time it connected): the fake bridge of test/bridge leaves them out.
	| {
			t: 'hub'
			hubId: string
			name: string
			online: boolean
			version?: string | undefined
			lastSeenAt?: string | null | undefined
	  }
	// The object asks a hub for a snapshot.
	| { t: 'snapshot?' }
	// The HTTP relay (RFC 4.5): one request, its answer, its failure, its cancellation. The
	// request's path carries web desk ids, which the hub strips (RFC 4.8); `query` is the search
	// part with its `?`, or empty. `req.body` is the request's body as text, as the web read it.
	// `res.body` and `chunk.data` are always the answer's bytes in base64, whatever its content
	// type: one rule for a JSON answer and a `/blob` image alike. An answer whose base64 is over
	// `chunkBytes` goes as `res { more: true }` without a body, then `chunk` frames of at most
	// `chunkBytes` of base64 each, the last without `more`. A hub reads its answer whole, up to
	// `responseBytes`, before its first frame: an `err` never follows a `res` of the same id.
	| {
			t: 'req'
			id: string
			method: RelayMethod
			path: string
			query: string
			body?: string | undefined
	  }
	| {
			t: 'res'
			id: string
			status: number
			headers: Record<string, string>
			body?: string | undefined
			more?: true | undefined
	  }
	| { t: 'chunk'; id: string; data: string; more?: true | undefined }
	| { t: 'err'; id: string; code: RelayFailure }
	| { t: 'cancel'; id: string }
	// Ping and pong.
	| { t: 'p' }
	| { t: 'o' }

// A ping and its pong, as the exact text on the wire: the web answers this pair with the
// object's auto-response, which matches the text, so every hub accepts exactly this spelling.
export const PING_TEXT = '{"t":"p"}'
export const PONG_TEXT = '{"t":"o"}'

// The hub a relayed request goes to when its path names no web id (`POST /api/hub/desks`,
// `POST /api/hub/inventory`, `GET /api/hub/plans`): the tab's pick, as a request header the web
// reads and never forwards. A path that names a web id names its hub by the id's prefix instead.
export const WEB_HUB_HEADER = 'x-syneva-hub'

// What a tab gets when a relay fails before its answer started (RFC 4.5, 4.9), with the failure
// as the error's `code`: no hub socket is 503, the deadline 504, a hub's own refusals 413 and 429.
// A hub socket that closes mid-answer cuts the answer if it started, else answers 502 with
// `HUB_OFFLINE`; a cancelled relay answers nothing, the tab left first.
export const RELAY_FAILURE_STATUS: Readonly<Record<RelayFailure, number>> = {
	HUB_OFFLINE: 503,
	HUB_TIMEOUT: 504,
	TOO_LARGE: 413,
	TOO_MANY: 429,
	CANCELLED: 502,
}

export const BRIDGE_PATHS = {
	deviceCode: '/bridge/v1/device/code',
	deviceToken: '/bridge/v1/device/token',
	// DELETE with the hub's token as a Bearer: the web revokes it and closes the hub's socket with
	// `revoked` (`syneva logout`, RFC 4.2 step 5). An addition to RFC 8's sketch.
	hubRevoke: '/bridge/v1/hub',
	hubSocket: '/bridge/v1/ws',
	tabSocket: HUB_PATHS.hubSocket,
	opsBreaker: '/bridge/v1/ops/breaker',
	opsStatus: '/bridge/v1/ops/status',
} as const

const PING_INTERVAL_MS = 30_000
const PONG_TIMEOUT_MS = 10_000
// The pings a socket may miss before it reads as gone: a background tab's timers may be throttled
// to once a minute, so one ping can come a whole interval late.
const MISSABLE_PINGS = 2

// Every bound of the bridge; a hub keeps them locally too, so the same bug is found locally first.
export const BRIDGE_LIMITS = {
	frameBytes: 1_048_576,
	chunkBytes: 786_432,
	responseBytes: 33_554_432,
	requestBodyBytes: 1_048_576,
	inFlightPerUser: 32,
	deadlineMs: 30_000,
	// Inbound, per socket, sustained: one second's worth is the burst.
	framesPerSecond: 100,
	bytesPerSecond: 2_097_152,
	hubsPerUser: 8,
	tabsPerUser: 32,
	pingIntervalMs: PING_INTERVAL_MS,
	pongTimeoutMs: PONG_TIMEOUT_MS,
	// Inbound silence a socket may keep (70 s): past it the hub closes it with `silent`, so a
	// laptop asleep, a link dropped half-open or a frozen tab holds neither its subscription nor a
	// seat among `tabsPerUser`. A client pings every `pingIntervalMs`.
	silenceMs: PING_INTERVAL_MS * MISSABLE_PINGS + PONG_TIMEOUT_MS,
	coalesceMs: 250,
	// What a reader may leave unread before a live frame is queued behind it (8 MiB, eight frames
	// at the bound): past it the hub closes it with `slow`, rather than growing by every frame
	// sent its way. A snapshot goes whole whatever its size, and live frames wait until it is
	// written out, so only a reader that cannot keep up with the events is closed.
	bufferedBytes: 8_388_608,
	journalTail: 200,
	journalPerFrame: 200,
	backoffMinMs: 1_000,
	backoffMaxMs: 60_000,
	// What a client waits before its next attempt after a close code that names a wait (RFC 4.3):
	// `rate` then takes the normal backoff, `tooMany` and `saturated` try again once it is over.
	rateWaitMs: 30_000,
	tooManyWaitMs: 60_000,
	saturatedWaitMs: 300_000,
} as const

// The client policy per code is RFC 4.3's. `goingAway` is the standard code a hub closes its
// sockets with when it stops; `normal` the one a client closes its own with (a probe whose hub
// stops, or whose pairing is dropped). A client reconnects with the normal backoff after any code
// that names no wait of its own, `silent` and `slow` among them.
export const CLOSE_CODES = {
	normal: 1000,
	goingAway: 1001,
	malformed: 1003,
	rate: 1008,
	tooMany: 1013,
	revoked: 4001,
	// Nothing came from the socket within `silenceMs`, as HTTP's 408 says of a request: its peer
	// is gone, or its tab was frozen and reconnects once it runs again.
	silent: 4008,
	// The reader left more than `bufferedBytes` unread: it reconnects and starts over from a fresh
	// snapshot, which says the latest state once instead of every step it missed.
	slow: 4010,
	saturated: 4029,
} as const
