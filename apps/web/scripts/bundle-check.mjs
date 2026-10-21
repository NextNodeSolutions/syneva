// The object's bundle is contracts, the web's own code and the runtime, nothing else (RFC 6.3,
// R12; 6.1 H5): fails when dist/server/entry.mjs imports any module but `cloudflare:workers`, or
// holds a timer, an alarm or a storage call (R2, R4: what keeps an object awake or writes rows).
// Lint holds the source; this holds what ships, a dependency's code included. Prints its size.
import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const ENTRY = path.join(ROOT, 'dist/server/entry.mjs')
const ALLOWED_IMPORTS = new Set(['cloudflare:workers'])
const BANNED = ['setTimeout(', 'setInterval(', '.setAlarm(', 'ctx.storage']
const KIB = 1024

const source = readFileSync(ENTRY, 'utf8')
// A static import or re-export starts its line in a bundle; the pages' prose may say "from".
const imports = [
	...source.matchAll(
		/^\s*(?:import|export)\b[^;"'`]*?\bfrom\s*["']([^"']+)["']/gm,
	),
	...source.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g),
	...source.matchAll(/^\s*import\s*["']([^"']+)["']/gm),
].map(match => match[1])
const strays = [...new Set(imports)].filter(name => !ALLOWED_IMPORTS.has(name))
const found = BANNED.filter(needle => source.includes(needle))
const problems = [
	...strays.map(name => `imports ${name}`),
	...found.map(needle => `contains ${needle}`),
]
const size = (statSync(ENTRY).size / KIB).toFixed(1)
if (problems.length) {
	process.stderr.write(
		`bundle check: dist/server/entry.mjs ${problems.join(', ')} (RFC 0001, 6.3 R2, R4, R12)\n`,
	)
	process.exit(1)
}
process.stdout.write(
	`bundle check: dist/server/entry.mjs ${size} KiB, imports ${[...ALLOWED_IMPORTS].join(', ')} only, no timer, alarm or storage call\n`,
)
