// React keys for a diagram's edges: the same pair with the same label may legitimately appear twice, so the key counts its occurrence instead of leaning on the array index.
export function edgeKeys(
	edges: readonly { from: string; to: string; label?: string | undefined }[],
): string[] {
	const seen = new Map<string, number>()
	return edges.map(edge => {
		const base = `${edge.from}→${edge.to}:${edge.label ?? ''}`
		const occurrence = seen.get(base) ?? 0
		seen.set(base, occurrence + 1)
		return `${base}#${occurrence}`
	})
}

export function lineKeys(lines: readonly { text: string }[]): string[] {
	return edgeKeys(lines.map(line => ({ from: line.text, to: '' })))
}
