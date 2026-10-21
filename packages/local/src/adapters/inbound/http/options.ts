import type { Server } from 'node:http'
import type { UiServer } from '@syneva/core/http/ui-server'
import type { Hub } from '@syneva/core/hub/hub'
import type { NodeUiMiddleware } from './node-adapter.js'

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
	// The dev loop's seam: its pages, and Vite's middleware for the module graph (offered the reads no route claimed); an install serves the built bundle.
	ui?: UiServer | undefined
	uiMiddleware?: NodeUiMiddleware | undefined
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
