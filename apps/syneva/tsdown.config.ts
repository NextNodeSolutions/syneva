import baseConfig from '@nextnode-solutions/standards/tsdown'
import { defineConfig } from 'tsdown'

// The published package's two bundles (the assembly flow lives in
// scripts/build-dist.mjs, which calls tsdown's build API with this config):
//
// - cli: the bin (dist/cli.js, shebang kept from the entry source).
// - pi-bridge: the module the pi extension imports at runtime (BRIDGE path in
//   extension/syneva.ts - a dynamic path, never a static import, so no dts).
//
// The backend workspace package is bundled from its TS entry; its internal
// .js specifiers resolve to the .ts sources. @syneva/backend and
// @syneva/contracts are regular dependencies (bundled); the harness peers in
// peerDependencies stay external and resolve from the host pi install.
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
