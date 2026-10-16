// Who owns what: a domain's members resolved to the inventory's changed units and file operations, one primary owner per unit.
import { indexed } from './guide-parse.js'

import type {
	Guide,
	GuideDomain,
	GuideIssue,
	GuideMember,
	OwnedUnit,
} from './guide-shapes.js'
import type { InventoryUnit, ReviewInventory } from './inventory.js'

// Overlap on the same file and side (the contract's spanOverlaps, mirrored).
export function spanOverlaps(
	span: { lineNumber: number; endLine?: number | undefined },
	unit: { lineNumber: number; endLine?: number | undefined },
): boolean {
	const spanEnd = span.endLine ?? span.lineNumber
	const unitEnd = unit.endLine ?? unit.lineNumber
	return span.lineNumber <= unitEnd && unit.lineNumber <= spanEnd
}

export type Ownership = {
	// Per domain id: the units and file operations its members resolve to now.
	domains: Map<string, { units: OwnedUnit[]; files: string[] }>
	unassigned: { units: string[]; files: string[] }
	issues: GuideIssue[]
}

type Claim = { domainId: string; field: string }

export function unitsOverlapping(
	member: Extract<GuideMember, { kind: 'change' }>,
	inventory: ReviewInventory,
): InventoryUnit[] {
	return inventory.units.filter(
		unit =>
			unit.path === member.path &&
			unit.side === member.side &&
			spanOverlaps(member, unit),
	)
}

function claimUnit(
	claims: Map<string, Claim>,
	key: string,
	claim: Claim,
	issues: GuideIssue[],
): void {
	const first = claims.get(key)
	if (first && first.domainId !== claim.domainId) {
		issues.push({
			field: claim.field,
			target: key,
			reason: `changed block ${key} is already owned by domain "${first.domainId}" (${first.field}); every changed unit has one primary owner - use a reference for shared context`,
		})
		return
	}
	claims.set(key, claim)
}

function describeSpan(
	member: Extract<GuideMember, { kind: 'change' }>,
): string {
	const end = member.endLine ? `-${member.endLine}` : ''
	return `${member.path}:${member.side}:${member.lineNumber}${end}`
}

function resolveChangeMember(
	member: Extract<GuideMember, { kind: 'change' }>,
	claim: Claim,
	inventory: ReviewInventory,
	acc: {
		claims: Map<string, Claim>
		issues: GuideIssue[]
		owned: OwnedUnit[]
	},
): void {
	const units = unitsOverlapping(member, inventory)
	if (!units.length) {
		acc.issues.push({
			field: claim.field,
			target: describeSpan(member),
			reason: `no changed block at ${describeSpan(member)}; members name a line of a changed block on its side (see the inventory's units)`,
		})
		return
	}
	for (const unit of units) {
		claimUnit(acc.claims, unit.key, claim, acc.issues)
		if (acc.claims.get(unit.key)?.domainId === claim.domainId)
			acc.owned.push({ key: unit.key, contentHash: unit.contentHash })
	}
}

function resolveFileMember(
	member: Extract<GuideMember, { kind: 'file' }>,
	claim: Claim,
	inventory: ReviewInventory,
	acc: {
		fileClaims: Map<string, Claim>
		issues: GuideIssue[]
		owned: string[]
	},
): void {
	if (!inventory.fileUnits.includes(member.path)) {
		const hasBlocks = inventory.units.some(
			unit => unit.path === member.path,
		)
		acc.issues.push({
			field: claim.field,
			target: member.path,
			reason: hasBlocks
				? `${member.path} has changed blocks; own them with "change" members, not a "file" member`
				: `${member.path} is not a file of this review (see the inventory's fileUnits)`,
		})
		return
	}
	const first = acc.fileClaims.get(member.path)
	if (first && first.domainId !== claim.domainId) {
		acc.issues.push({
			field: claim.field,
			target: member.path,
			reason: `${member.path} is already owned by domain "${first.domainId}" (${first.field})`,
		})
		return
	}
	acc.fileClaims.set(member.path, claim)
	acc.owned.push(member.path)
}

function resolveDomainMembers(
	domain: GuideDomain,
	domainIndex: number,
	inventory: ReviewInventory,
	state: {
		claims: Map<string, Claim>
		fileClaims: Map<string, Claim>
		issues: GuideIssue[]
	},
): { units: OwnedUnit[]; files: string[] } {
	const units: OwnedUnit[] = []
	const files: string[] = []
	for (const [memberIndex, member] of domain.members.entries()) {
		const claim = {
			domainId: domain.id,
			field: indexed(
				`${indexed('guide.domains', domainIndex)}.members`,
				memberIndex,
			),
		}
		if (member.kind === 'change')
			resolveChangeMember(member, claim, inventory, {
				...state,
				owned: units,
			})
		else
			resolveFileMember(member, claim, inventory, {
				...state,
				owned: files,
			})
	}
	return { units: dedupe(units), files: [...new Set(files)] }
}

function dedupe(units: OwnedUnit[]): OwnedUnit[] {
	const seen = new Set<string>()
	return units.filter(unit => {
		if (seen.has(unit.key)) return false
		seen.add(unit.key)
		return true
	})
}

// Every member resolved and every unit claimed once; what no domain claims is reported as unassigned, for the attach to refuse or the reload to list.
export function resolveOwnership(
	guide: Guide,
	inventory: ReviewInventory,
): Ownership {
	const issues: GuideIssue[] = []
	const state = {
		claims: new Map<string, Claim>(),
		fileClaims: new Map<string, Claim>(),
		issues,
	}
	const domains = new Map<string, { units: OwnedUnit[]; files: string[] }>()
	for (const [index, domain] of guide.domains.entries())
		domains.set(
			domain.id,
			resolveDomainMembers(domain, index, inventory, state),
		)
	return {
		domains,
		unassigned: {
			units: inventory.units
				.map(unit => unit.key)
				.filter(key => !state.claims.has(key)),
			files: inventory.fileUnits.filter(
				path => !state.fileClaims.has(path),
			),
		},
		issues,
	}
}
