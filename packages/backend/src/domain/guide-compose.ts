// A posted guide laid over the desk's current one, its draft included. A posted domain replaces the current domain of its id and keeps that domain's blocks unless it lists members; members it lists join it (taken from wherever they were), and a `domain` member brings a whole current domain along. A current domain the post leaves out stays as it was - minus any block the post took, a drafted one re-drafted over what is left. Every block keeps exactly one owner by construction; what the agent did not touch keeps its resolution (attach-guide.ts).
import { explicitClaims } from './guide-compose-claims.js'
import {
	currentHoldings,
	domainLinkIssues,
	heirsOf,
	inherited,
	isTaken,
	keptDomain,
	prunedLinks,
	redrafted,
} from './guide-compose-context.js'
import { draftMembers } from './guide-draft-members.js'
import { isRecord } from './guide-parse.js'
import { GUIDE_FORMAT, GUIDE_LIMITS } from './guide-shapes.js'

import type {
	ComposeContext,
	CurrentGuide,
	Holding,
	Placed,
} from './guide-compose-context.js'
import type {
	AuthoredDomain,
	AuthoredGuide,
	Guide,
	GuideDomain,
	GuideIssue,
} from './guide-shapes.js'

export type Composition = {
	readonly guide: Guide
	// The domains the post changed (text, blocks or both): they resolve afresh, every other one keeps its resolution.
	readonly touched: ReadonlySet<string>
	readonly drafted: ReadonlySet<string>
	readonly overviewDrafted: boolean
	readonly issues: GuideIssue[]
}

// The posted domain's blocks: what it inherits that no other posted domain names, and what it names itself.
function postedHolding(domainId: string, context: ComposeContext): Holding {
	const isFree = (owner: string | undefined): boolean =>
		!owner || owner === domainId
	const from = inherited(domainId, context)
	const named = (owners: ReadonlyMap<string, string>): string[] =>
		[...owners]
			.filter(([, owner]) => owner === domainId)
			.map(([key]) => key)
	return {
		units: new Set([
			...from.flatMap(holding =>
				[...holding.units].filter(key =>
					isFree(context.claims.units.get(key)),
				),
			),
			...named(context.claims.units),
		]),
		files: new Set([
			...from.flatMap(holding =>
				[...holding.files].filter(file =>
					isFree(context.claims.files.get(file)),
				),
			),
			...named(context.claims.files),
		]),
	}
}

// The text an agent writes; equal text means the agent left the domain as it was.
// Key order and absent-versus-undefined fields are not text: a guide read back from a file compares equal to the one written.
function canonical(entry: unknown): unknown {
	if (Array.isArray(entry)) return entry.map(canonical)
	if (!isRecord(entry)) return entry
	return Object.fromEntries(
		Object.entries(entry)
			.filter(([, field]) => typeof field !== 'undefined')
			.toSorted(([a], [b]) => a.localeCompare(b))
			.map(([key, field]) => [key, canonical(field)]),
	)
}

function textOf(domain: AuthoredDomain | GuideDomain): string {
	const { title, risk, consequence, summary, verify, prerequisites } = domain
	const { references, related, evidence, unknowns, critical, blocks } = domain
	return JSON.stringify(
		canonical({
			title,
			risk,
			consequence,
			summary,
			verify,
			prerequisites,
			references,
			related,
			evidence,
			unknowns,
			critical,
			blocks,
		}),
	)
}

function isUntouched(domain: AuthoredDomain, context: ComposeContext): boolean {
	const previous = context.currentDomains.get(domain.id)
	if (!previous || domain.members) return false
	if (context.current?.stale.has(domain.id)) return false
	const holding = context.holdings.get(domain.id)
	return (
		!isTaken(holding, context.claims, domain.id) &&
		textOf(domain) === textOf(previous)
	)
}

