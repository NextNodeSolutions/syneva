import { startFlow } from '../art/resources.mjs'
import { REPO_URL } from '../nav.mjs'
import {
	command,
	pageHero,
	pager,
	prose,
	specTable,
	terminal,
	textLink,
} from '../ui.mjs'

const route = '/get-started/'

const firstKeys = [
	['j / k', 'Move between changes'],
	['⇧Y / ⇧N', 'Keep or undo the change'],
	['c, then ⌘⇧↵', 'Ask your agent about the line'],
	['⇧A', 'Approve the whole file'],
	['⇧S', 'Send your verdict to the agent'],
	['?', 'Every other key'],
]

export default {
	route,
	title: 'Get started · Syneva',
	description:
		'Install Syneva, open a desk over your agent’s diff, and let your agent hear back. The whole path from install to your first verdict, for pi and for any other agent.',
	body: () =>
		[
			pageHero({
				route,
				crumb: 'Get started',
				title: 'From install to your first verdict.',
				lede: 'Two commands open a desk. One more lets your agent hear back. Here is the whole path, for pi and for every other agent.',
				actions: command('npm install -g syneva', 'Installation command'),
				art: startFlow(),
				caption: 'Install · open a desk · attach your agent',
			}),
			prose({
				id: 'requirements',
				title: 'What you need.',
				body: specTable(
					[
						['Node 22+', 'For the CLI.'],
						['git', 'Every review mode reads your repository through git.'],
						['A browser', 'The desk is a tab on localhost.'],
						['Your coding agent', 'Codex, Cursor, pi, or anything that runs a shell command.'],
						['gh (optional)', 'Only to review pull requests by number or URL.'],
					],
					['Requirement', 'Why'],
				),
			}),
			prose({
				id: 'install',
				title: '1. Install.',
				body: `<p data-reveal-item>As a pi package, Syneva ships the CLI, a <code>/syneva</code> status command, the <code>/review</code> and <code>/plan</code> prompt templates, a skill, and a read-only answer subagent. Everywhere else, install the CLI from npm.</p>${terminal(
					[
						'# with pi: pin a tag or commit',
						'$ pi install git:github.com/walid-mos/syneva@<ref>',
						'',
						'# anywhere else',
						'$ npm install -g syneva',
					],
					'install',
				)}`,
			}),
			prose({
				id: 'open',
				title: '2. Open a desk.',
				body: `<p data-reveal-item>Run it next to the repository your agent just changed. The desk opens in your browser and stays open across rounds.</p>${terminal(
					[
						'$ cd your-repository',
						'$ syneva',
						'# desk ready, open in your browser',
					],
					'your repository',
				)}<p data-reveal-item>${textLink('/workflows/', 'Staged changes, pull requests and single files')}</p>`,
			}),
			prose({
				id: 'attach',
				title: '3. Let your agent<br>hear back.',
				body: `<p data-reveal-item><strong>In pi,</strong> run <code>/review</code>: it starts a desk and attaches your session, so your Sends and questions reach the agent on their own.</p><p data-reveal-item><strong>With any other agent,</strong> ask it to run <code>syneva spec</code> and follow the loop it describes. In short:</p>${terminal(
					[
						'# your agent, after it edits',
						'$ syneva await          # blocks until you Send or ask',
						'$ syneva comment …      # answers your question on the line',
						'$ syneva reload         # shows its next revision in your tab',
					],
					'your agent',
				)}<p data-reveal-item>${textLink('/resources/connect-your-agent/', 'The full agent contract')}</p>`,
			}),
			prose({
				id: 'review',
				title: '4. Review<br>and Send.',
				body: `${specTable(firstKeys, ['Keys', 'Does'])}<div class="callout is-green" data-reveal-item><div><p>That’s the loop.</p><p>Your agent acts on the verdict, reloads, and the next round lands in the same tab. Stuck somewhere? ${textLink('/resources/faq/', 'Questions & answers')} or ${textLink(`${REPO_URL}/issues`, 'open an issue', true)}.</p></div></div>`,
			}),
			pager(route),
		].join('\n'),
}
