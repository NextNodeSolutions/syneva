import type { AwaitEvent, ReviewResult } from '@syneva/contracts/agent'

// The agent contract as the site tells it; packages/contracts/src/spec.ts is
// the full one, which `syneva spec` prints.
type Subcommand = { name: string; does: string }

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

type SubcommandName =
	| (typeof SUBCOMMANDS)[number]['name']
	| (typeof SPEC_SUBCOMMAND)['name']

// A subcommand the way the agent runs it.
export const commandOf = (name: SubcommandName): string => `syneva ${name}`

// The command that prints the whole contract, and the name its copy box
// reads out.
export const SPEC_COMMAND = commandOf(SPEC_SUBCOMMAND.name)
export const SPEC_COMMAND_LABEL = 'Print the agent contract'

// The events the desk answers with, back to the agent, by kind with what
// each means. The contract's event union keys them: a kind added or renamed
// there fails this build until the site tells it too.
export const EVENTS = {
	question: 'You asked something. Answer it, read-only, on the same line.',
	review: 'You clicked Send. The result field is your ReviewResult.',
	closed: 'You ended the review from the browser. The round is over.',
} as const satisfies Record<AwaitEvent['kind'], string>

// The ReviewResult fields the site names, in the order it names them, then
// the one optional field. Typed by the contract: a renamed field fails the
// build until the site names it too.
export const REVIEW_RESULT_FIELDS = [
	'accepted',
	'rejected',
	'requestedChanges',
	'approvedFiles',
	'stagedFiles',
	'openQuestions',
] as const satisfies readonly (keyof ReviewResult)[]
export const REVIEW_RESULT_NOTE = 'overallNote' satisfies keyof ReviewResult
