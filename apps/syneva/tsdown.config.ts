import baseConfig from '@nextnode-solutions/standards/tsdown'
import { defineConfig } from 'tsdown'

// Two bundles (assembly: scripts/build-dist.mjs): cli = the bin (dist/cli.js, shebang kept from the entry source); pi-bridge = the module the pi extension imports at runtime (dynamic path, no dts).
// Local bundles from its TS entries (internal .js specifiers resolve to .ts sources), core and contracts from their built dist through their package exports; harness peers stay external on the host install.
export default defineConfig({
	...baseConfig,
	entry: {
		cli: '../../packages/local/src/bootstrap/cli.ts',
		'pi-bridge':
			'../../packages/local/src/adapters/inbound/pi/pi-bridge.ts',
	},
	platform: 'node',
	dts: false,
	// `ws` (local's stream server) is the one package the bin inlines: its optional native addons
	// stay optional requires, and bundling any other package fails the build.
	deps: { onlyBundle: ['ws'] },
})
