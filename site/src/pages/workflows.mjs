import { workflowHub } from '../art/workflows.mjs'
import { SECTIONS } from '../nav.mjs'
import {
	ctaBand,
	indexRows,
	pageHero,
	primary,
	prose,
	specTable,
	textLink,
} from '../ui.mjs'

const workflows = SECTIONS.find(section => section.id === 'workflows')

export default {
	route: '/workflows/',
	title: 'Workflows · Syneva',
	description:
		'Review your working tree, your staged changes, a branch or pull request, or a single file like a plan. Four ways in, one local desk, one structured verdict.',
	body: () =>
		[
			pageHero({
				route: '/workflows/',
				crumb: 'Workflows',
				title: 'Four ways in.<br>One desk.',
				lede: 'Review whatever your agent just did: the working tree, what you staged, a whole branch or pull request, or a single file like a plan. The desk, the keys and the handoff stay the same every time.',
				actions: `${primary('/get-started/', 'Start a local review')}${textLink('/product/', 'What’s on the desk')}`,
				art: workflowHub(),
				caption: 'Every mode produces the same verdict. Its mode field says how to read it.',
			}),
			prose({
				id: 'modes',
				title: 'Pick the one<br>that fits the moment.',
				body: indexRows(
					workflows.items,
					item => `<code>${item.code}</code>`,
				),
			}),
			prose({
				id: 'commands',
				title: 'Every command,<br>at a glance.',
				body: `${specTable(
					[
						['syneva start', 'The hub: one process per machine, the dashboard of every project and desk.'],
						['syneva', 'The working-tree diff, untracked files included (same as <code>syneva open</code>).'],
						['syneva --path src/auth', 'The same, narrowed to one path.'],
						['syneva --diff staged', 'Only what is staged in the index.'],
						['syneva pr <ref>', 'A branch, PR number or GitHub URL vs its merge-base.'],
						['syneva pr <ref> --base main', 'The same, against a base you choose.'],
						['syneva file <path>', 'One file, tracked or not.'],
						['syneva --guide <file>', 'Attach your agent’s reading order to any of the above.'],
						['syneva desks', 'The live desks of this repo, with their URLs.'],
						['syneva close', 'Close the desk. The hub keeps running; your review state stays saved.'],
					],
					['Command', 'What opens'],
				)}<p data-reveal-item>Every desk lives on the hub, which the first open starts for you. Your agent drives the rest of the loop with <code>await</code>, <code>comment</code>, <code>status</code> and <code>reload</code>. ${textLink('/resources/connect-your-agent/', 'See the agent contract')}</p>`,
			}),
			prose({
				id: 'remote',
				title: 'Reviewing from<br>another machine?',
				body: `<p data-reveal-item>The hub binds to <code>127.0.0.1</code> by default. To review from your laptop while the agents run on a server, start it with <code>--host</code> and an access key: <code>syneva start --host 0.0.0.0 --key …</code>. You sign in once in the browser; your agents send the key.</p><div class="callout" data-reveal-item><div><p>The key is the lock.</p><p>Whoever holds it can drive every desk on that hub: run your editor command, stage changes, read the repos. Without a key the hub refuses to bind beyond loopback unless you say <code>--insecure</code>, which belongs on a personal tailnet, never on a coffee-shop Wi-Fi.</p></div></div>`,
			}),
			ctaBand(),
		].join('\n'),
}
