import { branchGraph } from '../art/workflows.mjs'
import {
	command,
	ctaBand,
	pageHero,
	pager,
	prose,
	ruledList,
	terminal,
} from '../ui.mjs'

const route = '/workflows/pull-requests/'

export default {
	route,
	title: 'Pull request review · Syneva',
	description:
		'Review a branch the way it will land: syneva pr takes a branch name, a PR number or a GitHub URL, checks it out and diffs it against its merge-base.',
	body: () =>
		[
			pageHero({
				route,
				crumb: 'Pull requests',
				title: 'A whole branch, against its merge-base.',
				state: 'available',
				lede: 'Review a branch’s commits the way they will land. <code>syneva pr</code> takes a branch name, a pull request number or a GitHub URL, checks the branch out and diffs it against its merge-base.',
				actions: command('syneva pr 128', 'Review a pull request'),
				art: branchGraph(),
				caption: 'Only the branch’s own commits. Main’s new work stays out.',
			}),
			prose({
				id: 'refs',
				title: 'Any way you<br>name the branch.',
				body: terminal(
					[
						'# a pull request number, resolved through gh',
						'$ syneva pr 128',
						'',
						'# a GitHub URL',
						'$ syneva pr https://github.com/acme/app/pull/128',
						'',
						'# a branch, against a base you choose',
						'$ syneva pr feature/auth --base main',
					],
					'your repository',
				),
			}),
			prose({
				id: 'rules',
				title: 'How a branch<br>review works.',
				body: ruledList([
					[
						'Verdicts map to review states.',
						'Approve means approve, reject means request changes. Nothing is staged: the diff is already committed.',
					],
					[
						'Your agent amends the branch.',
						'It applies your verdict to the branch’s commits, leaves approved hunks alone, and you review the next round in the same tab.',
					],
					[
						'Your working tree stays safe.',
						'If you have uncommitted tracked changes, Syneva refuses to check out the branch instead of clobbering them.',
					],
					[
						'gh for numbers and URLs.',
						'Branch names work with git alone. PR numbers and URLs need the GitHub CLI, installed and signed in.',
					],
				]),
			}),
			ctaBand(),
			pager(route),
		].join('\n'),
}
