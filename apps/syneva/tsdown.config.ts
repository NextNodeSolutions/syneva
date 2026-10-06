import baseConfig from '@nextnode-solutions/standards/tsdown'
import { defineConfig } from 'tsdown'

// Two bundles (assembly: scripts/build-dist.mjs): cli = the bin (dist/cli.js, shebang kept from the entry source); pi-bridge = the module the pi extension imports at runtime (dynamic path, no dts).
// The backend bundles from its TS entry (internal .js specifiers resolve to .ts sources); harness peers stay external on the host install.
export default defineConfig({
	...baseConfig,
	entry: {
		cli: '../../packages/backend/src/bootstrap/cli.ts',
		'pi-bridge':
			'../../packages/backend/src/adapters/inbound/pi/pi-bridge.ts',
	},
	platform: 'node',
	dts: false,
})
