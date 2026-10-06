import type { AwaitEvent, ReviewResult } from '@syneva/contracts/agent'

// packages/contracts/src/spec.ts is the full contract; `syneva spec` prints it.
type Subcommand = { name: string; does: string }

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
] as const satisfies readonly Subcommand[]

export const DESK_SUBCOMMANDS = [
	{
		name: 'open',
		does: 'Open a desk on the hub, or reload the live one for this repo and session. Prints its URL as JSON.',
	},
	{
		name: 'desks',
		does: 'List the live desks of this repo, with their URLs.',
	},
	{
		name: 'close',
		does: 'Close the desk. Idempotent; the hub keeps running and review state stays saved.',
	},
] as const satisfies readonly Subcommand[]

export const SPEC_SUBCOMMAND = {
	name: 'spec',
	does: 'Print the whole contract.',
} as const satisfies Subcommand

type SubcommandName =
	| (typeof SUBCOMMANDS)[number]['name']
	| (typeof DESK_SUBCOMMANDS)[number]['name']
	| (typeof SPEC_SUBCOMMAND)['name']

export const commandOf = (name: SubcommandName): string => `syneva ${name}`

export const SPEC_COMMAND = commandOf(SPEC_SUBCOMMAND.name)
export const SPEC_COMMAND_LABEL = 'Print the agent contract'

// Kinds key the contract's event union: adding or renaming there fails this build until the site lists it too.
export const EVENTS = {
	question: 'You asked something. Answer it, read-only, on the same line.',
	review: 'You clicked Send. The result field is your ReviewResult.',
	closed: 'You ended the review from the browser. The round is over.',
} as const satisfies Record<AwaitEvent['kind'], string>

// Fields mirror the contract's union: a rename there fails this build until it is typed here too.
export const REVIEW_RESULT_FIELDS = [
	'accepted',
	'rejected',
	'requestedChanges',
	'approvedFiles',
	'stagedFiles',
	'openQuestions',
] as const satisfies readonly (keyof ReviewResult)[]
export const REVIEW_RESULT_NOTE = 'overallNote' satisfies keyof ReviewResult
