import { resourcesIndex } from '../art/resources.mjs'
import { REPO_URL, SECTIONS } from '../nav.mjs'
import {
	command,
	ctaBand,
	indexRows,
	pageHero,
	primary,
	prose,
	textLink,
} from '../ui.mjs'

const resources = SECTIONS.find(section => section.id === 'resources')

export default {
	route: '/resources/',
	title: 'Resources · Syneva',
	description:
		'Everything you need to run your first review with Syneva: setup, the agent contract, straight answers, and the changelog.',
	body: () =>
		[
			pageHero({
				route: '/resources/',
				crumb: 'Resources',
				title: 'Everything for your first review.',
				lede: 'Set up the desk, connect the agent you already use, get straight answers about what Syneva does and doesn’t do, and follow what ships.',
				actions: `${primary('/get-started/', 'Get started')}${textLink(`${REPO_URL}#readme`, 'Read the README', true)}`,
				art: resourcesIndex(),
				caption: 'Four pages, from setup to what shipped.',
			}),
			prose({
				id: 'all',
				title: 'Start anywhere.',
				body: indexRows(resources.items),
			}),
			prose({
				id: 'spec',
				title: 'The contract,<br>from the source.',
				body: `<p data-reveal-item>The full agent contract (modes, events, flags and the <code>ReviewResult</code> shape) is versioned with the CLI and printed by one command. That is the copy your agent should read, because it always matches the binary you installed.</p><div class="chapter-command" data-reveal-item>${command('syneva spec', 'Print the agent contract')}</div><p data-reveal-item>${textLink(`${REPO_URL}/issues`, 'Found a gap? Open an issue', true)}</p>`,
			}),
			ctaBand(),
		].join('\n'),
}
