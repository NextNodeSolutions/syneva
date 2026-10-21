// The hub's pairing with the web (RFC 0001, 4.2): bridge.json read on every start and on every
// reconnect, the probe it runs for it, and where both stand - which the local stream pushes to
// the hub's own tabs as `pairing` frames.
import { startProbe } from './probe.js'

import type { PairingState } from '@syneva/contracts/pairing'
import type { PairingRecord } from '../filesystem/bridge.js'
import type { Probe, ProbeDeps } from './probe.js'

export type BridgeDeps = {
	read: () => Promise<PairingRecord | null>
	// The probe for a pairing, with everything but the pairing and its change listener.
	probe: Omit<ProbeDeps, 'record' | 'onChange' | 'source'> & {
		source: (record: PairingRecord) => ProbeDeps['source']
	}
	log: (line: string) => void
}

export type Bridge = {
	state(): PairingState
	// Hears every move of the pairing (read the state then); hands back the unsubscribe.
	subscribe(listener: () => void): () => void
	// Reads bridge.json again: drops the running probe, starts one for the file's pairing if any.
	// Settles with the pairing once that probe connected or its first attempt ended.
	reconnect(): Promise<PairingState>
	// The hub stops: the probe closes its socket with `normal`, nothing reconnects.
	close(): Promise<void>
}

export function createBridge(deps: BridgeDeps): Bridge {
	const listeners = new Set<() => void>()
	let record: PairingRecord | null = null
	let probe: Probe | null = null
	let isClosed = false
	// Reconnects run one at a time, in the order asked.
	let turn: Promise<unknown> = Promise.resolve()
	const readRecord = async (): Promise<PairingRecord | null> => {
		if (isClosed) return null
		return deps.read()
	}
	const changed = (): void => {
		for (const listener of listeners) listener()
	}
	const state = (): PairingState => pairingOf(record, probe)
	const reconnect = async (): Promise<PairingState> => {
		await probe?.close()
		probe = null
		record = await readRecord()
		changed()
		if (!record) return state()
		const { source, ...probeDeps } = deps.probe
		probe = startProbe({
			...probeDeps,
			source: source(record),
			record,
			onChange: changed,
		})
		await probe.settled()
		return state()
	}
	return {
		state,
		subscribe(listener) {
			listeners.add(listener)
			return () => listeners.delete(listener)
		},
		reconnect(): Promise<PairingState> {
			const next = after(turn, reconnect)
			turn = settledOf(next)
			return next
		},
		// The running probe closes first: a reconnect waiting on its first attempt settles at once
		// rather than at the handshake's deadline, and starts no other (the record reads as none).
		async close(): Promise<void> {
			isClosed = true
			await probe?.close()
			await turn
			await probe?.close()
		},
	}
}

function pairingOf(
	record: PairingRecord | null,
	probe: Probe | null,
): PairingState {
	if (!record) return { paired: false }
	const { link, lastClose } = probe?.state() ?? {
		link: { state: 'off' },
		lastClose: null,
	}
	return {
		paired: true,
		web: record.web,
		hubId: record.hubId,
		name: record.name,
		pairedAt: record.pairedAt,
		link,
		lastClose,
	}
}

async function after<T>(
	previous: Promise<unknown>,
	next: () => Promise<T>,
): Promise<T> {
	await previous
	return next()
}

// The turn the next reconnect waits for: this one over, whether it read a pairing or failed.
async function settledOf(turn: Promise<unknown>): Promise<void> {
	try {
		await turn
	} catch {
		/* the caller of that reconnect hears its failure */
	}
}
