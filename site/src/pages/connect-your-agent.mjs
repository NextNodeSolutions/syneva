import { protocolWire } from '../art/resources.mjs'
import { REPO_URL } from '../nav.mjs'
import {
	command,
	ctaBand,
	pageHero,
	pager,
	prose,
	ruledList,
	specTable,
	terminal,
	textLink,
} from '../ui.mjs'

const route = '/resources/connect-your-agent/'

export default {
	route,
	title: 'Connect your agent · Syneva',
	description:
		'Any agent can drive the Syneva desk: plain JSON on stdout and a localhost HTTP server, documented in full by syneva spec. The pi package wires it up for you.',
	body: () =>
		[
			pageHero({
				route,
				crumb: 'Connect your agent',
				title: 'Any agent can drive the desk.',
				lede: 'The contract is plain JSON on stdout and a localhost HTTP server, documented in full by <code>syneva spec</code>. If your agent can run a shell command, it can receive your review.',
				actions: `${command('syneva spec', 'Print the agent contract')}${textLink(`${REPO_URL}/blob/main/packages/contracts/src/spec.ts`, 'Read the source', true)}`,
				art: protocolWire(),
				caption: 'Five subcommands out, three events back.',
			}),
			prose({
				id: 'pi',
				title: 'With pi,<br>it’s wired for you.',
				body: ruledList([
					[
						'/review and /plan.',
						'Prompt templates that start a desk, attach your session and act on each event.',
					],
					[
						'One correspondent per desk.',
						'A read-only thread answers your questions, so your main session only wakes for finished reviews, closed desks and failures.',
					],
					[
						'/syneva.',
						'A status command inside pi: which CLI, shim and package paths your setup is using.',
					],
				]),
			}),
			prose({
				id: 'loop',
				title: 'Everywhere else,<br>a short loop.',
				body: `<p data-reveal-item>Open the desk on the hub (the command returns at once, and starts the hub when none runs), then wait for events and branch on their kind. This is the shape; <code>syneva spec</code> has every detail.</p>${terminal(
					[
						'$ syneva open --session auth',
						'$ while ev=$(syneva await); do',
						'    case "$(jq -r .kind <<<"$ev")" in',
						'      question) syneva comment --path … --line … --body "…" ;;',
						'      review)   # act on .result, then: syneva reload',
						'                ;;',
						'      closed)   exit 0 ;;',
						'    esac',
						'  done',
					],
					'any agent',
				)}`,
			}),
			prose({
				id: 'subcommands',
				title: 'Subcommands.',
				body: specTable(
					[
						['syneva open', 'Open a desk on the hub, or reload the live one for this repo and session. Prints its URL as JSON.'],
						['syneva desks', 'List the live desks of this repo, with their URLs.'],
						['syneva await', 'Block until the next event and print it as one JSON envelope.'],
						['syneva comment', 'Reply on a path, line and side. Appears live in the thread.'],
						['syneva status', 'A one-line “doing X now” beside your spinner.'],
						['syneva reload', 'Re-diff the working tree into the open tab, optionally with a new guide.'],
						['syneva close', 'Close the desk. Idempotent; the hub keeps running and review state stays saved.'],
						['syneva spec', 'Print the whole contract.'],
					],
					['Command', 'What it does'],
				),
			}),
			prose({
				id: 'events',
				title: 'Events.',
				body: `${specTable(
					[
						['question', 'You asked something. Answer it, read-only, on the same line.'],
						['review', 'You clicked Send. The result field is your ReviewResult.'],
						['closed', 'You ended the review from the browser. The round is over.'],
					],
					['Kind', 'Meaning'],
				)}<p data-reveal-item>A <code>ReviewResult</code> carries <code>accepted</code>, <code>rejected</code>, <code>requestedChanges</code>, <code>approvedFiles</code>, <code>stagedFiles</code>, <code>openQuestions</code> and an optional <code>overallNote</code>. The arrays are the review: there is no prose summary to parse.</p>`,
			}),
			prose({
				id: 'acting',
				title: 'How an agent<br>acts on a verdict.',
				body: ruledList([
					['rejected → revert it.', 'You don’t want that change.'],
					['requestedChanges → make the edit.', 'At that path and line, or across the file for a whole-file request.'],
					['accepted and approvedFiles → leave them.', 'They are settled. Touching them reopens them for review.'],
					['Then syneva reload.', 'Your tab shows the next revision. Anything rewritten is pending again.'],
				]),
			}),
			ctaBand(),
			pager(route),
		].join('\n'),
}
