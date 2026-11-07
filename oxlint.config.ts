import standards from '@nextnode-solutions/standards/oxlint'
import { defineConfig } from 'oxlint'

export default defineConfig({
	extends: [standards],
	// Assigning replaces oxlint's built-in list, so node_modules and dist are spelled out.
	ignorePatterns: ['node_modules/**', 'dist/**', '.turbo/**', '.pi/**'],
	overrides: [
		{
			// Husky's official CI guard reports husky()'s status on the console.
			files: ['.husky/install.mjs'],
			rules: { 'eslint/no-console': 'off' },
		},
	],
})
