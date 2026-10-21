import { promises as fs } from 'node:fs'

import type { WorkspacePort } from '@syneva/core/application/ports'

// The node/filesystem implementation of the application's working-tree capability. Frozen: use cases see a readonly port, never this module's internals.

export async function realpath(target: string): Promise<string | null> {
	try {
		return await fs.realpath(target)
	} catch {
		return null
	}
}

export async function isDirectory(target: string): Promise<boolean> {
	try {
		return (await fs.stat(target)).isDirectory()
	} catch {
		return false
	}
}

export async function readFile(target: string): Promise<string | null> {
	try {
		return await fs.readFile(target, 'utf8')
	} catch {
		return null
	}
}

export async function readBytes(
	target: string,
): Promise<Uint8Array<ArrayBuffer> | null> {
	try {
		return await fs.readFile(target)
	} catch {
		return null
	}
}

export const nodeWorkspace: WorkspacePort = Object.freeze({
	realpath,
	isDirectory,
	readFile,
	readBytes,
})
