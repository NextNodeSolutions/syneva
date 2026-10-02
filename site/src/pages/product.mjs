import { deskLayers } from '../art/product.mjs'
import { SECTIONS } from '../nav.mjs'
import {
	ctaBand,
	indexRows,
	pageHero,
	primary,
	prose,
	ruledList,
	textLink,
} from '../ui.mjs'

const product = SECTIONS.find(section => section.id === 'product')

export default {
	route: '/product/',
	title: 'Product · Syneva',
	description:
		'Syneva is a local review desk for agent-written code: a reading order, questions on the exact line, a verdict on every change, and a structured handoff back to your agent.',
	body: () =>
		[
			pageHero({
				route: '/product/',
				crumb: 'Product',
				title: 'The review desk for code your agent wrote.',
				lede: 'Syneva is an integrated review environment: a browser desk on localhost where you read your agent’s diff in order, question it on the line and record a verdict on every change. It runs no model of its own. The judgment is yours, the agent is yours, and the code stays on your machine.',
				actions: `${primary('/get-started/', 'Start a local review')}${textLink('/workflows/', 'See the four workflows')}`,
				art: deskLayers(),
				caption: 'Four layers, one desk. The verdicts on top are yours alone.',
			}),
			prose({
				id: 'desk',
				title: 'What’s on the desk.',
				body: `<p data-reveal-item>Each part of the desk answers one question you have when an agent hands you a diff: what changed, in what order should I read it, why is this here, and what do I keep.</p>${indexRows(product.items)}`,
			}),
			prose({
				id: 'commitments',
				title: 'Three commitments<br>we won’t trade away.',
				body: ruledList([
					[
						'No model runs inside Syneva.',
						'It never calls an LLM and never orchestrates one. It renders the diff, validates what it is given, and hands a result back.',
					],
					[
						'Your agent, not ours.',
						'The contract is plain JSON on stdout plus a localhost HTTP server. Whatever agent you use today can drive it, and so can tomorrow’s.',
					],
					[
						'The review is yours.',
						'Verdicts are recorded per change. Nothing is auto-approved, no file is hidden, and a change your agent rewrites goes back to pending.',
					],
				]),
			}),
			prose({
				id: 'daily',
				title: 'Built for the daily loop.',
				body: `<p data-reveal-item>Syneva is built by someone who reviews agent-written code every day. Anything that costs a round-trip or a re-orientation is treated as a defect.</p>${ruledList(
					[
						[
							'One tab across rounds.',
							'Each repo and session binds a stable port, so a restarted desk reattaches and the open tab heals itself.',
						],
						[
							'Decisions survive everything.',
							'Every save is persisted under ~/.syneva. Reloads, restarts and crashes keep your verdicts.',
						],
						[
							'Keyboard first.',
							'Move, keep, undo, comment, approve and send without touching the mouse. Press ? for the full map.',
						],
						[
							'Your editor, one key away.',
							'Configure a repo-scoped editor command and jump to the current file and line with ⇧E.',
						],
					],
				)}`,
			}),
			ctaBand(),
		].join('\n'),
}
