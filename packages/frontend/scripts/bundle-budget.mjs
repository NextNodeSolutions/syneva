// Count the entire static import closure, not just ui.js: shared chunks can hide an eager
// grammar import behind a deceptively tiny entry point. Dynamic islands have a separate cap.
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

export const INITIAL_UI_BYTES_LIMIT = 405_000
// React 19's runtime (react + react-dom) rides in the initial closure now that the
// chrome is React - ~134 KB minified. Since the desk moved onto StyleX, every style
// object also ships as a class-name map (~27 KB minified, plus StyleX's ~3 KB runtime):
// the 83 KB stylesheet the page shell used to inline left for the shared styles.css,
// so the desk's whole cold payload (shell + CSS + JS, 133 KB gzipped) stays within 6%
// of what it was. 392 KB measured; the limit sits just above so the next real
// regression (a leaked grammar, a fat dep) still trips it.
// The total is mostly shiki's full grammar set: @pierre/diffs resolves languages through shiki's
// bundled loaders, so every grammar ships as its own lazy chunk and loads only when a file or a
// fence asks for it. The rest is Pierre's highlight worker (~210 KB) and the oniguruma wasm its
// workers load. The cold open is guarded by the INITIAL limit above; this one only catches a new
// dependency landing wholesale.
const TOTAL_UI_BYTES_LIMIT = 11_500_000

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
