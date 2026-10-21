// What a browser gets for an address the Worker serves nothing at.
import { ARROW, crumbs, escapeHtml, page } from './shell.js'

export function notFoundPage(path: string): string {
	return page({
		title: 'Not found · Syneva',
		body: `<div>${crumbs('Not found')}
<h1>Nothing at this address.</h1>
<p class="lede">The web serves the dashboard of your paired hubs and their desks; <code>${escapeHtml(path)}</code> is neither.</p>
<div class="acts"><a class="btn" href="/">All desks${ARROW}</a></div></div>`,
	})
}
