// The agent contract as the site tells it; packages/contracts/src/spec.ts is
// the full one, which `syneva spec` prints.
type Subcommand = { name: string; does: string }
type DeskEvent = { kind: string; meaning: string }

// The subcommands that drive a review round, out from the agent to the desk.
export const SUBCOMMANDS = [
	{
		name: 'await',
		does: 'Block until the next event and print it as one JSON envelope.',
	},
	{
		name: 'comment',
		does: 'Reply on a path, line and side. Appears live in the thread.',
	},
	{ name: 'status', does: 'A one-line “doing X now” beside your spinner.' },
	{
		name: 'reload',
		does: 'Re-diff the working tree into the open tab, optionally with a new guide.',
	},
	{
		name: 'stop',
		does: 'Shut the desk down. Idempotent; review state stays saved.',
	},
] as const satisfies readonly Subcommand[]

// The subcommand outside the round.
export const SPEC_SUBCOMMAND = {
	name: 'spec',
	does: 'Print the whole contract.',
} as const satisfies Subcommand

// A subcommand the way the agent runs it.
export const commandOf = ({ name }: Subcommand): string => `syneva ${name}`

// The command that prints the whole contract, and the name its copy box
// reads out.
export const SPEC_COMMAND = commandOf(SPEC_SUBCOMMAND)
export const SPEC_COMMAND_LABEL = 'Print the agent contract'

// The events the desk answers with, back to the agent.
export const EVENTS = [
	{
		kind: 'question',
		meaning: 'You asked something. Answer it, read-only, on the same line.',
	},
	{
		kind: 'review',
		meaning: 'You clicked Send. The result field is your ReviewResult.',
	},
	{
		kind: 'closed',
		meaning: 'You ended the review from the browser. The round is over.',
	},
] as const satisfies readonly DeskEvent[]
