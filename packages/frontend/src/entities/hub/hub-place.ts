// Only a loopback hub restarts with a plain `syneva start`: one reached over the network was started with --host and --key, and a plain start (or an agent's auto-start) would bind loopback only, out of this browser's reach.
export type HubPlace = 'loopback' | 'network'

const LOOPBACK_HOSTS: ReadonlySet<string> = new Set([
	'127.0.0.1',
	'localhost',
	'[::1]',
])

export function hubPlace(): HubPlace {
	return LOOPBACK_HOSTS.has(window.location.hostname) ? 'loopback' : 'network'
}
