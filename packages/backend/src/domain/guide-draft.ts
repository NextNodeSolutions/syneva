// The guide Syneva drafts for code no agent has explained yet: the partition's groups (guide-partition.ts) as domains, worded from facts (guide-draft-text.ts), owning their blocks exactly (guide-draft-members.ts). A draft is a valid guide as it stands - the desk opens guided on it at once - and an agent's explanation replaces it domain by domain (guide-compose.ts).
import { domainId } from './guide-draft-ids.js'
import {
	draftMembers,
	draftReferences,
	sideOrder,
} from './guide-draft-members.js'
import {
	draftConsequence,
	draftSummary,
	draftTitle,
	pathsOf,
	riskPrior,
} from './guide-draft-text.js'
import { partitionChanges } from './guide-partition.js'
import { GUIDE_FORMAT, GUIDE_LIMITS } from './guide-shapes.js'
import { symbolNode } from './symbol-links.js'

import type { SideOrder } from './guide-draft-members.js'
import type { DraftFacts } from './guide-draft-text.js'
import type { PartitionUnit } from './guide-graph.js'
import type { Guide, GuideDomain } from './guide-shapes.js'
import type { InventoryUnit, ReviewInventory } from './inventory.js'

export type DraftScope = {
	readonly units: ReadonlySet<string>
	readonly files: ReadonlySet<string>
}

export type DraftInput = {
	readonly inventory: ReviewInventory
	// Per unit key, the changed declarations its declaration references (ChangeState.links).
	readonly links: ReadonlyMap<string, readonly string[]>
	readonly scope: DraftScope
	// Domain and reference ids already in use (the explained domains'), never reused by the draft.
	readonly takenIds: ReadonlySet<string>
	readonly maxDomains: number
}

// The most domains a draft gives a changeset (the partition aims at about √n below it).
export const DRAFT_DOMAINS_MAX = 25
const SHOWN_RELATED = 5
const SHOWN_LINKED_NAMES = 3

function partitionUnit(links: ReadonlyMap<string, readonly string[]>) {
	return (unit: InventoryUnit): PartitionUnit => ({
		key: unit.key,
		path: unit.path,
		lineNumber: unit.lineNumber,
		symbol: unit.symbol?.name,
		links: links.get(unit.key),
	})
}

// A group whose members would pass the per-domain bound is cut by file, in path order.
function bounded(facts: DraftFacts, order: SideOrder): DraftFacts[] {
	const paths = pathsOf(facts).toSorted()
	const chunks: DraftFacts[] = []
	let current: { units: InventoryUnit[]; files: string[]; members: number } =
		{ units: [], files: [], members: 0 }
	for (const filePath of paths) {
		const units = facts.units.filter(unit => unit.path === filePath)
		const files = facts.files.filter(file => file === filePath)
		const members = draftMembers(units, files, order).length
		if (
			current.members &&
			current.members + members > GUIDE_LIMITS.membersPerDomain
		) {
			chunks.push(current)
			current = { units: [], files: [], members: 0 }
		}
		current = {
			units: [...current.units, ...units],
			files: [...current.files, ...files],
			members: current.members + members,
		}
	}
	return [...chunks, current].filter(
		chunk => chunk.units.length || chunk.files.length,
	)
}

function isOversized(facts: DraftFacts, order: SideOrder): boolean {
	return (
		draftMembers(facts.units, facts.files, order).length >
		GUIDE_LIMITS.membersPerDomain
	)
}

function domainOf(
	facts: DraftFacts,
	order: SideOrder,
	ids: { domains: Set<string>; refs: Set<string> },
): GuideDomain {
	return {
		id: domainId(facts, ids.domains),
		title: draftTitle(facts),
		risk: riskPrior(facts),
		consequence: draftConsequence(facts),
		summary: draftSummary(facts),
		members: draftMembers(facts.units, facts.files, order),
		references: draftReferences(facts.units, ids.refs),
		blocks: [],
	}
}

