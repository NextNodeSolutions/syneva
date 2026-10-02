import { planQueue, planToday } from '../art/product.mjs'
import {
	chapter,
	command,
	ctaBand,
	pageHero,
	pager,
	prose,
	ruledList,
	textLink,
} from '../ui.mjs'

const route = '/product/plan-desk/'

export default {
	route,
	title: 'Plan desk (prototype) · Syneva',
	description:
		'A prototype direction for Syneva: turn an agent’s plan into claims you can rank, question and settle before any code exists. Today, syneva file already reviews a plan line by line.',
	body: () =>
		[
			pageHero({
				route,
				crumb: 'Plan desk',
				title: 'Question the plan before the code exists.',
				state: 'prototype',
				lede: 'The cheapest bug is the one you argue out of the plan. The plan desk is where Syneva is heading next: an agent’s proposal turned into claims you can rank, question and settle before a single line is written.',
				actions: `${textLink('#today', 'What works today')}${textLink('/resources/changelog/', 'Follow progress in the changelog')}`,
				art: planQueue(),
				caption: 'Prototype concept. Not in the CLI today.',
			}),
			chapter({
				id: 'today',
				title: 'Available today:<br>review the plan as a file.',
				body: [
					'You don’t have to wait for the plan desk to review a plan. Point Syneva at the file your agent wrote and review it like code.',
					'Markdown renders with a Rendered and Source toggle, and you can comment on any rendered block. Your agent answers in the thread, and your requests go back with Send.',
				],
				after: `<div class="chapter-command" data-reveal-item>${command('syneva file plan.md', 'Review a plan file')}</div>`,
				art: planToday(),
				caption: 'syneva file → rendered markdown → comments on blocks',
			}),
			prose({
				id: 'direction',
				title: 'What we’re<br>exploring.',
				body: ruledList([
					[
						'See the shape of the work.',
						'Read a plan as a map of claims, as a document, or as source.',
					],
					[
						'Rank claims by risk.',
						'Surface the assumptions that would hurt most if wrong, and what would prove them.',
					],
					[
						'Settle decisions before the diff.',
						'Question the claim, not the code it would have produced.',
					],
					[
						'Hand back a clearer brief.',
						'Your settled decisions become the agent’s starting point, through the same contract as a code review.',
					],
				]),
			}),
			prose({
				id: 'honest',
				title: 'Prototype<br>means prototype.',
				body: `<div class="callout" data-reveal-item><div><p>The claim map and the risk-ranked queue on this page are not shipped.</p><p>They are the direction, drawn honestly. Everything else on this site describes what the CLI does today.</p></div></div>`,
			}),
			ctaBand(),
			pager(route),
		].join('\n'),
}
