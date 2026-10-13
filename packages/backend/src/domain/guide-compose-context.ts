// What composing a posted guide over the current one works from, and the current domains the post leaves out: kept as they were, kept without the blocks the post took (a drafted one re-drafted over what is left), or dropped once nothing is left.
import { draftMembers } from './guide-draft-members.js'
import { draftDomains } from './guide-draft.js'
import { resolveOwnership } from './guide-ownership.js'

import type { Claims } from './guide-compose-claims.js'
import type { SideOrder } from './guide-draft-members.js'
import type {
	AuthoredDomain,
	Guide,
	GuideDomain,
	GuideIssue,
} from './guide-shapes.js'
import type { InventoryUnit, ReviewInventory } from './inventory.js'

export type CurrentGuide = {
	readonly guide: Guide
	// The domains whose text is still Syneva's draft, and whether the overview is.
	readonly drafted: ReadonlySet<string>
	readonly overviewDrafted: boolean
	// The explained domains whose code moved under them: posting one, its words changed or not, says they hold for the code as it is now.
	readonly stale: ReadonlySet<string>
}

export type Holding = {
	readonly units: ReadonlySet<string>
	readonly files: ReadonlySet<string>
}

export type ComposeContext = {
	readonly inventory: ReviewInventory
	readonly links: ReadonlyMap<string, readonly string[]>
	readonly order: SideOrder
	readonly current: CurrentGuide | undefined
	readonly currentDomains: ReadonlyMap<string, GuideDomain>
	// Per current domain id, the blocks it owns on this diff.
	readonly holdings: ReadonlyMap<string, Holding>
	readonly claims: Claims
	// Per current domain id, the posted domain that inherits it.
	readonly heirs: ReadonlyMap<string, string>
	readonly issues: GuideIssue[]
	readonly unitsOf: (keys: Iterable<string>) => InventoryUnit[]
}

export type Placed = {
	readonly domain: GuideDomain
	readonly isPosted: boolean
	readonly isTouched: boolean
	readonly isDrafted: boolean
}

// The current domains a posted domain inherits, as they hold blocks now.
export function inherited(
	domainId: string,
	context: ComposeContext,
): Holding[] {
	return [...context.heirs]
		.filter(([, heir]) => heir === domainId)
		.flatMap(([currentId]) => context.holdings.get(currentId) ?? [])
}

// Whether the post named any of the domain's blocks for another domain.
export function isTaken(
	holding: Holding | undefined,
	claims: Claims,
	domainId: string,
): boolean {
	const isElsewhere = (owner: string | undefined): boolean =>
		Boolean(owner && owner !== domainId)
	return (
		[...(holding?.units ?? [])].some(key =>
			isElsewhere(claims.units.get(key)),
		) ||
		[...(holding?.files ?? [])].some(file =>
			isElsewhere(claims.files.get(file)),
		)
	)
}

// A drafted domain drawn again over the blocks it holds now, under the same id and in the same place.
export function redrafted(
	domain: GuideDomain,
	left: Holding,
	context: ComposeContext,
): GuideDomain | null {
	const [fresh] = draftDomains({
		inventory: context.inventory,
		links: context.links,
		scope: left,
		takenIds: new Set(),
		maxDomains: 1,
	})
	if (!fresh) return null
	return { ...fresh, id: domain.id, order: domain.order }
}

export function keptDomain(
	domain: GuideDomain,
	context: ComposeContext,
): Placed | null {
	if (context.heirs.has(domain.id)) return null
	const holding = context.holdings.get(domain.id)
	const isDrafted = context.current?.drafted.has(domain.id) ?? false
	const left: Holding = {
		units: new Set(
			[...(holding?.units ?? [])].filter(
				key => !context.claims.units.has(key),
			),
		),
		files: new Set(
			[...(holding?.files ?? [])].filter(
				file => !context.claims.files.has(file),
			),
		),
	}
	if (!left.units.size && !left.files.size) return null
	const placed = { isPosted: false, isTouched: true, isDrafted }
	if (!isTaken(holding, context.claims, domain.id))
		return { ...placed, domain, isTouched: false }
	const fresh = isDrafted
		? redrafted(domain, left, context)
		: {
				...domain,
				members: draftMembers(
					context.unitsOf(left.units),
					[...left.files],
					context.order,
				),
			}
	if (!fresh) return null
	return { ...placed, domain: fresh }
}

// A kept domain's links to a domain the post absorbed are dropped; a posted domain's must name a domain of the composed guide.
export function prunedLinks(
	domain: GuideDomain,
	ids: ReadonlySet<string>,
): GuideDomain {
	const related = domain.related?.filter(link => ids.has(link.domainId))
	const prerequisites = domain.prerequisites?.filter(id => ids.has(id))
	return { ...domain, related, prerequisites }
}

export function domainLinkIssues(
	domains: readonly AuthoredDomain[],
	ids: ReadonlySet<string>,
): GuideIssue[] {
	return domains.flatMap((domain, index) => {
		const where = `guide.domains[${index}]`
		const named = [
			...(domain.prerequisites ?? []).map((id, position) => ({
				id,
				field: `${where}.prerequisites[${position}]`,
			})),
			...(domain.related ?? []).map((link, position) => ({
				id: link.domainId,
				field: `${where}.related[${position}].domainId`,
			})),
		]
		return named.flatMap(({ id, field }): GuideIssue[] => {
			if (id === domain.id)
				return [{ field, reason: `${field} names the domain itself` }]
			if (ids.has(id)) return []
			return [
				{
					field,
					target: id,
					reason: `${field} names "${id}", which is not a domain of the composed guide`,
				},
			]
		})
	})
}

export function currentHoldings(
	current: CurrentGuide | undefined,
	inventory: ReviewInventory,
): Map<string, Holding> {
	if (!current) return new Map()
	const { domains } = resolveOwnership(current.guide, inventory)
	return new Map(
		[...domains].map(([id, owned]) => [
			id,
			{
				units: new Set(owned.units.map(unit => unit.key)),
				files: new Set(owned.files),
			},
		]),
	)
}

// Per current domain id, the posted domain that inherits it: the posted domain of the same id, or the one naming it in a `domain` member.
export function heirsOf(
	domains: readonly AuthoredDomain[],
	context: ComposeContext,
): Map<string, string> {
	const heirs = new Map<string, string>()
	domains.forEach((domain, index) => {
		const field = `guide.domains[${index}]`
		const own = context.holdings.has(domain.id) ? [domain.id] : []
		const named = (domain.members ?? []).flatMap(member =>
			member.kind === 'domain' ? [member.id] : [],
		)
		if (!domain.members && !own.length)
			context.issues.push({
				field: `${field}.members`,
				target: domain.id,
				reason: `domain "${domain.id}" lists no members and the desk's current guide has no domain "${domain.id}" to keep them from`,
			})
		for (const id of [...own, ...named]) {
			const heir = heirs.get(id)
			if (!context.holdings.has(id))
				context.issues.push({
					field: `${field}.members`,
					target: id,
					reason: `the desk's current guide has no domain "${id}"`,
				})
			else if (heir && heir !== domain.id)
				context.issues.push({
					field,
					target: id,
					reason: `domain "${id}" is already taken by "${heir}"`,
				})
			else heirs.set(id, domain.id)
		}
	})
	return heirs
}