// Each domain points at the domains whose declarations it references, the most-referenced first.
function withRelated(
	domains: GuideDomain[],
	facts: readonly DraftFacts[],
	links: ReadonlyMap<string, readonly string[]>,
): GuideDomain[] {
	const domainOfNode = new Map(
		facts.flatMap((fact, position) =>
			fact.units.flatMap(unit =>
				unit.symbol
					? [
							[
								symbolNode(unit.path, unit.symbol.name),
								position,
							] as const,
						]
					: [],
			),
		),
	)
	return domains.map((domain, position) => {
		const named = new Map<number, Set<string>>()
		for (const target of (facts[position]?.units ?? []).flatMap(
			unit => links.get(unit.key) ?? [],
		)) {
			const other = domainOfNode.get(target)
			if (other === position || typeof other !== 'number') continue
			named.set(
				other,
				(named.get(other) ?? new Set()).add(
					target.slice(target.indexOf('#') + 1),
				),
			)
		}
		const related = [...named]
			.toSorted((a, b) => b[1].size - a[1].size || a[0] - b[0])
			.slice(0, SHOWN_RELATED)
			.map(([other, names]) => ({
				domainId: domains[other]?.id ?? '',
				note: `uses ${[...names].slice(0, SHOWN_LINKED_NAMES).join(', ')}`,
			}))
			.filter(link => link.domainId)
		return related.length ? { ...domain, related } : domain
	})
}

// The domains a draft gives the scoped code, in the partition's order (largest first; the risk prior sorts them on screen).
export function draftDomains(input: DraftInput): GuideDomain[] {
	const units = input.inventory.units.filter(unit =>
		input.scope.units.has(unit.key),
	)
	const files = input.inventory.fileUnits.filter(file =>
		input.scope.files.has(file),
	)
	if (!input.maxDomains || (!units.length && !files.length)) return []
	const byKey = new Map(units.map(unit => [unit.key, unit]))
	const order = sideOrder(input.inventory.units)
	const facts = partitionChanges(
		units.map(partitionUnit(input.links)),
		files,
		input.maxDomains,
	)
		.map(group => ({
			units: group.units.flatMap(key => byKey.get(key) ?? []),
			files: group.files,
		}))
		.flatMap(group =>
			isOversized(group, order) ? bounded(group, order) : [group],
		)
	const ids = { domains: new Set(input.takenIds), refs: new Set<string>() }
	const domains = facts.map((fact, position) => ({
		...domainOf(fact, order, ids),
		order: position,
	}))
	return withRelated(domains, facts, input.links)
}

export function draftOverview(
	inventory: ReviewInventory,
	domains: readonly GuideDomain[],
): string {
	const files = new Set([
		...inventory.units.map(unit => unit.path),
		...inventory.fileUnits,
	]).size
	const operations = inventory.fileUnits.length
		? ` and ${inventory.fileUnits.length} file operations`
		: ''
	return `Drafted by Syneva from the code's structure: ${domains.length} domains over ${inventory.units.length} changed blocks${operations} in ${files} files. Each domain gathers the declarations that reference each other, with their tests, styles and neighbours. The agent's explanations replace these drafts as they arrive.`
}

// The whole changeset drafted: what a guided desk opens on before any agent has written a word.
export function draftGuide(
	inventory: ReviewInventory,
	links: ReadonlyMap<string, readonly string[]>,
	maxDomains: number,
): Guide {
	const domains = draftDomains({
		inventory,
		links,
		scope: {
			units: new Set(inventory.units.map(unit => unit.key)),
			files: new Set(inventory.fileUnits),
		},
		takenIds: new Set(),
		maxDomains,
	})
	return {
		format: GUIDE_FORMAT,
		source: {
			mode: inventory.mode,
			fingerprint: inventory.fingerprint,
			head: inventory.head,
			base: inventory.base,
			staged: inventory.staged,
			path: inventory.path,
		},
		overview: draftOverview(inventory, domains),
		domains,
	}
}
