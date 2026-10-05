// DOM lookup shared by the chrome widgets and the imperative diff island. Every id comes
// from the desk's React shell (the diff area mounts #diff and #ovr before the first render
// pass), so a missing element is a bug in the page rather than a runtime condition to
// branch on.
export function $(id: string): HTMLElement {
	const el = document.getElementById(id)
	if (!el) throw new Error(`missing element #${id}`)
	return el
}
