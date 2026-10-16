// What a posted guide names outright - change spans, file operations, declarations - resolved against the inventory, each block owned by one posted domain. `domain` members are not claims: they inherit (guide-compose.ts).
import { unitsOverlapping } from './guide-ownership.js'
import { indexed } from './guide-parse.js'

import type {
	AuthoredDomain,
	AuthoredMember,
	GuideIssue,
} from './guide-shapes.js'
import type { ReviewInventory } from './inventory.js'

export type Claims = {
	// Per unit key and per file operation, the posted domain that names it.
	readonly units: Map<string, string>
	readonly files: Map<string, string>
	readonly issues: GuideIssue[]
}

type Claim = { readonly domainId: string; readonly field: string }

// A declaration owns its own blocks and, for a class, its members' (`Hub` takes `Hub.open`).
function declarationUnits(
	member: Extract<AuthoredMember, { kind: 'symbol' }>,
	inventory: ReviewInventory,
): string[] {
	return inventory.units
		.filter(
			unit =>
				unit.path === member.path &&
				(unit.symbol?.name === member.symbol ||
					unit.symbol?.name.startsWith(`${member.symbol}.`)),
		)
		.map(unit => unit.key)
}

function unitsNamed(
	member: AuthoredMember,
	inventory: ReviewInventory,
): { keys: string[]; problem?: string } {
	if (member.kind === 'change') {
		const keys = unitsOverlapping(member, inventory).map(unit => unit.key)
		const span = `${member.path}:${member.side}:${member.lineNumber}${member.endLine ? `-${member.endLine}` : ''}`
		return keys.length
			? { keys }
			: {
					keys,
					problem: `no changed block at ${span}; a "change" member names a line of a changed block on its side`,
				}
	}
	if (member.kind === 'symbol') {
		const keys = declarationUnits(member, inventory)
		return keys.length
			? { keys }
			: {
					keys,
					problem: `no changed block of ${member.symbol} in ${member.path}`,
				}
	}
	return { keys: [] }
}

function claimOnce(
	owners: Map<string, string>,
	target: string,
	claim: Claim,
	issues: GuideIssue[],
): void {
	const owner = owners.get(target)
	if (owner && owner !== claim.domainId) {
		issues.push({
			field: claim.field,
			target,
			reason: `${target} is already named by domain "${owner}"; every changed block has one owner - use a reference to point at it from another domain`,
		})
		return
	}
	owners.set(target, claim.domainId)
}

function claimFile(
	member: Extract<AuthoredMember, { kind: 'file' }>,
	claim: Claim,
	inventory: ReviewInventory,
	claims: Claims,
): void {
	if (inventory.fileUnits.includes(member.path)) {
		claimOnce(claims.files, member.path, claim, claims.issues)
		return
	}
	const hasBlocks = inventory.units.some(unit => unit.path === member.path)
	claims.issues.push({
		field: claim.field,
		target: member.path,
		reason: hasBlocks
			? `${member.path} has changed blocks; own them with "change" or "symbol" members, not a "file" member`
			: `${member.path} is not a file operation of this review`,
	})
}

function claimMember(
	member: AuthoredMember,
	claim: Claim,
	inventory: ReviewInventory,
	claims: Claims,
): void {
	if (member.kind === 'domain') return
	if (member.kind === 'file') {
		claimFile(member, claim, inventory, claims)
		return
	}
	const named = unitsNamed(member, inventory)
	if (named.problem)
		claims.issues.push({ field: claim.field, reason: named.problem })
	for (const key of named.keys)
		claimOnce(claims.units, key, claim, claims.issues)
}

export function explicitClaims(
	domains: readonly AuthoredDomain[],
	inventory: ReviewInventory,
): Claims {
	const claims: Claims = { units: new Map(), files: new Map(), issues: [] }
	for (const [domainIndex, domain] of domains.entries())
		for (const [memberIndex, member] of (domain.members ?? []).entries())
			claimMember(
				member,
				{
					domainId: domain.id,
					field: indexed(
						`${indexed('guide.domains', domainIndex)}.members`,
						memberIndex,
					),
				},
				inventory,
				claims,
			)
	return claims
}
