// After an open or a reload, the CLI writes what the agent explains a guided desk from as local files: the desk's guide to fill in place (guide.json) and each pending domain's code (packets/<n>-<id>.md). One fixed folder per desk, emptied and rewritten each time - whatever the agent left there for the last round goes with it - so the agent always reads the desk as it stands and posts the file back with `syneva reload --guide`.
import { chmodSync, lstatSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { API_PATHS, deskApiBase } from '@syneva/contracts/routes'

import { warn } from '../../outbound/console.js'

import { hubGet } from './hub-client.js'

import type { PendingReason } from '@syneva/contracts/authoring'
import type { HubConnection } from './hub-client.js'

const HTTP_OK = 200

type Packet = { id: string; markdown: string }
type Pending = { id: string; reason: PendingReason }

// The authoring payload as the CLI acts on it, read field by field: the guide itself is written as served, never reshaped.
type Authoring = {
	guide: unknown
	overviewDrafted: boolean
	pending: Pending[]
	packets: Packet[]
}

// What the agent is told: where the files are and which domains wait for words.
export type AuthoringReport = {
	guide: string
	overviewDrafted: boolean
	pending: {
		id: string
		reason: PendingReason
		packet?: string | undefined
	}[]
}

function recordOf(field: unknown): Record<string, unknown> | null {
	if (typeof field !== 'object' || field === null) return null
	return Object.fromEntries(Object.entries(field))
}

function listOf(field: unknown): unknown[] {
	return Array.isArray(field) ? field : []
}

function readPending(entry: unknown): Pending[] {
	const record = recordOf(entry)
	if (typeof record?.id !== 'string') return []
	if (record.reason !== 'draft' && record.reason !== 'stale') return []
	return [{ id: record.id, reason: record.reason }]
}

function readPacket(entry: unknown): Packet[] {
	const record = recordOf(entry)
	if (typeof record?.id !== 'string' || typeof record.markdown !== 'string')
		return []
	return [{ id: record.id, markdown: record.markdown }]
}

function readAuthoring(body: unknown): Authoring | null {
	const record = recordOf(body)
	if (!record || !recordOf(record.guide)) return null
	return {
		guide: record.guide,
		overviewDrafted: record.overviewDrafted === true,
		pending: listOf(record.pending).flatMap(readPending),
		packets: listOf(record.packets).flatMap(readPacket),
	}
}

// A domain id may hold ":", which some file systems refuse in a name, and ids that differ only by ":" against "_" or by case would then share a file: the position prefix keeps every packet its own. The report maps every id to its file, so the name is never guessed.
function packetName(id: string, position: number): string {
	return `${position + 1}-${id.replaceAll(':', '_')}.md`
}

const PRIVATE_DIR = 0o700
const PRIVATE_FILE = 0o600
const GROUP_OTHER_BITS = 0o077

// The shared temp dir is writable by every local user and the desk id is predictable, so the folder is one only this user owns: another user could otherwise plant a symlink where a packet is written, or read the reviewed source. Refused (thrown) rather than repaired when it is someone else's or a link.
function privateRoot(): string {
	const uid = process.getuid?.()
	// Windows has no uid and its temp dir is already per user.
	if (typeof uid !== 'number') {
		const shared = path.join(os.tmpdir(), 'syneva')
		mkdirSync(shared, { recursive: true })
		return shared
	}
	const root = path.join(os.tmpdir(), `syneva-${uid}`)
	mkdirSync(root, { recursive: true, mode: PRIVATE_DIR })
	const stat = lstatSync(root)
	if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== uid)
		throw new Error(`${root} is not a directory this user owns`)
	if (stat.mode & GROUP_OTHER_BITS) chmodSync(root, PRIVATE_DIR)
	return root
}

function writeFiles(deskId: string, authoring: Authoring): AuthoringReport {
	const folder = path.join(privateRoot(), deskId)
	const packets = path.join(folder, 'packets')
	rmSync(folder, { recursive: true, force: true })
	mkdirSync(packets, { recursive: true, mode: PRIVATE_DIR })
	const guide = path.join(folder, 'guide.json')
	writeFileSync(guide, `${JSON.stringify(authoring.guide, null, '\t')}\n`, {
		mode: PRIVATE_FILE,
	})
	const written = new Map(
		authoring.packets.map((packet, position) => {
			const file = path.join(packets, packetName(packet.id, position))
			writeFileSync(file, packet.markdown, { mode: PRIVATE_FILE })
			return [packet.id, file] as const
		}),
	)
	return {
		guide,
		overviewDrafted: authoring.overviewDrafted,
		pending: authoring.pending.map(entry => ({
			...entry,
			packet: written.get(entry.id),
		})),
	}
}

function hint(report: AuthoringReport): void {
	const waiting = report.pending.map(entry => `${entry.id} (${entry.reason})`)
	if (!waiting.length && !report.overviewDrafted) return
	const domains = waiting.length
		? `${waiting.length} domain(s) wait for an explanation: ${waiting.join(', ')}.`
		: 'The overview is drafted.'
	warn(
		`Guide: ${domains} Fill ${report.guide} from the packets beside it, then \`syneva reload --guide ${report.guide}\`.`,
	)
}

// Null on a desk without a guide (an unguided desk, a file desk), a hub that could not answer or files that could not be written: the open or reload itself already succeeded, so this never fails the command.
export async function writeAuthoring(
	hub: HubConnection,
	deskId: string,
): Promise<AuthoringReport | null> {
	const response = await hubGet(
		hub,
		`${deskApiBase(deskId)}${API_PATHS.authoring}`,
	)
	if (response.status !== HTTP_OK) return null
	const authoring = readAuthoring(response.body)
	if (!authoring) return null
	try {
		const report = writeFiles(deskId, authoring)
		hint(report)
		return report
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error)
		warn(`Guide: the authoring files were not written (${reason}).`)
		return null
	}
}
