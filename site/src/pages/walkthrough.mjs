import { guideSort, guideStamp } from '../art/product.mjs'
import {
	chapter,
	ctaBand,
	pageHero,
	pager,
	primary,
	prose,
	specTable,
	terminal,
	textLink,
} from '../ui.mjs'

const route = '/product/walkthrough/'

export default {
	route,
	title: 'Guided walkthrough · Syneva',
	description:
		'Let your agent hand you a reading order: files grouped into sections, general to specific. Files the guide does not list still appear under Other. Nothing is hidden.',
	body: () =>
		[
			pageHero({
				route,
				crumb: 'Guided walkthrough',
				title: 'A reading order,<br>not a pile of files.',
				state: 'available',
				lede: 'Git lists changed files alphabetically. Understanding doesn’t work that way. Your agent knows what it changed and why, so let it hand you the order: contracts first, behavior next, the interface last.',
				actions: `${primary('/get-started/', 'Try it on your diff')}${textLink('/resources/connect-your-agent/', 'How agents attach a guide')}`,
				art: guideSort(),
				caption: 'Same six files. One order makes sense of them.',
			}),
			prose({
				id: 'guide',
				title: 'One small JSON file.',
				body: `<p data-reveal-item>A guide is a list of files with an optional section name and order. Your agent writes it outside the working tree and passes it at start, or swaps it in later. Syneva validates it, renders it as sections in the Walkthrough tab, and runs no model to do so.</p>${terminal(
					[
						'# guide.json, written by your agent',
						'{ "files": [',
						'  { "path": "contracts/review.ts", "category": "Contracts" },',
						'  { "path": "auth/session.ts",     "category": "Behavior" },',
						'  { "path": "api/middleware.ts",   "category": "Behavior" },',
						'  { "path": "pages/desk.tsx",      "category": "Interface" }',
						'] }',
						'',
						'$ syneva --guide /tmp/guide.json',
					],
					'guide.json',
				)}${specTable(
					[
						['files', 'Required. One entry per reviewed file.'],
						['files[].path', 'Required. Repo-relative path.'],
						[
							'files[].category',
							'The section it is listed under. Defaults to “Changes”.',
						],
						[
							'files[].order',
							'Ascending review order. Defaults to array position.',
						],
					],
					['Field', 'Meaning'],
				)}`,
			}),
			prose({
				id: 'nothing-hidden',
				title: 'Nothing hidden.<br>Ever.',
				body: `<div class="callout" data-reveal-item><div><p>A guide reorders and labels. It can’t remove.</p><p>Files the guide doesn’t mention land in a trailing Other section. A guide carries no prose and no flags, and your verdicts, comments and Send work exactly the same with or without one.</p></div></div><p data-reveal-item>That is a deliberate limit. A reading order is advice from the agent that wrote the code; the decision about what deserves your attention stays with you.</p>`,
			}),
			chapter({
				id: 'stamped',
				reverse: true,
				title: 'Stamped to<br>its diff.',
				body: [
					'A guide is tied to the diff it was written for, and survives reloads and restarts.',
					'When a reload moves the diff past it, the desk says the grouping may be out of date. Your agent regenerates it and swaps it in with a single command, without restarting your review.',
				],
				art: guideStamp(),
				caption: 'Guide → stamped diff → reload → refreshed guide',
			}),
			ctaBand(),
			pager(route),
		].join('\n'),
}
