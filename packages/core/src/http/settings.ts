// The reviewer's preferences as both settings routes serve them (a desk's /settings in
// routes/desk.ts, the hub's own in hub-routes.ts, over the same SettingsPort).
import {
	keepMachineSettings,
	withoutMachineSettings,
} from '../application/machine-settings.js'

import type { SettingsPort } from '../application/ports.js'
import type { RequestChannel } from './exchange.js'

// The port as a request on `channel` may use it: whole for the machine's own requests; for one
// the web relayed, the machine's own keys never read and never written (contracts/settings.ts) -
// a relayed write keeps the machine's values rather than refusing the body, because the tab
// posts every preference on each change, so a refusal would fail the web's display settings
// too. This holds whatever the relay's allowlist lets through.
export function settingsFor(
	port: SettingsPort,
	channel: RequestChannel,
): SettingsPort {
	if (channel === 'direct') return port
	return {
		read: async () => withoutMachineSettings(await port.read()),
		write: async written =>
			port.write(keepMachineSettings(written, await port.read())),
	}
}
