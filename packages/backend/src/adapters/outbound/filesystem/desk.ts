import { promises as fs } from 'node:fs'
import path from 'node:path'

import { hash, sanitizeSession } from '../../../domain/identity.js'

import type { SettingsPort } from '../../../application/ports.js'

// The dot-directory under the user's home holding every Syneva artifact (reviews, settings, the hub registry, the update-check cache); one constant, so relocating ~/.syneva updates every consumer at once.
export const SYNEVA_DIR = '.syneva'
const SETTINGS_FILE = 'settings.json'
const JSON_INDENT = 2

// An empty HOME/USERPROFILE means "unset" (a shell can export it empty): a presence check, not a nullish one.
export function homeDir(fallback: string): string {
	const home = process.env.HOME
	if (home) return home
	const profile = process.env.USERPROFILE
	if (profile) return profile
	return fallback
}

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

// Deliberately NOT per-repo or per-session: these are the reviewer's, and the file follows them across browsers and hosts where a per-origin localStorage would not.
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

export const nodeSettings = Object.freeze({
	read: readGlobalSettings,
	write: writeGlobalSettings,
}) satisfies SettingsPort

// writeGlobalSettings always writes a JSON object, so anything else in the file (a bare value, an array) is not a settings body and the client keeps its defaults.
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
