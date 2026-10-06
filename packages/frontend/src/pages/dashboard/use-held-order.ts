import { useState } from 'react'

import type { HubDesk } from '@entities/hub/model'

// A listing's groups (a turn's, a project's), each named by a stable key, its desks in order.
type Grouped = { key: string; desks: readonly HubDesk[] }

// The order rows were last shown in: each group by key, its desks by id.
type Slot = { key: string; ids: readonly string[] }
type Order = readonly Slot[]

function orderOf(groups: readonly Grouped[]): Order {
	return groups.map(group => ({
		key: group.key,
		ids: group.desks.map(desk => desk.id),
	}))
}

// Keep every slot that is still listed where it was, drop what left, and append what is new:
// new desks at the end of their group, new groups at the end of the page. A desk that changed
// group leaves its old slot and joins the new one: that move is news, not a reshuffle.
function holdOrder(order: Order, groups: readonly Grouped[]): Order {
	const fresh = orderOf(groups)
	const freshByKey = new Map(fresh.map(slot => [slot.key, slot.ids]))
	const kept = order.flatMap(slot => {
		const listed = freshByKey.get(slot.key)
		if (!listed) return []
		const stayed = slot.ids.filter(id => listed.includes(id))
		const joined = listed.filter(id => !slot.ids.includes(id))
		return [{ key: slot.key, ids: [...stayed, ...joined] }]
	})
	const keptKeys = new Set(kept.map(slot => slot.key))
	return [...kept, ...fresh.filter(slot => !keptKeys.has(slot.key))]
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
				slot.key === other.key &&
				isSameList(slot.ids, other.ids)
			)
		})
	)
}

// The fresh groups and desks, laid out in `order` (which names exactly what they hold).
function arrange<G extends Grouped>(groups: readonly G[], order: Order): G[] {
	const byKey = new Map(groups.map(group => [group.key, group]))
	return order.flatMap(slot => {
		const group = byKey.get(slot.key)
		if (!group) return []
		const byId = new Map(group.desks.map(desk => [desk.id, desk]))
		const desks = slot.ids.flatMap(id => byId.get(id) ?? [])
		return [{ ...group, desks }]
	})
}

// The listing in a stable order while the reviewer is at it: rows never swap under the pointer
// or the focus. While `isHeld`, the rows keep the order they were last shown in and only their
// contents refresh; once released, the next render takes the fresh order. The last shown order
// is state, set during render when it changes (React's "store information from previous
// renders" pattern): the arrangement returned is computed from it in the same render, so
// nothing lags a frame.
export function useHeldOrder<G extends Grouped>(
	groups: readonly G[],
	{ isHeld }: { isHeld: boolean },
): G[] {
	const [shown, setShown] = useState<Order>(() => orderOf(groups))
	const next = isHeld ? holdOrder(shown, groups) : orderOf(groups)
	if (!isSameOrder(shown, next)) setShown(next)
	return arrange(groups, next)
}
