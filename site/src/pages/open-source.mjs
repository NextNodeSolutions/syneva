import { openBox } from '../art/resources.mjs'
import { REPO_URL } from '../nav.mjs'
import {
	ARROW_RIGHT,
	ctaBand,
	EXT,
	pageHero,
	prose,
	ruledList,
	specTable,
	textLink,
} from '../ui.mjs'

const route = '/open-source/'

export default {
	route,
	title: 'Open source · Syneva',
	description:
		'Syneva is MIT licensed and built in the open: a protocol and an interface you can read end to end. No model inside, no telemetry, no account.',
	body: () =>
		[
			pageHero({
				route,
				crumb: 'Open source',
				title: 'A protocol you can read. Code you can fork.',
				lede: 'Syneva is MIT licensed and built in the open. A tool that sees your diffs should be one you can inspect end to end: no model inside, no telemetry, no account.',
				actions: `<a class="button primary" href="${REPO_URL}">Star it on GitHub ${ARROW_RIGHT}</a>${textLink('/resources/connect-your-agent/', 'Read the contract')}`,
				art: openBox(),
				caption: 'The slot where a model would go is empty, on purpose.',
			}),
			prose({
				id: 'why',
				title: 'Why open.',
				body: ruledList([
					[
						'Trust you can verify.',
						'Your review surface reads your code. You should be able to read it back.',
					],
					[
						'An agent-neutral contract.',
						'Plain JSON and localhost HTTP, versioned with the CLI. Any harness can implement it; none owns it.',
					],
					[
						'No lock-in, by construction.',
						'Your verdicts live in files on your disk, in a documented shape.',
					],
				]),
			}),
			prose({
				id: 'repo',
				title: 'What’s in<br>the repository.',
				body: specTable(
					[
						['apps/syneva', 'The published CLI and pi package.'],
						['packages/contracts', 'The shared wire shapes and the agent spec.'],
						['packages/backend', 'The local server: git, state, the HTTP API.'],
						['packages/frontend', 'The desk itself, rendered with @pierre/diffs.'],
						['site', 'This website.'],
					],
					['Path', 'What lives there'],
				),
			}),
			prose({
				id: 'contribute',
				title: 'Build it with us.',
				body: `<p data-reveal-item>Issues and pull requests are welcome. Commits follow Conventional Commits, and releases are cut automatically from them. The roadmap is public in the README: a command palette, more review modes, and lazy loading for very large diffs.</p><p data-reveal-item>Syneva started as a fork of <a class="text-link" href="https://github.com/ymansurozer/galley">Galley ${EXT}</a>, and is grateful for it.</p><p data-reveal-item>${textLink(`${REPO_URL}/issues`, 'Open an issue', true)}</p>`,
			}),
			ctaBand(),
		].join('\n'),
}
