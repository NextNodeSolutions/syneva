import { promises as fs, mkdirSync, openSync } from 'node:fs'
import path from 'node:path'

import { decodeJournalEvent } from '../../../domain/hub-journal.js'
import {
	decodeHubLock,
	decodeHubRegistry,
} from '../../../domain/hub-registry.js'

import { homeDir, SYNEVA_DIR } from './desk.js'
import { writeFileAtomic } from './persistence.js'

import type { FileHandle } from 'node:fs/promises'
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
// The byte every journal line ends with.
const LINE_FEED = 0x0a

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
// the line being written - which its decode then skips - and never the events around it (an
// append starts every event on a fresh line: appendJournal).
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

// An append that never completed (the hub killed mid-write, a write cut short by a full disk)
// leaves a line with no end, and the next event appended onto it would be lost with it at the
// next load. So an append starts on a fresh line whatever the file ends with, and a write that
// fails is cut back off: the hub dropped that event and hands its seq out again.
async function appendJournal(event: JournalEvent): Promise<void> {
	const dir = await ensureHubDir()
	const file = await fs.open(path.join(dir, JOURNAL_FILE), 'a+')
	try {
		const { size } = await file.stat()
		const lead = (await hasTornTail(file, size)) ? '\n' : ''
		await appendOrRollBack(file, size, `${lead}${journalLine(event)}`)
	} finally {
		await file.close()
	}
}

// Whether the file's last byte leaves a line open.
async function hasTornTail(file: FileHandle, size: number): Promise<boolean> {
	if (size === 0) return false
	const last = Buffer.alloc(1)
	await file.read(last, 0, 1, size - 1)
	return last[0] !== LINE_FEED
}

async function appendOrRollBack(
	file: FileHandle,
	size: number,
	text: string,
): Promise<void> {
	try {
		await file.appendFile(text, 'utf8')
	} catch (error) {
		// Shrinking needs no space, so it works on a full disk. If it fails anyway, the next
		// append still ends the torn line before writing its own.
		await file.truncate(size).catch(() => undefined)
		throw error
	}
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
