// The agents the form offers to tick. The list stores the ids, so a label can change without touching a row.
export const AGENTS = [
	{ id: 'claude-code', label: 'Claude Code' },
	{ id: 'codex', label: 'Codex' },
	{ id: 'cursor', label: 'Cursor' },
	{ id: 'copilot', label: 'Copilot' },
	{ id: 'pi', label: 'pi' },
	{ id: 'other', label: 'Other' },
] as const

export type AgentId = (typeof AGENTS)[number]['id']

const LABELS: ReadonlyMap<AgentId, string> = new Map(
	AGENTS.map(agent => [agent.id, agent.label]),
)

export const agentLabel = (id: AgentId): string => LABELS.get(id) ?? id

// Unknown values drop out and the rest come back once each, in the list's order, whatever order they were sent in.
export const pickAgents = (values: readonly unknown[]): AgentId[] =>
	AGENTS.filter(agent => values.includes(agent.id)).map(agent => agent.id)
