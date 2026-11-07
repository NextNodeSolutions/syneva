import standards from '@nextnode-solutions/standards/oxfmt'
import { defineConfig } from 'oxfmt'

export default defineConfig({
	...standards,
	ignorePatterns: [
		...standards.ignorePatterns,
		'node_modules/**',
		'dist/**',
		'apps/landing/.astro/**',
		'**/*.md',
		'.pi/**',
	],
})
