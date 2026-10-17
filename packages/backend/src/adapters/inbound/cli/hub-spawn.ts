import { spawn } from 'node:child_process'
import { closeSync, realpathSync } from 'node:fs'

import { openHubLog } from '../../outbound/filesystem/hub.js'

import { flagText } from './args.js'
import { hubKey } from './hub-client.js'

import type { CliArgs } from './args.js'

// The key travels to the background hub through its environment only (SYNEVA_KEY, which the hub reads like a flag): argv is readable by every process on the machine, the environment by the same user alone.
function keyEnv(key: string | undefined): { SYNEVA_KEY: string } | undefined {
	if (!key) return undefined
	return { SYNEVA_KEY: key }
}

// The background hub must bind exactly as asked: the port, host and --insecure go on its command line, the key in its environment. A flag dropped here would start an open hub on an address the user did not ask for, or one they believe is keyed.
export function startDetachedHub(args: CliArgs): void {
	const entry = realpathSync(process.argv[1] ?? '')
	const port = flagText(args, 'port') ?? process.env.SYNEVA_PORT
	const host = flagText(args, 'host')
	const log = openHubLog()
	const child = spawn(
		process.execPath,
		[
			entry,
			'start',
			'--no-open',
			...(port ? ['--port', port] : []),
			...(host ? ['--host', host] : []),
			...(args.insecure === true ? ['--insecure'] : []),
		],
		{
			detached: true,
			stdio: ['ignore', log, log],
			env: {
				...process.env,
				SYNEVA_NO_UPDATE_CHECK: '1',
				...keyEnv(hubKey(args)),
			},
			windowsHide: true,
		},
	)
	child.unref()
	closeSync(log)
}
