import { stagedPlanes } from '../art/workflows.mjs'
import {
	command,
	ctaBand,
	pageHero,
	pager,
	prose,
	ruledList,
} from '../ui.mjs'

const route = '/workflows/staged-changes/'

export default {
	route,
	title: 'Staged changes review · Syneva',
	description:
		'Stage what you think is ready, then review exactly that. syneva --diff staged opens the index: the precise content of your next commit, and nothing else.',
	body: () =>
		[
			pageHero({
				route,
				crumb: 'Staged changes',
				title: 'A last, careful look before the commit.',
				state: 'available',
				lede: 'Stage what you think is ready, then review exactly that. <code>syneva --diff staged</code> opens the index, so the desk shows what your next commit will contain and nothing else.',
				actions: command('syneva --diff staged', 'Review staged changes'),
				art: stagedPlanes(),
				caption: 'The working tree can stay messy. The commit shouldn’t.',
			}),
			prose({
				id: 'when',
				title: 'When it’s the<br>right lens.',
				body: ruledList([
					[
						'Committing in slices.',
						'Your agent made a dozen changes; you want to ship three of them now. Stage them, review them, commit them.',
					],
					[
						'A final pass.',
						'You already reviewed the working tree. Before the commit, read exactly what is going in.',
					],
					[
						'Hand-picked hunks.',
						'Staged with git add -p? The desk shows the index precisely, hunk by hunk.',
					],
				]),
			}),
			prose({
				id: 'good-to-know',
				title: 'Good to know.',
				body: ruledList([
					[
						'Approving can stage for you.',
						'With “Approve stages file” on, a clean ⇧A approval in a working-tree review stages that file. Off by default: approvals are verdicts unless you ask for more.',
					],
					[
						'Switching lenses is a restart.',
						'syneva reload re-diffs the same source. To move between working and staged, stop the desk and start it again: your saved session comes back with it.',
					],
				]),
			}),
			ctaBand(),
			pager(route),
		].join('\n'),
}
