// The hub's pairing with the web, as `syneva login` leaves it: ~/.syneva/hub/bridge.json, beside
// the lock and the registry, readable by its owner only (mode 0600: it holds the hub's token,
// RFC 0001 section 7). The hub reads it on every start and on `POST /api/hub/bridge/reconnect`;
// `syneva logout` deletes it.
import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { isWebHubId } from '@syneva/contracts/bridge'

import { hubDir } from './hub.js'
import { isMissingFile } from './persistence.js'

const BRIDGE_FILE = 'bridge.json'
const JSON_INDENT = 2
// Owner read and write, nobody else: the token is a credential.
const OWNER_ONLY = 0o600

export type PairingRecord = {
	// The web's origin.
	web: string
	// The hub's web id and its token, as the web handed them out.
	hubId: string
	token: string
	// The name the web knows the hub by (the hostname at pairing).
	name: string
	pairedAt: string
}

export function bridgeFilePath(): string {
	return path.join(hubDir(), BRIDGE_FILE)
}

// Null when the hub is not paired: no file, or one that does not read as a pairing (a hand edit,
// a torn copy), which pairs nothing until `syneva login` writes it again.
export async function readPairingRecord(): Promise<PairingRecord | null> {
	let text: string
	try {
		text = await fs.readFile(bridgeFilePath(), 'utf8')
	} catch (error) {
		if (isMissingFile(error)) return null
		throw error
	}
	try {
		return decodePairingRecord(JSON.parse(text))
	} catch {
		return null
	}
}

// Atomic as every hub record (persistence.ts: a temp file, then a rename), the temp file created
// owner-only: the token is never readable by others, not even while it is written, and a file a
// hand made wider is narrowed by the rename.
export async function writePairingRecord(record: PairingRecord): Promise<void> {
	await fs.mkdir(hubDir(), { recursive: true })
	const file = bridgeFilePath()
	const tmp = `${file}.${randomUUID()}.tmp`
	const text = `${JSON.stringify(record, null, JSON_INDENT)}\n`
	try {
		await fs.writeFile(tmp, text, { encoding: 'utf8', mode: OWNER_ONLY })
		await fs.rename(tmp, file)
	} finally {
		await fs.rm(tmp, { force: true })
	}
}

// True when there was a file to delete.
export async function removePairingRecord(): Promise<boolean> {
	try {
		await fs.rm(bridgeFilePath())
		return true
	} catch (error) {
		if (isMissingFile(error)) return false
		throw error
	}
}

function decodePairingRecord(raw: unknown): PairingRecord | null {
	if (typeof raw !== 'object' || raw === null) return null
	const record: Record<string, unknown> = Object.fromEntries(
		Object.entries(raw),
	)
	const { web, hubId, token, name, pairedAt } = record
	if (
		typeof web !== 'string' ||
		typeof hubId !== 'string' ||
		typeof token !== 'string' ||
		typeof name !== 'string' ||
		typeof pairedAt !== 'string'
	)
		return null
	if (!isWebOrigin(web) || !isWebHubId(hubId) || !token) return null
	return { web, hubId, token, name, pairedAt }
}

// An http(s) origin, spelled as its origin: what `syneva login` writes.
export function isWebOrigin(web: string): boolean {
	if (!URL.canParse(web)) return false
	const url = new URL(web)
	return (
		(url.protocol === 'https:' || url.protocol === 'http:') &&
		url.origin === web
	)
}
