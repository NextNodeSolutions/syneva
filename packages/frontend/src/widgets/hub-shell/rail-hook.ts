// The DOM hook on the hub's rail over a desk: the rail answers its own keys (its links and
// buttons take Enter and Space), so the desk's hotkeys leave alone a key pressed inside it. A
// module of its own, so the desk reads it without loading the rail, which arrives after the
// desk's first paint.
export function isInRail(target: EventTarget | null): boolean {
	return (
		target instanceof Element && target.closest('[data-hub-rail]') !== null
	)
}
