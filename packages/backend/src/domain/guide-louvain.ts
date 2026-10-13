// Community detection over a weighted graph (Louvain): every node moves to the neighbouring community that raises modularity most until none moves, then each community folds into one node and the moving starts again, until a level changes nothing. Deterministic - nodes are visited in index order and ties keep the current community - so the same changeset always groups the same way.

export type WeightedEdge = {
	readonly a: number
	readonly b: number
	readonly weight: number
}

const MAX_ROUNDS = 50
const MAX_LEVELS = 12
const GAIN_EPSILON = 1e-9
// Every edge is counted at both of its ends in the degrees.
const EDGE_ENDS = 2

// A self-loop (a folded community's inner weight) is stored once and counts twice in its node's degree.
type Graph = {
	adjacency: Map<number, number>[]
	degree: number[]
	total: number
}

function addWeight(
	links: Map<number, number> | undefined,
	node: number,
	weight: number,
): void {
	links?.set(node, (links.get(node) ?? 0) + weight)
}

function graphOf(nodeCount: number, edges: readonly WeightedEdge[]): Graph {
	const adjacency = Array.from(
		{ length: nodeCount },
		() => new Map<number, number>(),
	)
	const degree = Array.from({ length: nodeCount }, () => 0)
	let total = 0
	for (const { a, b, weight } of edges) {
		addWeight(adjacency[a], b, weight)
		if (a !== b) addWeight(adjacency[b], a, weight)
		degree[a] = (degree[a] ?? 0) + weight
		degree[b] = (degree[b] ?? 0) + weight
		total += weight
	}
	return { adjacency, degree, total }
}

type Level = {
	graph: Graph
	membership: number[]
	communityDegree: number[]
	resolution: number
}

// The community a node joins: the one whose links outweigh its expected share by the most (resolution > 1 favours smaller communities).
function bestCommunity(node: number, level: Level): number {
	const { graph, membership, communityDegree, resolution } = level
	const towards = new Map<number, number>()
	for (const [neighbour, weight] of graph.adjacency[node] ?? []) {
		if (neighbour === node) continue
		const community = membership[neighbour] ?? neighbour
		towards.set(community, (towards.get(community) ?? 0) + weight)
	}
	const degree = graph.degree[node] ?? 0
	const share = (community: number): number =>
		(resolution * (communityDegree[community] ?? 0) * degree) /
		(EDGE_ENDS * graph.total)
	const current = membership[node] ?? node
	let best = current
	let bestGain = (towards.get(current) ?? 0) - share(current)
	for (const [community, weight] of towards) {
		const gain = weight - share(community)
		if (gain > bestGain + GAIN_EPSILON) {
			best = community
			bestGain = gain
		}
	}
	return best
}

// One sweep over the nodes; true when any node changed community.
function sweep(level: Level): boolean {
	const { graph, membership, communityDegree } = level
	let hasMoved = false
	for (let node = 0; node < membership.length; node++) {
		const from = membership[node] ?? node
		const degree = graph.degree[node] ?? 0
		communityDegree[from] = (communityDegree[from] ?? 0) - degree
		const to = bestCommunity(node, level)
		communityDegree[to] = (communityDegree[to] ?? 0) + degree
		membership[node] = to
		hasMoved ||= to !== from
	}
	return hasMoved
}

// Communities numbered 0..k-1 in order of first appearance.
function renumber(membership: readonly number[]): number[] {
	const numbers = new Map<number, number>()
	return membership.map(community => {
		if (!numbers.has(community)) numbers.set(community, numbers.size)
		return numbers.get(community) ?? 0
	})
}

function localMoving(graph: Graph, resolution: number): number[] {
	const level: Level = {
		graph,
		membership: graph.degree.map((_, node) => node),
		communityDegree: [...graph.degree],
		resolution,
	}
	let round = 0
	while (round < MAX_ROUNDS && sweep(level)) round++
	return renumber(level.membership)
}

// Each community becomes one node; the weight inside it becomes the node's self-loop.
function folded(graph: Graph, communities: readonly number[]): Graph {
	const edges = graph.adjacency.flatMap((links, a) =>
		[...links]
			.filter(([b]) => b >= a)
			.map(([b, weight]) => ({
				a: communities[a] ?? 0,
				b: communities[b] ?? 0,
				weight,
			})),
	)
	return graphOf(new Set(communities).size, edges)
}

// The community of every node, numbered 0..k-1 in order of first appearance.
export function louvainCommunities(
	nodeCount: number,
	edges: readonly WeightedEdge[],
	resolution: number,
): number[] {
	let graph = graphOf(nodeCount, edges)
	let membership = Array.from({ length: nodeCount }, (_, node) => node)
	if (!graph.total) return membership
	for (let depth = 0; depth < MAX_LEVELS; depth++) {
		const communities = localMoving(graph, resolution)
		if (new Set(communities).size === communities.length) break
		membership = membership.map(community => communities[community] ?? 0)
		graph = folded(graph, communities)
	}
	return renumber(membership)
}