function postedDomain(
	domain: AuthoredDomain,
	index: number,
	context: ComposeContext,
): GuideDomain | null {
	const holding = postedHolding(domain.id, context)
	const field = `guide.domains[${index}]`
	if (!holding.units.size && !holding.files.size) {
		context.issues.push({
			field,
			target: domain.id,
			reason: `domain "${domain.id}" owns no changed block; give it members or leave it out`,
		})
		return null
	}
	const members = draftMembers(
		context.unitsOf(holding.units),
		[...holding.files],
		context.order,
	)
	if (members.length > GUIDE_LIMITS.membersPerDomain)
		context.issues.push({
			field: `${field}.members`,
			target: domain.id,
			reason: `domain "${domain.id}" would own ${members.length} spans; at most ${GUIDE_LIMITS.membersPerDomain} - split it`,
		})
	const previous = context.currentDomains.get(domain.id)
	return {
		id: domain.id,
		title: domain.title,
		risk: domain.risk,
		consequence: domain.consequence,
		summary: domain.summary,
		verify: domain.verify,
		prerequisites: domain.prerequisites,
		members,
		references: domain.references ?? previous?.references,
		related: domain.related,
		evidence: domain.evidence,
		unknowns: domain.unknowns,
		critical: domain.critical,
		blocks: domain.blocks,
		order: domain.order,
	}
}

function placePosted(posted: AuthoredGuide, context: ComposeContext): Placed[] {
	return posted.domains.flatMap((domain, index) => {
		const composed = postedDomain(domain, index, context)
		if (!composed) return []
		const previous = context.currentDomains.get(domain.id)
		const isDraftText = Boolean(
			context.current?.drafted.has(domain.id) &&
			previous &&
			textOf(domain) === textOf(previous),
		)
		const isTouched = !isUntouched(domain, context)
		// Draft text over blocks that changed hands is drawn again, so its counts and names stay facts.
		const placed =
			isDraftText && isTouched
				? (redrafted(
						composed,
						postedHolding(domain.id, context),
						context,
					) ?? composed)
				: composed
		return [
			{
				domain: placed,
				isPosted: true,
				isTouched,
				isDrafted: isDraftText,
			},
		]
	})
}

function contextOf(
	posted: AuthoredGuide,
	current: CurrentGuide | undefined,
	input: ComposeInput,
): ComposeContext {
	const issues: GuideIssue[] = []
	const holdings = currentHoldings(current, input.inventory)
	const claims = explicitClaims(posted.domains, input.inventory)
	const units = new Map(input.inventory.units.map(unit => [unit.key, unit]))
	const context: ComposeContext = {
		...input,
		current,
		currentDomains: new Map(
			(current?.guide.domains ?? []).map(domain => [domain.id, domain]),
		),
		holdings,
		claims,
		heirs: new Map(),
		issues,
		unitsOf: keys => [...keys].flatMap(key => units.get(key) ?? []),
	}
	return { ...context, heirs: heirsOf(posted.domains, context) }
}

export type ComposeInput = Pick<ComposeContext, 'inventory' | 'order'>

export function composeGuide(
	posted: AuthoredGuide,
	current: CurrentGuide | undefined,
	input: ComposeInput,
): Composition {
	const context = contextOf(posted, current, input)
	const placed = [
		...placePosted(posted, context),
		...(current?.guide.domains ?? []).flatMap(
			domain => keptDomain(domain, context) ?? [],
		),
	]
	const ids = new Set(placed.map(entry => entry.domain.id))
	const domains = placed.map(entry =>
		entry.isPosted ? entry.domain : prunedLinks(entry.domain, ids),
	)
	const issues = [
		...context.claims.issues,
		...context.issues,
		...domainLinkIssues(posted.domains, ids),
	]
	if (placed.length > GUIDE_LIMITS.domains)
		issues.push({
			field: 'guide.domains',
			reason: `the guide would hold ${placed.length} domains; at most ${GUIDE_LIMITS.domains} - merge some`,
		})
	return {
		guide: {
			format: GUIDE_FORMAT,
			source: posted.source,
			overview: posted.overview,
			domains,
		},
		touched: new Set(
			placed
				.filter(entry => entry.isTouched)
				.map(entry => entry.domain.id),
		),
		drafted: new Set(
			placed
				.filter(entry => entry.isDrafted)
				.map(entry => entry.domain.id),
		),
		overviewDrafted: Boolean(
			current?.overviewDrafted &&
			current.guide.overview === posted.overview,
		),
		issues,
	}
}
