// The structure of a drafted domain, exact by construction: its members as the fewest spans that cover its blocks and no other domain's (consecutive blocks of one file side become one span), and one `changed` reference per declaration it changes, so an explanation can point at any of them by id.
import { GUIDE_LIMITS } from './guide-shapes.js'

import type { GuideMember, GuideReference } from './guide-shapes.js'
import type { InventoryUnit } from './inventory.js'

function sideKey(unit: Pick<InventoryUnit, 'path' | 'side'>): string {
	return `${unit.side}\0${unit.path}`
}

// Per file side, every unit of the review in line order: a span must stop before a unit it does not own.
export type SideOrder = ReadonlyMap<string, readonly InventoryUnit[]>

export function sideOrder(units: readonly InventoryUnit[]): SideOrder {
	const order = new Map<string, InventoryUnit[]>()
	for (const unit of units)
		order.set(sideKey(unit), [...(order.get(sideKey(unit)) ?? []), unit])
	for (const [key, run] of order)
		order.set(
			key,
			run.toSorted((a, b) => a.lineNumber - b.lineNumber),
		)
	return order
}

// The owned units of one file side, split where another unit sits between them.
function runsOf(
	side: readonly InventoryUnit[],
	owned: ReadonlySet<string>,
): InventoryUnit[][] {
	const runs: InventoryUnit[][] = []
	let current: InventoryUnit[] = []
	for (const unit of side) {
		if (owned.has(unit.key)) current.push(unit)
		else if (current.length) {
			runs.push(current)
			current = []
		}
	}
	return current.length ? [...runs, current] : runs
}

function spanMember(run: readonly InventoryUnit[]): GuideMember | null {
	const [first] = run
	const last = run.at(-1)
	if (!first || !last) return null
	return {
		kind: 'change',
		path: first.path,
		side: first.side,
		lineNumber: first.lineNumber,
		endLine: Math.max(first.endLine, last.endLine),
	}
}

export function draftMembers(
	units: readonly InventoryUnit[],
	files: readonly string[],
	order: SideOrder,
): GuideMember[] {
	const owned = new Set(units.map(unit => unit.key))
	const sides = [...new Set(units.map(sideKey))].toSorted()
	const spans = sides.flatMap(key =>
		runsOf(order.get(key) ?? [], owned).flatMap(
			run => spanMember(run) ?? [],
		),
	)
	return [
		...spans,
		...files.map((file): GuideMember => ({ kind: 'file', path: file })),
	]
}

// Room kept under the id bound for a `-N` suffix; the second holder of a name is `-2`.
const SUFFIX_ROOM = 4
const FIRST_SUFFIX = 2
const ID_INVALID = /[^A-Za-z0-9._:-]+/g
const ID_EDGES = /^[^A-Za-z0-9]+|-+$/g

// A declaration's name as a reference id: `Hub.open` stays, `describe("guide")` becomes `describe-guide`.
export function referenceId(name: string, taken: Set<string>): string {
	const base =
		name
			.replace(ID_INVALID, '-')
			.replace(ID_EDGES, '')
			.slice(0, GUIDE_LIMITS.idChars - SUFFIX_ROOM) || 'ref'
	let id = base
	let suffix = FIRST_SUFFIX
	while (taken.has(id)) {
		id = `${base}-${suffix}`
		suffix++
	}
	taken.add(id)
	return id
}

// One reference per changed declaration, at its first block; the most-changed declarations first, within the per-domain bound.
export function draftReferences(
	units: readonly InventoryUnit[],
	taken: Set<string>,
): GuideReference[] {
	const firstBlock = new Map<string, InventoryUnit>()
	const counts = new Map<string, number>()
	for (const unit of units) {
		const name = unit.symbol?.name
		if (!name) continue
		counts.set(name, (counts.get(name) ?? 0) + 1)
		const seen = firstBlock.get(name)
		if (!seen || unit.lineNumber < seen.lineNumber)
			firstBlock.set(name, unit)
	}
	return [...firstBlock]
		.toSorted(
			([a], [b]) =>
				(counts.get(b) ?? 0) - (counts.get(a) ?? 0) ||
				a.localeCompare(b),
		)
		.slice(0, GUIDE_LIMITS.referencesPerDomain)
		.map(([name, unit]) => ({
			id: referenceId(name, taken),
			role: 'changed',
			path: unit.path,
			side: unit.side,
			lineNumber: unit.lineNumber,
			endLine: unit.endLine,
			label: name.slice(0, GUIDE_LIMITS.labelChars),
		}))
}
