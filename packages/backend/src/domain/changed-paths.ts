// What a changed path is by its name alone: a lockfile, a document or a test. The partition sets lockfiles and documents apart; the draft ranks all three low until an agent judges them.
import path from 'node:path'

const LOCKFILES = new Set([
	'pnpm-lock.yaml',
	'package-lock.json',
	'yarn.lock',
	'bun.lockb',
	'bun.lock',
	'Cargo.lock',
	'go.sum',
	'poetry.lock',
	'uv.lock',
	'Gemfile.lock',
	'composer.lock',
])
const DOCUMENT = /\.(md|mdx|markdown|txt|rst)$/i
const TEST = /(^|\/)(__tests__|tests?)\/|\.(test|spec)\.[cm]?[jt]sx?$/

export function isLockfilePath(filePath: string): boolean {
	return LOCKFILES.has(path.posix.basename(filePath))
}

export function isDocumentPath(filePath: string): boolean {
	return DOCUMENT.test(filePath)
}

export function isTestPath(filePath: string): boolean {
	return TEST.test(filePath)
}
