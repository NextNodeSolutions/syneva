const HTML_ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
}

export function esc(s: string | number | boolean | null | undefined): string {
	return String(s ?? '').replace(/[&<>]/g, c => HTML_ESCAPES[c] ?? c)
}
