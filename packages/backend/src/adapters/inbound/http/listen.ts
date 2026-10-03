import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { platformOpenCommand } from '../../platform-open.js'

import type { Server } from 'node:http'

const execFileAsync = promisify(execFile)

// Bind the hub to its port - strictly. The port is the hub's address on the machine (every
// agent and every tab find it there), so a collision is a fact the caller must act on (another
// hub already answers there, or a foreign process holds it), never something to paper over
// with a random port nobody knows about.
export async function listenOn(
	server: Server,
	port: number,
	host: string,
): Promise<void> {
	await new Promise<void>((resolve, reject) => {
		const onError = (error: NodeJS.ErrnoException): void => {
			server.removeListener('listening', onListening)
			reject(error)
		}
		const onListening = (): void => {
			server.removeListener('error', onError)
			resolve()
		}
		server.once('error', onError)
		server.once('listening', onListening)
		server.listen(port, host)
	})
}

// Open a URL in the reviewer's browser. Best-effort on purpose: a machine with no opener (a
// container, a headless box) must still get a working hub - the URL is printed either way.
export async function openBrowser(url: string): Promise<void> {
	const { command, args } = platformOpenCommand(url)
	await execFileAsync(command, args).catch(() => undefined)
}
