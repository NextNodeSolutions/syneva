import { promises as fs, mkdirSync, openSync } from 'node:fs'
import path from 'node:path'

import { decodeJournalEvent } from '../../../domain/hub-journal.js'
import {
	decodeHubLock,
	decodeHubRegistry,
} from '../../../domain/hub-registry.js'

import { homeDir, SYNEVA_DIR } from './desk.js'
import { writeFileAtomic } from './persistence.js'

import type {
	HubJournalPort,
	HubRegistryPort,
} from '../../../application/ports.js'
import type { JournalEvent } from '../../../domain/hub-journal.js'
import type { HubDeskRecord, HubLock } from '../../../domain/hub-registry.js'

// Everything the hub keeps about itself lives under ~/.syneva/hub/: the lock the CLI reads to
// find a running hub, the desk registry a restart restores from, the journal of what happened
// on the hub, and the log a detached hub writes to. Review state stays where it always was
// (~/.syneva/<repoHash>/<session>/).
const HUB_DIR = 'hub'
const LOCK_FILE = 'hub.json'
const REGISTRY_FILE = 'desks.json'
const JOURNAL_FILE = 'journal.jsonl'
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

// The journal is JSON lines: an event is one append of one line, so a crash can tear at most
// the line being written - which its decode then skips - and never the events before it.
async function loadJournal(): Promise<JournalEvent[]> {
	const text = await readJournalText()
	return text
		.split('\n')
		.map(decodeJournalLine)
		.filter(event => event !== null)
}

async function readJournalText(): Promise<string> {
	try {
		return await fs.readFile(path.join(hubDir(), JOURNAL_FILE), 'utf8')
	} catch (error) {
		if (isMissingFile(error)) return '' // no journal yet: nothing has happened
		throw error
	}
}

function isMissingFile(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		error.code === 'ENOENT'
	)
}

function decodeJournalLine(line: string): JournalEvent | null {
	if (!line.trim()) return null
	try {
		const parsed: unknown = JSON.parse(line)
		return decodeJournalEvent(parsed)
	} catch {
		return null
	}
}

function journalLine(event: JournalEvent): string {
	return `${JSON.stringify(event)}\n`
}

async function appendJournal(event: JournalEvent): Promise<void> {
	const dir = await ensureHubDir()
	await fs.appendFile(
		path.join(dir, JOURNAL_FILE),
		journalLine(event),
		'utf8',
	)
}

async function rewriteJournal(events: readonly JournalEvent[]): Promise<void> {
	const dir = await ensureHubDir()
	await writeFileAtomic(
		path.join(dir, JOURNAL_FILE),
		events.map(journalLine).join(''),
	)
}

// The node/filesystem implementation of the application's hub-journal capability. Frozen like
// the registry's.
export const nodeHubJournal: HubJournalPort = Object.freeze({
	load: loadJournal,
	append: appendJournal,
	rewrite: rewriteJournal,
})
