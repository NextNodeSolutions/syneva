// Count the entire static import closure, not just ui.js: shared chunks can hide an eager grammar import behind a deceptively tiny entry point.
export function staticBundleBytes(outputs, entry) {
	const visited = new Set()
	const pending = [entry]
	let bytes = 0
	while (pending.length) {
		const filename = pending.pop()
		if (visited.has(filename)) continue
		visited.add(filename)
		const output = outputs[filename]
		if (!output) throw new Error(`Missing build output: ${filename}`)
		bytes += output.bytes
		pending.push(
			...output.imports
				.filter(
					dependency =>
						!dependency.external &&
						dependency.kind !== 'dynamic-import',
				)
				.map(dependency => dependency.path),
		)
	}
	return bytes
}

export const INITIAL_UI_BYTES_LIMIT = 416_000
// React 19 (~134 KB minified) + StyleX class maps/runtime leave the 133 KB gzip cold payload within
// 6% of before; the limit sat just above the measured 392 KB, then moved to 415 KB for the guided
// review's cold chrome (the domain moves, the position strip's steps, the keys: ~8 KB measured at
// 408 KB) - the explanation pane, the diagrams, the navigator and the guide decoders ride lazy
// chunks and never count here - and to 416 KB for the system canvas's door on the overview (its
// slot, its lazy import and the domain numbers, ~1 KB measured at 415.9 KB): React Flow and the
// canvas itself ride their own lazy chunk. The total is mostly shiki's grammar set (one lazy chunk per
// grammar), Pierre's worker (~210 KB) and the oniguruma wasm; the initial limit guards the cold
// open, the total only catches a wholesale new dependency. ELK (the graph diagrams' layout engine,
// ~1.6 MB, in the diagrams' lazy chunk: loaded by the first flow or state diagram on screen, never
// by a review without one) moved it from 11.5 MB to 13 MB.
const TOTAL_UI_BYTES_LIMIT = 13_000_000

export function checkBundleBudget(outputs, entry) {
	const initialLimit = INITIAL_UI_BYTES_LIMIT
	const totalLimit = TOTAL_UI_BYTES_LIMIT
	const initial = staticBundleBytes(outputs, entry)
	const total = Object.values(outputs).reduce(
		(sum, output) => sum + output.bytes,
		0,
	)
	if (initial > initialLimit || total > totalLimit)
		throw new Error(
			`UI bundle budget exceeded: initial ${initial}/${initialLimit}, total ${total}/${totalLimit} bytes`,
		)
	process.stderr.write(
		`esbuild: initial UI graph ${initial} bytes; all UI chunks ${total} bytes\n`,
	)
	return { initial, total }
}
