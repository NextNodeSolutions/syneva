import { singleFile } from '../art/workflows.mjs'
import {
	command,
	ctaBand,
	pageHero,
	pager,
	prose,
	specTable,
	textLink,
} from '../ui.mjs'

const route = '/workflows/single-file/'

export default {
	route,
	title: 'Single file review · Syneva',
	description:
		'syneva file opens one file, tracked or not: a plan, a spec, an issue draft or a piece of code. Markdown renders, and you can comment on any rendered block.',
	body: () =>
		[
			pageHero({
				route,
				crumb: 'A single file',
				title: 'One file. A plan, a spec, a piece of code.',
				state: 'available',
				lede: '<code>syneva file</code> opens a single file, tracked or not. Use it to review what your agent wrote before it writes code: a plan, a PRD, an issue draft, or one file you want to read in full.',
				actions: command('syneva file plan.md', 'Review a single file'),
				art: singleFile(),
				caption: 'Rendered markdown, commentable block by block.',
			}),
			prose({
				id: 'states',
				title: 'What you see<br>depends on the file.',
				body: specTable(
					[
						['Unchanged', 'The full file, ready for comments.'],
						['Changed', 'A diff of what changed, stageable like any change.'],
						['Untracked', 'The full file, for a verdict and comments.'],
						[
							'Markdown',
							'Rendered with a Source toggle (m). Comment on any rendered block; the file’s own images are served from your repository.',
						],
					],
					['The file is', 'You get'],
				),
			}),
			prose({
				id: 'plans',
				title: 'Review the plan<br>before the code.',
				body: `<p data-reveal-item>The most expensive review is the one that happens after the code exists. Ask your agent for a plan, open it as a file, and settle the approach with comments on the exact paragraph.</p><p data-reveal-item>With the pi package, the <code>/plan</code> prompt template wires that loop for you.</p><p data-reveal-item>${textLink('/product/plan-desk/', 'Where the plan desk is heading')}</p>`,
			}),
			ctaBand(),
			pager(route),
		].join('\n'),
}
