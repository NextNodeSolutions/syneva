import type { Server } from 'node:http'
import type { Hub } from './hub.js'

export type HubOptions = {
	port?: number | undefined
	// Bind address. Defaults to 127.0.0.1 (loopback-only) - the hub stays local unless explicitly
	// bound wider (--host / SYNEVA_HOST), which requires an access key (see bootstrap/hub).
	host?: string | undefined
	// Extra host names (beyond the machine's hostname/bound address) whose authority the origin
	// guard trusts when bound non-loopback - SYNEVA_ALLOWED_HOSTS, for names like a MagicDNS FQDN.
	allowedHosts?: string[] | undefined
	// The origin reviewers reach the hub at when it sits behind a reverse proxy (TLS termination, a
	// public domain): printed as the dashboard URL and trusted by the origin guard.
	publicUrl?: string | undefined
	// The access key (hosted mode): every request must carry it - `Authorization: Bearer` from the
	// CLI, the signed-in cookie from a browser. Absent on a loopback-only hub.
	key?: string | undefined
	version: string
	// Test seam: lets tests assert the resolved editor invocation without actually launching anything.
	runEditorCommand?:
		| ((command: string, args: string[]) => Promise<void>)
		| undefined
	// Test seam: TTL for the ephemeral agent-activity line (default 90s).
	statusTtlMs?: number | undefined
	log?: ((line: string) => void) | undefined
	// Called when POST /api/hub/shutdown asks the hub to stop: the composition root closes.
	onShutdown?: (() => void) | undefined
}

export type HubHandle = {
	server: Server
	hub: Hub
	// The dashboard URL to print/open: the public URL when configured, else the bound origin
	// (hostname-based when bound beyond loopback).
	url: string
	// The loopback origin the same-machine CLI reaches the hub at (recorded in the hub lock).
	localUrl: string
	port: number
	close(): Promise<void>
}

// The bind address when --host / SYNEVA_HOST says nothing.
export const DEFAULT_HOST = '127.0.0.1'
// One fixed, documented port: the dashboard has one address on a machine, and every agent on it
// finds the hub there without a lock file. --port / SYNEVA_PORT override it.
export const DEFAULT_HUB_PORT = 4747
