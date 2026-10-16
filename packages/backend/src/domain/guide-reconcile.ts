// The carried guide against a reloaded diff: nothing is rewritten, the attach-time identities stay, and what no longer holds is marked - stale domains with their reasons, references by status, changes no domain owns.
import { resolveOwnership } from './guide-ownership.js'
import { resolveReference } from './guide-reference-resolve.js'
import { resolveGuide } from './guide-resolve.js'
import { fileOperationIdentities } from './inventory.js'

import type { ContextHashes } from './guide-reference-resolve.js'
import type {
	DomainResolution,
	Guide,
	GuideDomain,
	GuideResolution,
	ResolvedReference,
} from './guide-shapes.js'
import type { ReviewInventory } from './inventory.js'

function sameUnits(
	attached: DomainResolution['units'],
	current: DomainResolution['units'],
): boolean {
	if (attached.length !== current.length) return false
	const now = new Map(current.map(unit => [unit.key, unit.contentHash]))
	return attached.every(unit => now.get(unit.key) === unit.contentHash)
}

// The same paths, and (once recorded) each one the same operation: a file rewritten in place keeps its path.
function sameFiles(attached: DomainResolution, now: OwnedNow): boolean {
	if (
		attached.files.length !== now.files.length ||
		!attached.files.every(path => now.files.includes(path))
	)
		return false
	const then = attached.fileHashes
	if (!then) return true
	return attached.files.every(path => then[path] === now.fileHashes[path])
}

type OwnedNow = {
	units: DomainResolution['units']
	files: string[]
	fileHashes: Record<string, string>
}

// A reference keeps its attach-time identity; its status says what the reload found at the target.
function reconcileReference(
	attached: ResolvedReference,
	now: ResolvedReference,
): ResolvedReference {
	if (now.status !== 'resolved')
		return { ...attached, status: 'unresolved', reason: now.reason }
	if (attached.contentHash && attached.contentHash !== now.contentHash)
		return {
			...attached,
			status: 'stale',
			reason: 'the cited code changed since the guide was written',
		}
	return { ...attached, status: 'resolved', reason: undefined }
}

function reconcileDomain(
	domain: GuideDomain,
	attached: DomainResolution,
	now: OwnedNow,
	resolveNow: (
		domain: GuideDomain,
		refId: string,
	) => ResolvedReference | undefined,
): DomainResolution {
	const reasons: string[] = []
	if (!sameUnits(attached.units, now.units))
		reasons.push('the owned code changed')
	if (!sameFiles(attached, now))
		reasons.push('an owned file operation changed')
	const refs: Record<string, ResolvedReference> = {}
	for (const [refId, attachedRef] of Object.entries(attached.refs)) {
		const current = resolveNow(domain, refId)
		refs[refId] = current
			? reconcileReference(attachedRef, current)
			: attachedRef
	}
	if (Object.values(refs).some(ref => ref.status !== 'resolved'))
		reasons.push('cited code changed or disappeared')
	return {
		units: attached.units,
		files: attached.files,
		fileHashes: attached.fileHashes,
		refs,
		stale: reasons.length ? { reasons } : undefined,
	}
}

// A stale prerequisite makes its dependents stale too: a risk assessment that leaned on changed context is not current, even where the dependent's own files sit untouched.
function prerequisiteReasons(
	domain: GuideDomain,
	guide: Guide,
	domains: Readonly<Record<string, DomainResolution>>,
): string[] {
	return (domain.prerequisites ?? [])
		.filter(prerequisiteId => domains[prerequisiteId]?.stale)
		.map(prerequisiteId => {
			const title =
				guide.domains.find(candidate => candidate.id === prerequisiteId)
					?.title ?? prerequisiteId
			return `prerequisite "${title}" changed`
		})
}

// The domain with the reasons it lacked, or null when it already carried them all.
function withReasons(
	resolution: DomainResolution,
	reasons: string[],
): DomainResolution | null {
	const known = resolution.stale?.reasons ?? []
	const added = reasons.filter(reason => !known.includes(reason))
	if (!added.length) return null
	return { ...resolution, stale: { reasons: [...known, ...added] } }
}

// One pass over the guide: the domains whose prerequisites turned stale, with their new reasons.
function propagateOnce(
	guide: Guide,
	domains: Readonly<Record<string, DomainResolution>>,
): Record<string, DomainResolution> {
	const next: Record<string, DomainResolution> = { ...domains }
	for (const domain of guide.domains) {
		const own = domains[domain.id]
		if (!own) continue
		const updated = withReasons(
			own,
			prerequisiteReasons(domain, guide, domains),
		)
		if (updated) next[domain.id] = updated
	}
	return next
}

// Iterates to a fixpoint: a chain of prerequisites propagates however deep it goes.
function propagatePrerequisites(
	guide: Guide,
	domains: Record<string, DomainResolution>,
): Record<string, DomainResolution> {
	let current = domains
	for (let round = 0; round < guide.domains.length; round++) {
		const next = propagateOnce(guide, current)
		if (JSON.stringify(next) === JSON.stringify(current)) return current
		current = next
	}
	return current
}

function resolveReferenceNow(
	domain: GuideDomain,
	refId: string,
	inventory: ReviewInventory,
	contextHashes: ContextHashes,
): ResolvedReference | undefined {
	const reference = domain.references?.find(ref => ref.id === refId)
	if (!reference) return undefined
	return resolveReference(domain, reference, inventory, contextHashes)
}

// A carried guide whose attach-time record is gone (a review file saved before resolutions existed, or one that no longer decodes): what it owns and cites now is resolved again, but nothing says the code is what the guide described, so every domain reads stale until a fresh guide replaces it. The owned identities are left blank, never borrowed from the current diff, so the next reload still finds them changed rather than calling the guide current.
export function recoverGuide(
	guide: Guide,
	inventory: ReviewInventory,
	contextHashes: ContextHashes,
): GuideResolution {
	const { resolution } = resolveGuide(guide, inventory, contextHashes)
	const reasons = [
		'the record of what this guide was written against was lost, so it could not be checked against this diff',
	]
	const domains: Record<string, DomainResolution> = {}
	for (const [id, domain] of Object.entries(resolution.domains))
		domains[id] = {
			...domain,
			units: domain.units.map(unit => ({ ...unit, contentHash: '' })),
			fileHashes: Object.fromEntries(
				domain.files.map(path => [path, '']),
			),
			stale: { reasons },
		}
	return { ...resolution, domains }
}

export function reconcileGuide(
	guide: Guide,
	attached: GuideResolution,
	inventory: ReviewInventory,
	contextHashes: ContextHashes,
): GuideResolution {
	const ownership = resolveOwnership(guide, inventory)
	const domains: Record<string, DomainResolution> = {}
	for (const domain of guide.domains) {
		const attachedDomain = attached.domains[domain.id]
		if (!attachedDomain) continue
		const owned = ownership.domains.get(domain.id) ?? {
			units: [],
			files: [],
		}
		domains[domain.id] = reconcileDomain(
			domain,
			attachedDomain,
			{
				...owned,
				fileHashes: fileOperationIdentities(inventory, owned.files),
			},
			(target, refId) =>
				resolveReferenceNow(target, refId, inventory, contextHashes),
		)
	}
	return {
		fingerprint: attached.fingerprint,
		domains: propagatePrerequisites(guide, domains),
		unassigned: ownership.unassigned,
	}
}
