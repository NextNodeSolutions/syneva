// Pairing a local hub with the web (RFC 0001, 4.2): the device-code flow `syneva login` runs,
// the route that hands the result to the running hub, and where the pairing stands, which the
// local hub pushes to its own tabs as `pairing` frames (bridge.ts).

// POST /bridge/v1/device/code: the CLI asks for a code, naming the hub it pairs (the machine's
// hostname) and the CLI version it runs.
export type DeviceCodeRequest = { name: string; version: string }

// The code the person confirms at `verificationUrl` (printed, and opened when the CLI can), the
// one the CLI then asks with; `interval` and `expiresIn` are seconds, as a device-code flow says
// them.
export type DeviceCodeAnswer = {
	deviceCode: string
	userCode: string
	verificationUrl: string
	interval: number
	expiresIn: number
}

// POST /bridge/v1/device/token: asked again every `interval` seconds until the code is approved,
// as RFC 8628 (3.5) asks it: an ask the web finds too soon answers 429 SLOW_DOWN, and the CLI adds
// 5 s to its interval for the rest of the login; a web that does not answer, or fails (5xx), is
// asked again after a wait that doubles, until the code's lifetime ends.
export type DeviceTokenRequest = { deviceCode: string }

// The hub's web id and its token once approved; `pending` until then.
export type DeviceTokenAnswer =
	| { hubId: string; token: string }
	| { pending: true }

// A code the person refused, that expired or that the web does not know answers a 4xx with the
// hub's error shape and one of these codes, and the CLI stops asking; an ask under the interval
// answers 429 SLOW_DOWN, and the CLI asks again, slower.
export type DeviceTokenRefusal = {
	error: string
	code: 'DEVICE_DENIED' | 'DEVICE_EXPIRED' | 'DEVICE_UNKNOWN' | 'SLOW_DOWN'
}

// Where the probe's socket to the web stands (RFC 4.3's client policy), with the time it got
// there. `stopped`: the web revoked the token (`revoked`, 4001) or refused it on the upgrade
// (401), and the probe never tries again until `syneva login` pairs anew. `off`: no probe runs
// (the hub is stopping).
export type PairingLink =
	| { state: 'off' }
	| { state: 'connecting'; since: string }
	| { state: 'connected'; since: string }
	| { state: 'backoff'; until: string }
	| { state: 'stopped'; reason: 'revoked' | 'unauthorized'; since: string }

// How the probe's last socket ended: its close code, or the HTTP status that refused its upgrade;
// neither when the attempt failed before both (the web unreachable, a handshake or a pong that
// never came). `reason` says it in words.
export type PairingClose = {
	at: string
	code?: number | undefined
	status?: number | undefined
	reason: string
}

// The hub's pairing as `~/.syneva/hub/bridge.json` holds it (never the token) and its link now.
export type PairingState =
	| { paired: false }
	| {
			paired: true
			// The web's origin.
			web: string
			// The hub's web id and the name the web knows it by.
			hubId: string
			name: string
			pairedAt: string
			link: PairingLink
			lastClose: PairingClose | null
	  }

// POST /api/hub/bridge/reconnect (a local hub's own route, loopback peers only): the hub reads
// bridge.json again, drops the probe it runs and starts one for the pairing the file holds, if
// any; it answers once that probe connected or failed its first attempt, with the pairing then.
export type BridgeReconnectAnswer = { pairing: PairingState }
