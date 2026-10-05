import { HUB_PATHS } from '@syneva/contracts/routes'

// The hub's server-rendered pages: the sign-in form (hosted mode) and the not-found page. Tiny
// and dependency-free on purpose - they must render even when the UI bundle is missing - and
// they speak the desk's own palette (DESIGN.md: the verdict ledger) so a sign-in never looks
// like a foreign service.

const PALETTE = `
:root{color-scheme:dark;--bg:#070909;--surface:#0b0e0f;--panel:#101415;--line:#222a2d;--line-strong:#354146;
--ink:#d9d9d4;--ink-bright:#fafafa;--muted:#8a9396;--cyan:#00a8ff;--cyan-bg:#081923;--cyan-line:#17394a;--cyan-fg:#8fc4d4;--red-fg:#ff8095;
--sans:Geist,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;--mono:'JetBrains Mono',ui-monospace,monospace}
*{box-sizing:border-box}html,body{margin:0;min-height:100%}
body{background:var(--bg);color:var(--ink);font:13px/1.5 var(--sans);display:grid;place-items:center;padding:24px}
.card{width:min(100%,380px);background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:22px 22px 20px}
.label{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}
h1{font-size:17px;font-weight:700;margin:0 0 6px;color:var(--ink-bright)}p{margin:0 0 14px;color:var(--muted)}
input{width:100%;background:var(--bg);color:var(--ink);border:1px solid var(--line-strong);border-radius:6px;padding:8px 10px;font:13px var(--mono)}
input:focus{outline:none;border-color:var(--cyan)}
button{margin-top:12px;width:100%;background:var(--cyan-bg);color:var(--cyan-fg);border:1px solid var(--cyan-line);border-radius:6px;padding:7px 10px;font:600 13px var(--sans);cursor:pointer}
button:hover{border-color:var(--cyan)}.err{color:var(--red-fg);margin:10px 0 0}code{font-family:var(--mono);font-size:12px}
a{color:var(--cyan-fg)}`

function escapeHtml(text: string): string {
	return text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
}

function shell(title: string, body: string): string {
	return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>${PALETTE}</style></head><body>${body}</body></html>`
}

export function loginPage(input: { next: string; error?: string }): string {
	const action = `${HUB_PATHS.login}?next=${encodeURIComponent(input.next)}`
	const error = input.error
		? `<p class="err">${escapeHtml(input.error)}</p>`
		: ''
	return shell(
		'Syneva - sign in',
		`<form class="card" method="post" action="${escapeHtml(action)}" autocomplete="off">
<p class="label">Syneva hub</p><h1>Access key</h1>
<p>This hub answers only to its key. Paste the key it was started with (<code>syneva start --key</code>).</p>
<input type="password" name="key" aria-label="Access key" autofocus required>${error}
<button type="submit">Open the hub</button></form>`,
	)
}

export function notFoundPage(message: string): string {
	return shell(
		'Syneva - not found',
		`<div class="card"><p class="label">Syneva hub</p><h1>Nothing here</h1><p>${escapeHtml(message)}</p><p><a href="/">Back to the dashboard</a></p></div>`,
	)
}
