import { promises as fs } from 'node:fs'
import path from 'node:path'

import { hash, sanitizeSession } from '../../../domain/identity.js'

import type { SettingsPort } from '../../../application/ports.js'

// The dot-directory under the user's home that holds every Syneva artifact (reviews, settings,
// the hub registry, the update-check cache). One constant: a relocation of ~/.syneva updates
// every consumer at once.
export const SYNEVA_DIR = '.syneva'
const SETTINGS_FILE = 'settings.json'
const JSON_INDENT = 2

// The user's home directory, falling back to `fallback` when neither env var is set. An empty
// HOME/USERPROFILE means "unset" (a shell can export it empty), so this is a presence check, not a
// nullish one.
export function homeDir(fallback: string): string {
	const home = process.env.HOME
	if (home) return home
	const profile = process.env.USERPROFILE
	if (profile) return profile
	return fallback
}

// Where a desk's reviews for one repo+session live: ~/.syneva/<repo hash>/<session>. Created on
// demand - every writer of a review starts here.
export async function reviewDir(
	root: string,
	session: string,
): Promise<string> {
	const dir = path.join(
		homeDir(root),
		SYNEVA_DIR,
		hash(root),
		sanitizeSession(session),
	)
	await fs.mkdir(dir, { recursive: true })
	return dir
}

// Global display preferences (~/.syneva/settings.json) - deliberately NOT per-repo or
// per-session: these are the reviewer's, and a file follows them across browsers and hosts
// where a per-origin localStorage would not.
export function globalSettingsPath(): string {
	return path.join(homeDir(process.cwd()), SYNEVA_DIR, SETTINGS_FILE)
}

export async function readGlobalSettings(): Promise<Record<string, unknown>> {
	try {
		const parsed: unknown = JSON.parse(
			await fs.readFile(globalSettingsPath(), 'utf8'),
		)
		return toSettings(parsed)
	} catch {
		return {} // missing or corrupt → client falls back to defaults
	}
}

// The filesystem adapter's implementation of the application's settings capability: the same
// global ~/.syneva/settings.json the desk's editor template reads, exposed read/write for the
// tab's Settings dialog.
export const nodeSettings = Object.freeze({
	read: readGlobalSettings,
	write: writeGlobalSettings,
}) satisfies SettingsPort

// writeGlobalSettings always writes a JSON object, so anything else in the file (a bare value, an
// array) is not a settings body and the client keeps its defaults.
function toSettings(parsed: unknown): Record<string, unknown> {
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
		return {}
	return { ...parsed }
}

export async function writeGlobalSettings(settings: unknown): Promise<void> {
	const file = globalSettingsPath()
	await fs.mkdir(path.dirname(file), { recursive: true })
	await fs.writeFile(
		file,
		`${JSON.stringify(settings, null, JSON_INDENT)}\n`,
		'utf8',
	)
}
