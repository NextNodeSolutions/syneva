import { useState } from 'react'

import type { HubProject } from '@entities/hub/model'

// The order rows were last shown in: each project by root, its desks by id.
type Slot = { root: string; ids: readonly string[] }
type Order = readonly Slot[]

function orderOf(projects: readonly HubProject[]): Order {
	return projects.map(project => ({
		root: project.root,
		ids: project.desks.map(desk => desk.id),
	}))
}

// Keep every slot that is still listed where it was, drop what left, and append what is new:
// new desks at the end of their project, new projects at the end of the page.
function holdOrder(order: Order, projects: readonly HubProject[]): Order {
	const fresh = orderOf(projects)
	const freshByRoot = new Map(fresh.map(slot => [slot.root, slot.ids]))
	const kept = order.flatMap(slot => {
		const listed = freshByRoot.get(slot.root)
		if (!listed) return []
		const stayed = slot.ids.filter(id => listed.includes(id))
		const joined = listed.filter(id => !slot.ids.includes(id))
		return [{ root: slot.root, ids: [...stayed, ...joined] }]
	})
	const keptRoots = new Set(kept.map(slot => slot.root))
	return [...kept, ...fresh.filter(slot => !keptRoots.has(slot.root))]
}

function isSameList(a: readonly string[], b: readonly string[]): boolean {
	return (
		a.length === b.length && a.every((entry, index) => entry === b[index])
	)
}

function isSameOrder(a: Order, b: Order): boolean {
	return (
		a.length === b.length &&
		a.every((slot, index) => {
			const other = b[index]
			return (
				!!other &&
				slot.root === other.root &&
				isSameList(slot.ids, other.ids)
			)
		})
	)
}

// The fresh projects and desks, laid out in `order` (which names exactly what they hold).
function arrange(projects: readonly HubProject[], order: Order): HubProject[] {
	const byRoot = new Map(projects.map(project => [project.root, project]))
	return order.flatMap(slot => {
		const project = byRoot.get(slot.root)
		if (!project) return []
		const byId = new Map(project.desks.map(desk => [desk.id, desk]))
		const desks = slot.ids.flatMap(id => byId.get(id) ?? [])
		return [{ ...project, desks }]
	})
}

// The listing in a stable order while the reviewer is at it. `lastActivityAt` moves with
// every request a desk serves (an open tab's polls included), so the most-recent-first order
// reshuffles every couple of seconds: rows would swap under the pointer or the focus. While
// `isHeld`, the rows keep the order they were last shown in and only their contents refresh;
// once released, the next render takes the fresh order. The last shown order is state, set
// during render when it changes (React's "store information from previous renders" pattern):
// the arrangement returned is computed from it in the same render, so nothing lags a frame.
export function useHeldOrder(
	projects: readonly HubProject[],
	{ isHeld }: { isHeld: boolean },
): HubProject[] {
	const [shown, setShown] = useState<Order>(() => orderOf(projects))
	const next = isHeld ? holdOrder(shown, projects) : orderOf(projects)
	if (!isSameOrder(shown, next)) setShown(next)
	return arrange(projects, next)
}
