import { historyRail } from '../art/resources.mjs'
import { REPO_URL } from '../nav.mjs'
import { ctaBand, pageHero, pager, prose, textLink } from '../ui.mjs'

const route = '/resources/changelog/'

// Curated from the repository history (Conventional Commits). Product
// changes only; refactors and chores stay in git log.
const WEEKS = [
	[
		'2026-09-30',
		'September 30 – October 2',
		'A public home, and fewer surprises',
		[
			['feat', 'Syneva gets its public site, served as static assets.'],
			['fix', 'A stale strip appears when the working diff moves under your review.'],
			['fix', 'pi: questions go straight to the correspondent; your session wakes only for reviews.'],
		],
	],
	[
		'2026-09-23',
		'September 23',
		'Review notes',
		[
			['feat', 'Review notes panel (n): every comment and question across files, with jumps.'],
			['feat', 'Filter, lens and a keyboard cursor inside the notes panel.'],
			['feat', 'Navigation follows the active view order; resolve and approve from the notes.'],
			['feat', 'Signing off a file moves you to the next unsigned one.'],
			['feat', 'Scoped reset: clear decisions but keep your notes, or reset approved files only.'],
			['fix', 'Interrupted file swaps keep their visible rows; stale async paints are ignored.'],
			['perf', 'The visible part of a diff gets its color first, from the plain grid.'],
		],
	],
	[
		'2026-09-19',
		'September 19 – 22',
		'A faster, steadier desk',
		[
			['feat', 'The desk chrome moves to React over a reactive store.'],
			['perf', 'The opening viewport is colored before the first paint.'],
			['perf', 'Syntax highlighting follows what you can see, one grammar per language.'],
			['feat', 'Frontend performance is tracked as data, time to color included.'],
			['fix', 'Empty untracked files show as additions.'],
		],
	],
	[
		'2026-09-15',
		'September 15 – 17',
		'Closing the loop',
		[
			['feat', 'Close the desk from the browser; your agent receives a closed event.'],
			['feat', 'Hide approved changes (⇧H) to focus a multi-round review.'],
			['feat', 'One correspondent thread per desk answers your questions.'],
			['feat', 'A read-only answer subagent ships with the pi package.'],
			['fix', 'Prompts wait for the desk URL instead of sleeping.'],
		],
	],
]

const weeks = () =>
	`<ol class="version-list">${WEEKS.map(
		([iso, label, title, items]) =>
			`<li data-reveal-item><time datetime="${iso}">${label}</time><h3>${title}</h3><ul>${items
				.map(
					([kind, text]) =>
						`<li><b class="tag-${kind}">${kind}</b>${text}</li>`,
				)
				.join('')}</ul></li>`,
	).join('')}</ol>`

export default {
	route,
	title: 'Changelog · Syneva',
	description:
		'What shipped in Syneva, straight from the repository history: review notes, a faster desk, and a tighter loop between you and your agent.',
	body: () =>
		[
			pageHero({
				route,
				crumb: 'Changelog',
				title: 'What shipped.',
				lede: 'Straight from the git history, grouped by week and written for humans. Releases are cut automatically from the commit messages; this page tells you what they mean for your review.',
				actions: textLink(`${REPO_URL}/commits/main`, 'Every commit on GitHub', true),
				art: historyRail(),
				caption: 'Counts of feat, fix and perf commits. Not a growth chart.',
			}),
			prose({
				id: 'log',
				title: 'Recent changes.',
				body: weeks(),
			}),
			ctaBand(),
			pager(route),
		].join('\n'),
}
