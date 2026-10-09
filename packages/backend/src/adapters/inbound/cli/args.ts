import { readFileSync } from 'node:fs'
import path from 'node:path'

import { errorMessage } from '../../../application/errors.js'
import { validateGuide } from '../../../domain/guide.js'
import { warn } from '../../outbound/console.js'
import { getGitRoot } from '../../outbound/git/repo.js'

import type { Guide } from '@syneva/contracts/guide'

// A flag that was never passed has no key at all, so every read is | undefined: callers default it instead of trusting the index signature's non-null type.
export type CliArgs = Record<string, string | boolean | undefined>

const FLAG_PREFIX = '--'

export function parseArgs(argv: string[]): CliArgs {
	const parsed: CliArgs = { diff: 'working', open: true }
	for (let index = 0; index < argv.length; index++) {
		const arg = argv[index]
		if (!arg) continue
		if (arg === '--no-open') {
			parsed.open = false
			continue
		}
		if (!arg.startsWith(FLAG_PREFIX)) continue
		const key = arg.slice(FLAG_PREFIX.length)
		const next = argv[index + 1]
		if (!next || next.startsWith(FLAG_PREFIX)) {
			parsed[key] = true
			continue
		}
		parsed[key] = next
		index++
	}
	return parsed
}

export function leadingPositionals(argv: string[]): string[] {
	const words: string[] = []
	for (const arg of argv) {
		if (arg.startsWith(FLAG_PREFIX)) break
		words.push(arg)
	}
	return words
}

export function flagText(args: CliArgs, key: string): string | undefined {
	const flag = args[key]
	if (typeof flag !== 'string' || !flag.length) return undefined
	return flag
}

export function resolveRepo(args: CliArgs): string {
	return path.resolve(flagText(args, 'repo') ?? process.cwd())
}

// The repo root falls back to the requested path when git can't resolve it: a non-repo directory still gets a clear hub error rather than a crash.
export async function resolveRoot(args: CliArgs): Promise<string> {
	const requested = resolveRepo(args)
	return getGitRoot(requested).catch(() => requested)
}

// Returns the validated guide, undefined when the flag is absent, or null on any error (after printing why) so the caller can abort.
export function loadGuideArg(
	guideFlag: string | boolean | undefined,
): Guide | undefined | null {
	if (!guideFlag) return undefined
	if (typeof guideFlag !== 'string') {
		warn(
			'--guide requires a path to a guide JSON file, e.g. --guide guide.json',
		)
		return null
	}
	const SCHEMA = 'Run `syneva spec` for the full guide schema.'
	let parsed: unknown
	try {
		parsed = JSON.parse(readFileSync(guideFlag, 'utf8'))
	} catch (error) {
		warn(
			`Could not read guide file "${guideFlag}" as JSON: ${errorMessage(error)}\n${SCHEMA}`,
		)
		return null
	}
	const validation = validateGuide(parsed)
	if (!validation.ok) {
		warn(`Invalid guide: ${validation.reason}.\n${SCHEMA}`)
		return null
	}
	return validation.guide
}
