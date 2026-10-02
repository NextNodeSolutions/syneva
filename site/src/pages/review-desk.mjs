import { deskAnatomy, verdictLifecycle } from '../art/product.mjs'
import {
	chapter,
	command,
	ctaBand,
	pageHero,
	pager,
	primary,
	prose,
	ruledList,
} from '../ui.mjs'

const route = '/product/review-desk/'

// The real desk bindings (packages/frontend/src/app/hotkeys-*.ts).
const KEYS = [
	['j', 'Next change'],
	['k', 'Previous change'],
	['⇧Y', 'Keep the change'],
	['⇧N', 'Undo the change'],
	['⇧A', 'Approve the whole file'],
	['c', 'Comment on the line'],
	['⇧C', 'Comment on the file'],
	['⇧→', 'Next file, in reading order'],
	['w', 'Tree or walkthrough'],
	['n', 'Review notes'],
	['⇧H', 'Hide approved changes'],
	['⇧E', 'Open in your editor'],
	['⇧S', 'Send to agent'],
	['?', 'The full keyboard map'],
]

const kbdGrid = () =>
	`<div class="kbd-grid" data-reveal-item>${KEYS.map(
		([key, label]) =>
			`<div class="kbd-row"><kbd>${key}</kbd><span>${label}</span></div>`,
	).join('')}</div>`

export default {
	route,
	title: 'Review desk · Syneva',
	description:
		'Judge every change your agent made: keep or undo each hunk, approve whole files, comment on lines, and send a structured verdict back. Keyboard-first and local.',
	body: () =>
		[
			pageHero({
				route,
				crumb: 'Review desk',
				title: 'A verdict on every change.',
				state: 'available',
				lede: 'Your agent’s diff opens in a local browser tab, rendered in full and ready to judge. Keep what’s right, undo what isn’t, sign off whole files, and send the result back without leaving the keyboard.',
				actions: `${primary('/get-started/', 'Open your first desk')}${command('syneva', 'Start a review')}`,
				art: deskAnatomy(),
				caption: 'Illustrative wireframe. Your diff, your agent, your verdicts.',
			}),
			chapter({
				id: 'verdicts',
				title: 'Verdicts, not vibes.',
				body: [
					'A verdict in Syneva is a record: this change, kept or undone, by you. It is not inferred from git staging and never granted in bulk by a model.',
					'Each change is content-hashed. When your agent rewrites something you already kept, it comes back pending on the next reload. What it left alone keeps your verdict, round after round.',
				],
				list: [
					[
						'Nothing is auto-approved.',
						'Every change starts pending. Only your keypress settles it.',
					],
					[
						'Approve a whole file.',
						'⇧A signs off a file. Turn on “Approve stages file” and a clean approval stages it in git too.',
					],
					[
						'Stale trust can’t hide.',
						'Approvals and comment anchors follow the same hashing rule as verdicts.',
					],
				],
				art: verdictLifecycle(),
				caption: 'Pending → kept or undone → pending again only if rewritten',
			}),
			prose({
				id: 'keyboard',
				title: 'The keyboard<br>is the fast path.',
				body: `<p data-reveal-item>Every major action has a key, and the help overlay is generated from the same table that runs them, so the hints never drift from the behavior.</p>${kbdGrid()}`,
			}),
			prose({
				id: 'rounds',
				title: 'Made for the second round,<br>and the tenth.',
				body: ruledList([
					[
						'Hide what you already approved.',
						'⇧H distills a multi-round review down to what still needs your eyes.',
					],
					[
						'Every note in one panel.',
						'n opens the review notes: every comment and question across files, filterable, one key from its line.',
					],
					[
						'Reset with a scalpel.',
						'Clear decisions and sign-offs but keep your notes, or reset only the approved files.',
					],
					[
						'Make it yours.',
						'Split or stacked diffs, intra-line highlights, wrapping, fourteen code themes, your fonts, light or dark.',
					],
				]),
			}),
			ctaBand(),
			pager(route),
		].join('\n'),
}
