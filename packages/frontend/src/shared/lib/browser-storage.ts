// A per-viewer convenience kept on this browser (a remembered layout, the sidebar's fold). Its
// storage can be refused (a private window, blocked site data), which only loses the memory:
// the read finds nothing and the write holds for this page only.
export function readStored(key: string): string | null {
	try {
		return window.localStorage.getItem(key)
	} catch {
		return null
	}
}

export function writeStored(key: string, remembered: string): void {
	try {
		window.localStorage.setItem(key, remembered)
	} catch {
		// Storage refused: the choice holds for this page only.
	}
}
