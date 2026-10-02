import { workingTree } from '../art/workflows.mjs'
import {
	command,
	ctaBand,
	pageHero,
	pager,
	prose,
	ruledList,
	terminal,
} from '../ui.mjs'

const route = '/workflows/working-tree/'

export default {
	route,
	title: 'Working tree review · Syneva',
	description:
		'Run syneva in your repository and review everything your agent just changed: modified files as diffs, new files as full-file additions. Narrow it with --path.',
	body: () =>
		[
			pageHero({
				route,
				crumb: 'Working tree',
				title: 'Everything your agent just changed.',
				state: 'available',
				lede: 'Run <code>syneva</code> in your repository and the working-tree diff opens in your browser. Modified files show as diffs, new untracked files as full-file additions, and nothing your agent touched is left out.',
				actions: command('syneva', 'Review the working tree'),
				art: workingTree(),
				caption: 'The whole diff, or a lens on one path.',
			}),
			prose({
				id: 'narrow',
				title: 'Big diff?<br>Narrow it.',
				body: `<p data-reveal-item>Agents rarely change one thing. When a round touches several areas, start a desk on the part you want to judge first and keep the rest for later.</p>${terminal(
					[
						'# everything your agent changed',
						'$ syneva',
						'',
						'# only what lives under src/auth',
						'$ syneva --path src/auth',
					],
					'your repository',
				)}`,
			}),
			prose({
				id: 'round',
				title: 'One round,<br>start to finish.',
				body: ruledList([
					[
						'Your agent edits.',
						'It works in your working tree, as it always does.',
					],
					[
						'You review.',
						'Keep, undo, ask and request changes on the desk, then Send.',
					],
					[
						'Your agent acts and reloads.',
						'It applies your verdict, then runs syneva reload to re-diff its edits into your open tab.',
					],
					[
						'Only what changed resets.',
						'Rewritten changes come back pending; untouched ones keep your verdict. Repeat until there’s nothing left to say.',
					],
				]),
			}),
			ctaBand(),
			pager(route),
		].join('\n'),
}
