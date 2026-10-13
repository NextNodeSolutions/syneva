// How far a drafted guide's domains agree with a reference labelling of the same changed blocks (the commit that wrote each one), and how many of the code's own references stay inside a domain. Pure functions over plain arrays, for guide-partition.mjs.

// The normalization averages the two labellings' entropies.
const ENTROPY_TERMS = 2

function countsOf(keys) {
	const counts = new Map()
	for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1)
	return counts
}

function entropyOf(counts, total) {
	let entropy = 0
	for (const count of counts.values()) {
		const share = count / total
		entropy -= share * Math.log(share)
	}
	return entropy
}

// Normalized mutual information (arithmetic mean of the entropies): 1 when the two labellings are the same partition, 0 when knowing one says nothing of the other. `pairs` are [reference, domain] per block.
export function normalizedMutualInformation(pairs) {
	const total = pairs.length
	if (!total) return 1
	const references = countsOf(pairs.map(([reference]) => reference))
	const domains = countsOf(pairs.map(([, domain]) => domain))
	const joint = countsOf(
		pairs.map(([reference, domain]) => `${reference}\0${domain}`),
	)
	let information = 0
	for (const [key, count] of joint) {
		const [reference, domain] = key.split('\0')
		const share = count / total
		const expected =
			((references.get(reference) ?? 0) / total) *
			((domains.get(domain) ?? 0) / total)
		information += share * Math.log(share / expected)
	}
	const entropies = entropyOf(references, total) + entropyOf(domains, total)
	if (!entropies) return 1
	return (ENTROPY_TERMS * information) / entropies
}

// The share of blocks whose domain's most common reference label is their own: high when no domain mixes changes written for different reasons, whatever the number of domains.
export function purity(pairs) {
	if (!pairs.length) return 1
	const byDomain = new Map()
	for (const [reference, domain] of pairs)
		byDomain.set(domain, [...(byDomain.get(domain) ?? []), reference])
	let agreeing = 0
	for (const references of byDomain.values())
		agreeing += Math.max(...countsOf(references).values())
	return agreeing / pairs.length
}

// The share of resolved references between changed declarations whose two ends share a domain. `blocks` are { domain, node, links }: a declaration's node (`path#Name`) and the nodes it references.
export function linkCohesion(blocks) {
	const nodeDomains = new Map()
	for (const { node, domain } of blocks) {
		if (node && !nodeDomains.has(node)) nodeDomains.set(node, domain)
	}
	const ends = blocks.flatMap(({ domain, links }) =>
		links.flatMap(target => {
			if (!nodeDomains.has(target)) return []
			return [domain === nodeDomains.get(target)]
		}),
	)
	if (!ends.length) return 1
	return ends.filter(Boolean).length / ends.length
}
