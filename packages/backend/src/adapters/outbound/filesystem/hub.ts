import { promises as fs, mkdirSync, openSync } from 'node:fs'
import path from 'node:path'

import {
	decodeHubLock,
	decodeHubRegistry,
} from '../../../domain/hub-registry.js'

import { homeDir, SYNEVA_DIR } from './desk.js'
import { writeFileAtomic } from './persistence.js'

import type { HubRegistryPort } from '../../../application/ports.js'
import type { HubDeskRecord, HubLock } from '../../../domain/hub-registry.js'

// Everything the hub keeps about itself lives under ~/.syneva/hub/: the lock the CLI reads to
// find a running hub, the desk registry a restart restores from, and the log a detached hub
// writes to. Review state stays where it always was (~/.syneva/<repoHash>/<session>/).
const HUB_DIR = 'hub'
const LOCK_FILE = 'hub.json'
const REGISTRY_FILE = 'desks.json'
const LOG_FILE = 'hub.log'
const JSON_INDENT = 2

export function hubDir(): string {
	return path.join(homeDir(process.cwd()), SYNEVA_DIR, HUB_DIR)
}

export function hubLockPath(): string {
	return path.join(hubDir(), LOCK_FILE)
}

export function hubLogPath(): string {
	return path.join(hubDir(), LOG_FILE)
}

// The append descriptor a detached hub's stdio is pointed at. The CLI opens it BEFORE any hub
// has run, so on a fresh machine nothing has created ~/.syneva/hub/ yet (the lock and registry
// writers only run inside a hub that is already up): the directory is made here. Synchronous
// like the spawn it feeds; the caller closes the descriptor once the child has inherited it.
export function openHubLog(): number {
	mkdirSync(hubDir(), { recursive: true })
	return openSync(hubLogPath(), 'a')
}

async function ensureHubDir(): Promise<string> {
	const dir = hubDir()
	await fs.mkdir(dir, { recursive: true })
	return dir
}

export async function readHubLock(): Promise<HubLock | null> {
	try {
		const parsed: unknown = JSON.parse(
			await fs.readFile(hubLockPath(), 'utf8'),
		)
		return decodeHubLock(parsed)
	} catch {
		return null
	}
}

export async function writeHubLock(lock: HubLock): Promise<void> {
	await ensureHubDir()
	await writeFileAtomic(
		hubLockPath(),
		`${JSON.stringify(lock, null, JSON_INDENT)}\n`,
	)
}

// Remove the lock only while it is OURS: a hub that exits late (a stop racing a restart) must
// never erase the lock the newer hub just wrote.
export async function removeHubLock(pid: number): Promise<void> {
	const lock = await readHubLock()
	if (!lock || lock.pid !== pid) return
	await fs.rm(hubLockPath(), { force: true }).catch(() => undefined)
}

export function isProcessAlive(pid: number): boolean {
	try {
		process.kill(pid, 0)
		return true
	} catch {
		return false
	}
}

async function loadRegistry(): Promise<HubDeskRecord[]> {
	try {
		const parsed: unknown = JSON.parse(
			await fs.readFile(path.join(hubDir(), REGISTRY_FILE), 'utf8'),
		)
		return decodeHubRegistry(parsed)
	} catch {
		return [] // missing or corrupt → the hub starts with no desks
	}
}

async function saveRegistry(records: readonly HubDeskRecord[]): Promise<void> {
	const dir = await ensureHubDir()
	await writeFileAtomic(
		path.join(dir, REGISTRY_FILE),
		`${JSON.stringify({ desks: records }, null, JSON_INDENT)}\n`,
	)
}

// The node/filesystem implementation of the application's hub-registry capability. Frozen:
// the hub sees a readonly port, never this module's internals.
export const nodeHubRegistry: HubRegistryPort = Object.freeze({
	load: loadRegistry,
	save: saveRegistry,
})
