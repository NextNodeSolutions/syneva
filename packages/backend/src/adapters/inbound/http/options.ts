import type { Server } from 'node:http'
import type { Hub } from './hub.js'
import type { UiServer } from './routes/static.js'

export type HubOptions = {
	port?: number | undefined
	// Loopback-only by default: the hub stays local unless explicitly bound wider (--host / SYNEVA_HOST), which requires an access key.
	host?: string | undefined
	allowedHosts?: string[] | undefined
	publicUrl?: string | undefined
	key?: string | undefined
	version: string
	runEditorCommand?:
		| ((command: string, args: string[]) => Promise<void>)
		| undefined
	statusTtlMs?: number | undefined
	log?: ((line: string) => void) | undefined
	onShutdown?: (() => void) | undefined
	ui?: UiServer | undefined
}

export type HubHandle = {
	server: Server
	hub: Hub
	url: string
	localUrl: string
	port: number
	close(): Promise<void>
}

export const DEFAULT_HOST = '127.0.0.1'
export const DEFAULT_HUB_PORT = 4747
