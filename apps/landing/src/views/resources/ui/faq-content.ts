// The FAQ, one block per domain: a title, a blurb and its questions with
// their answers (answers are HTML). The topic index and the blocks are both
// built from this list.
export type QaGroup = {
	title: string
	blurb: string
	items: readonly (readonly [string, string])[]
}

export const FAQ: readonly QaGroup[] = [
	{
		title: 'The basics',
		blurb: 'What Syneva is, what I refused to build into it, and why your verdict stays yours.',
		items: [
			[
				'What is Syneva, in one sentence?',
				'An integrated review environment for code you didn’t write by hand: a local browser desk where you judge your agent’s diff, question it on the line, and hand a structured verdict back.',
			],
			[
				'Does Syneva review code for me?',
				'No. You review the code. Your own agent can set the reading order and answer your questions. Syneva records your decisions and hands them back to that agent.',
			],
			[
				'Does it ever auto-approve anything?',
				'Never. Every change starts pending, and only your keypress records a verdict. A verdict is stored on that exact change, not inferred from git staging.',
			],
			[
				'What if the agent rewrites code I already accepted?',
				'Each change is content-hashed. On reload, a rewritten change resets to pending while untouched work keeps your verdict. Approvals and comment anchors follow the same rule.',
			],
			[
				'What can I review?',
				'Your working tree, your staged changes, a branch or pull request against its merge-base, or a single file such as a plan. See <a href="/workflows/">Workflows</a>.',
			],
		],
	},
	{
		title: 'Your agent',
		blurb: 'Bring the agent you already use. Here is what it may touch and what it gets back.',
		items: [
			[
				'Which coding agents work with it?',
				'Any of them. The contract is plain JSON on stdout plus a localhost HTTP server. Syneva ships as a pi package, and Codex, Cursor or a shell script can drive the standalone CLI.',
			],
			[
				'Do I need pi?',
				'No. pi gives you the smoothest loop (prompt templates, a correspondent thread for questions, a status command), but the CLI works on its own.',
			],
			[
				'Does my agent edit files while I review?',
				'It shouldn’t, and the contract tells it so: answering a question is read-only, and edits happen between rounds, followed by <code>syneva reload</code>.',
			],
			[
				'What exactly does my agent receive when I Send?',
				'A <code>ReviewResult</code>: what you accepted, rejected and requested, which files you approved or staged, any questions still open, and an optional overall note.',
			],
		],
	},
	{
		title: 'Your code and data',
		blurb: 'Your review stays on your machine. Here is where it lives and what survives a restart.',
		items: [
			[
				'Where does my review live?',
				'On your machine, under <code>~/.syneva</code>. Every save is persisted, and a restart restores the session on the same port, so your open tab heals itself.',
			],
			[
				'Does Syneva send anything anywhere?',
				'No telemetry, no account, no model calls. The desk binds to loopback by default. One honest footnote: your browser may fetch a web font for the desk; switch to system fonts and even that stops.',
			],
			[
				'Can I review from another machine?',
				'Yes, with <code>--host</code>, for remote-dev setups. The desk API is unauthenticated, so only bind wider on a network you fully trust, like a personal tailnet.',
			],
			[
				'What happens if I close the tab?',
				'Nothing is lost. A desk with no open tab and no attached agent exits after about two hours, and starting it again restores everything.',
			],
		],
	},
	{
		title: 'Limits and what’s next',
		blurb: 'What is still a prototype, what I am building next, and what it costs you.',
		items: [
			[
				'Can I use the plan desk today?',
				'The dedicated plan desk is a prototype. You can already open a plan with <code>syneva file plan.md</code> and comment block by block.',
			],
			[
				'What’s on the roadmap?',
				'In rough order: a command palette for every review action, commit, range and branch review modes, and lazy per-file loading with guards for very large and binary files.',
			],
			[
				'Is it free?',
				'Yes. Syneva is open source under the MIT license.',
			],
		],
	},
]
