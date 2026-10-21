// The hub's pairing with the web, composed: bridge.json on disk, the probe speaking the hub's
// stream with web ids (RFC 0001, 4.8) under the hub's own stream queue, and answering the web's
// relayed requests through the hub's own router.
import { createBridge } from '../adapters/outbound/bridge/bridge.js'
import { createRelay } from '../adapters/outbound/bridge/relay.js'
import { readPairingRecord } from '../adapters/outbound/filesystem/bridge.js'

import type { HubIdentity } from '@syneva/contracts/bridge'
import type { HubJournal } from '@syneva/core/application/journal'
import type { PlanLibrary } from '@syneva/core/application/plan-library'
import type { HubRouter } from '@syneva/core/http/router'
import type { Hub } from '@syneva/core/hub/hub'
import type { Bridge } from '../adapters/outbound/bridge/bridge.js'
import type { PairingRecord } from '../adapters/outbound/filesystem/bridge.js'

export type BridgeHub = {
	hub: Hub
	journal: HubJournal
	plans: PlanLibrary
	version: string
	// The hub's router, once the server built it: the relay dispatches into it.
	router: () => HubRouter | null
}

export function wireBridge(
	parts: BridgeHub,
	log: (line: string) => void,
): Bridge {
	const { hub, journal, plans, version, router } = parts
	return createBridge({
		read: readPairingRecord,
		probe: {
			scale: bridgeWaitScale(),
			log,
			source: record => ({
				identity: webIdentityOf(hub, record, version),
				hub,
				journal,
				plans,
			}),
			relay: record => createRelay({ hubId: record.hubId, router, log }),
		},
		log,
	})
}

// The hub reads bridge.json on every start: a paired hub's probe connects while the desks restore
// (its snapshot waits for them); an unpaired hub runs exactly as before.
export async function connectBridge(
	bridge: Bridge,
	log: (line: string) => void,
): Promise<void> {
	try {
		await bridge.reconnect()
	} catch (error) {
		log(`bridge: could not read the pairing: ${String(error)}`)
	}
}

// Who the probe says the hub is: its web id and the name the web knows it by.
function webIdentityOf(
	hub: Hub,
	record: PairingRecord,
	version: string,
): HubIdentity {
	return {
		id: record.hubId,
		name: record.name,
		version,
		instanceId: hub.instanceId,
		startedAt: hub.startedAt,
	}
}

// Test-only: SYNEVA_BRIDGE_WAIT_SCALE multiplies every wait the probe keeps (its reconnect waits,
// its ping interval and its pong deadline), so the conformance check sees a 5-minute wait pass in
// seconds. Unset, or anything but a positive number, the waits are RFC 4.3's.
function bridgeWaitScale(): number {
	const scale = Number(process.env.SYNEVA_BRIDGE_WAIT_SCALE)
	return Number.isFinite(scale) && scale > 0 ? scale : 1
}
