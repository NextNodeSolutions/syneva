import { HUB_PATHS, STATIC_PATHS } from '@syneva/contracts/routes'

// Tiny and dependency-free on purpose - they must render even when the UI bundle is missing (no JS, one inline sheet).
// They speak the public site's language like the dashboard they lead to, so a sign-in never looks like a foreign service.

// The :root values mirror @syneva/design-system's tokens - hand-kept in sync, since StyleX variables only exist in a StyleX build and these pages must not depend on the built stylesheet.
// The faces load from the hub's font route (answered before the access guard), so a keyed hub's sign-in still sets in Geist.
const STYLES = `
:root{color-scheme:light;--paper:#f6f6f0;--white:#ffffff;--ink:#191b18;--muted:#60635c;--accent:#0e6582;--accent-deep:#0b506a;--wash:#dcedf4;--wash-tint:#eff7fa;--mint:#e0eddf;--green:#35633f;--red:#a8322d;--red-tint:#f8e7e3;--line:#dcdfd4;--line-strong:#a8afa1;--grid:#e4e7dc;--wordmark:#dfe3d6;--field:#eef0e7;--sans:Geist,system-ui,-apple-system,'Segoe UI',sans-serif;--mono:'Geist Mono',ui-monospace,'SF Mono',Menlo,monospace;--out:cubic-bezier(.2,0,0,1);--spring:cubic-bezier(.34,1.36,.5,1);--g:48px}
@font-face{font-family:Geist;src:url(${STATIC_PATHS.fontsPrefix}geist.woff2) format('woff2');font-weight:100 900;font-display:swap}
@font-face{font-family:'Geist Mono';src:url(${STATIC_PATHS.fontsPrefix}geist-mono.woff2) format('woff2');font-weight:100 900;font-display:swap}
*,*::before,*::after{box-sizing:border-box}html{background:var(--paper)}
body{margin:0;color:var(--ink);font:16px/1.6 var(--sans);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
::selection{background:var(--wash);color:var(--ink)}:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
a{color:inherit;text-decoration:none}p,h1,figure,pre{margin:0}
code{font:.87em var(--mono);background:var(--wash);color:var(--ink);padding:1px 5px;white-space:nowrap}
.frame{max-width:1280px;min-height:100vh;margin:0 auto;border-inline:1px solid var(--line);display:flex;flex-direction:column}
.top{min-height:76px;padding:0 var(--g);display:flex;align-items:center;border-bottom:1px solid var(--line)}
.brand{display:flex;align-items:center;gap:9px;font-size:26px;font-weight:600;letter-spacing:-.05em;line-height:1}
.brand svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.8;transition:transform .6s var(--spring)}
a.brand:hover svg{transform:rotate(45deg)}.brand i{width:1px;height:18px;background:var(--line-strong);margin:0 2px 0 5px}
.brand small{position:relative;top:2px;font:400 12px var(--mono);letter-spacing:.02em;color:var(--muted)}
.page{flex:1;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:64px;align-items:start;padding:88px var(--g) 104px}.page>.art{margin-top:50px}
.crumbs{display:flex;gap:8px;margin-bottom:32px;font:11.5px var(--mono);color:var(--muted)}.crumbs a:hover{color:var(--accent)}.crumbs b{font-weight:400;color:var(--ink)}
h1{max-width:12em;font-size:clamp(36px,4.2vw,52px);font-weight:500;letter-spacing:-.04em;line-height:1.07;text-wrap:balance}
.lede{margin-top:18px;max-width:440px;font-size:15.5px;line-height:1.6;color:var(--muted);text-wrap:pretty}
form{margin-top:30px;max-width:520px}
label{display:block;margin-bottom:8px;font:500 13px var(--sans);color:var(--ink)}
.row{display:flex;gap:10px}
input{flex:1;min-width:0;min-height:40px;padding:0 12px;font:13px var(--mono);color:var(--ink);background:var(--white);border:1px solid var(--line-strong);border-radius:0;caret-color:var(--accent);transition:border-color .15s var(--out),box-shadow .15s var(--out)}
input:hover{border-color:var(--muted)}input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--wash)}
input[aria-invalid=true]{border-color:var(--red)}input[aria-invalid=true]:focus{box-shadow:0 0 0 3px var(--red-tint)}
.btn{display:inline-flex;align-items:center;gap:14px;min-height:44px;padding:0 18px;font:500 14px var(--sans);color:var(--white);background:var(--accent);border:1px solid var(--accent);border-radius:0;cursor:pointer;white-space:nowrap;transition:background-color .15s var(--out),border-color .15s var(--out),transform .15s var(--out)}
.btn:hover{background:var(--accent-deep);border-color:var(--accent-deep)}.btn:active{transform:scale(.97)}
.btn svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.5;transition:transform .15s var(--out)}.btn:hover svg{transform:translateX(3px)}
.acts{display:flex;flex-wrap:wrap;align-items:center;gap:16px 24px;margin-top:30px}
.tl{display:inline-flex;align-items:center;gap:12px;font-size:14px;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:5px;text-decoration-color:var(--line-strong);transition:color .15s var(--out),text-decoration-color .15s var(--out)}
.tl:hover{color:var(--accent);text-decoration-color:var(--accent)}.tl span{display:inline-block;transition:transform .15s var(--out)}.tl:hover span{transform:translateX(3px)}
.err{display:flex;align-items:center;gap:8px;margin-top:7px;font-size:12.5px;line-height:1.45;color:var(--red)}.err::before{content:'';flex:none;width:7px;height:7px;background:currentColor}
.help{margin-top:22px;max-width:460px;font-size:14px;color:var(--muted)}
.art{position:relative;padding:44px 40px;background-color:var(--field);background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:26px 26px;border:1px solid var(--line-strong)}
.mk{position:absolute;width:12px;height:12px;border:0 solid var(--line-strong)}
.mk.tl{top:18px;left:18px;border-top-width:1px;border-left-width:1px}.mk.tr{top:18px;right:18px;border-top-width:1px;border-right-width:1px}
.mk.bl{bottom:18px;left:18px;border-bottom-width:1px;border-left-width:1px}.mk.br{bottom:18px;right:18px;border-bottom-width:1px;border-right-width:1px}
.art figcaption{position:relative;margin-top:16px;font:11px var(--mono);color:var(--muted);text-wrap:pretty}
.term,.card{position:relative;background:var(--white);border:1px solid var(--ink)}
.tbar{display:flex;align-items:center;gap:14px;padding:10px 16px;border-bottom:1px solid var(--line);font:11px var(--mono);color:var(--muted)}
.dots{display:flex;gap:5px}.dots i{width:8px;height:8px;border:1px solid var(--line-strong)}.dots i:first-child{border-color:var(--accent);background:var(--wash)}
pre{padding:18px 20px;font:12.5px/1.9 var(--mono);white-space:pre-wrap;overflow-wrap:break-word}pre .c{display:block;padding-left:2ch;text-indent:-2ch;color:var(--muted)}pre .cmd{display:flex}pre .p{flex:none;margin-right:10px;color:var(--accent);user-select:none}
.chead{display:flex;justify-content:space-between;gap:16px;padding:12px 16px;border-bottom:1px solid var(--line);font:11px var(--mono)}.chead span:last-child{color:var(--muted)}
.lines{padding:12px 0}.ln{display:flex;gap:12px;padding:5px 16px;font:12.5px var(--mono);overflow-wrap:anywhere}
.rm{background:var(--wash);color:var(--accent)}.add{margin-top:8px;background:var(--mint);color:var(--green)}
.anchor{position:relative;width:1px;height:24px;margin-left:30px;background:var(--accent)}
.ask{position:relative;margin:0 56px 0 16px;padding:12px 16px;background:var(--wash-tint);border-left:2px solid var(--accent)}
.who{font:10px var(--mono);letter-spacing:.06em;color:var(--muted)}.q{margin-top:2px;font-size:14px}.a{margin-top:6px;font-size:13px;line-height:1.5;color:var(--muted);text-wrap:balance}
.word{border-top:1px solid var(--line);container-type:inline-size;overflow:hidden;padding-inline:calc(var(--g) - 8px)}
.word span{display:block;margin:-.12em 0 0 -.04em;padding-bottom:.2em;font-weight:500;font-size:35.4cqi;letter-spacing:-.075em;line-height:.72;color:var(--wordmark);white-space:nowrap;user-select:none}
.bar{display:flex;justify-content:space-between;gap:20px;padding:20px var(--g);border-top:1px solid var(--line);font:11px var(--mono);color:var(--muted)}
@media (max-width:900px){:root{--g:30px}.page{grid-template-columns:minmax(0,1fr);gap:48px;padding:64px var(--g) 72px}.page>.art{margin-top:0}}
@media (max-width:600px){:root{--g:20px}.top{min-height:64px}.brand{font-size:24px}.page{padding:40px var(--g) 56px}h1{font-size:34px}.lede{font-size:15px}.row{flex-direction:column}.row .btn{align-self:flex-start}.art{padding:36px 16px}.ask{margin-right:16px}.bar{flex-direction:column;gap:6px}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important}}`

const FAVICON =
	'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 fill=%27%23f6f6f0%27/%3E%3Cg stroke=%27%230e6582%27 stroke-width=%272%27 fill=%27none%27%3E%3Cpath d=%27M16 3v7m0 12v7M3 16h7m12 0h7M7 7l5 5m8 8 5 5M7 25l5-5m8-8 5-5%27/%3E%3Cpath d=%27m10 16 6-6 6 6-6 6Z%27/%3E%3C/g%3E%3C/svg%3E'

// Rays, diamond and action arrow drawn as the design system draws them: copied, since the backend never imports a front's design source.
const MARK =
	'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v5m0 10v5M2 12h5m10 0h5M5 5l4 4m6 6 4 4M5 19l4-4m6-6 4-4"/><path d="M8 12l4-4 4 4-4 4Z"/></svg>'
const ARROW =
	'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5"/></svg>'

const CORNERS =
	'<i class="mk tl"></i><i class="mk tr"></i><i class="mk bl"></i><i class="mk br"></i>'

function command(text: string): string {
	return `<span class="cmd"><span class="p" aria-hidden="true">$</span><span>${text}</span></span>`
}

const KEY_FIGURE = `<figure class="art" aria-label="Where the key comes from">${CORNERS}
<div class="term"><div class="tbar"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><span>where the key comes from</span></div>
<pre><span class="c"># on the hub's machine, next to the repos</span>${command('syneva start --host 0.0.0.0 --key &lt;secret&gt;')}<span class="c"># an agent on that same machine</span>${command('SYNEVA_KEY=&lt;secret&gt; syneva open')}</pre></div>
<figcaption>This browser keeps a digest of the key, never the key.</figcaption></figure>`

type ShellInput = {
	title: string
	brandLink: boolean
	body: string
}

// Every interpolation into markup goes through here: titles, messages, paths and the sign-in's destination all carry request-derived text.
function escapeHtml(text: string): string {
	return text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')
}

function proseHtml(message: string): string {
	return escapeHtml(message).replaceAll(/`([^`]+)`/g, '<code>$1</code>')
}

const BRAND_CONTENT = `${MARK}syneva<i aria-hidden="true"></i><small>hub</small>`

const BRAND = {
	link: `<a class="brand" href="${STATIC_PATHS.index}" aria-label="Syneva hub, all desks">${BRAND_CONTENT}</a>`,
	plain: `<div class="brand">${BRAND_CONTENT}</div>`,
} as const

function shell({ title, brandLink, body }: ShellInput): string {
	return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#f6f6f0"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title>
<link rel="icon" type="image/svg+xml" href="${FAVICON}"><style>${STYLES}</style></head><body>
<div class="frame">
<header class="top">${brandLink ? BRAND.link : BRAND.plain}</header>
<main class="page">${body}</main>
<div class="word" aria-hidden="true"><span>syneva</span></div>
<footer class="bar"><span>Your agent writes. You decide.</span><span>No model inside · No telemetry</span></footer>
</div></body></html>`
}

export function loginPage(input: { next: string; error?: string }): string {
	const action = `${HUB_PATHS.login}?next=${encodeURIComponent(input.next)}`
	const invalid = input.error
		? ' aria-invalid="true" aria-describedby="key-error"'
		: ''
	const error = input.error
		? `<p class="err" id="key-error" role="alert">${escapeHtml(input.error)}</p>`
		: ''
	return shell({
		title: 'Sign in · Syneva hub',
		brandLink: false,
		body: `<div><p class="crumbs" aria-hidden="true"><span>Hub</span><span>/</span><b>Sign in</b></p>
<h1>This hub answers to its key.</h1>
<p class="lede">It was started with an access key and opens only for whoever holds it. Paste the key once: this browser stays signed in for a year, or until you sign out.</p>
<form method="post" action="${escapeHtml(action)}" autocomplete="off"><label for="key">Access key</label>
<div class="row"><input id="key" name="key" type="password" spellcheck="false" autocapitalize="off" required autofocus${invalid}>
<button class="btn" type="submit">Open the hub${ARROW}</button></div>
${error}</form>
<p class="help">It is the key the hub was started with: <code>syneva start --key</code>, or <code>SYNEVA_KEY</code> in its environment.</p></div>
${KEY_FIGURE}`,
	})
}

export type NotFoundCopy = {
	title: string
	crumb: string
	heading: string
	lede: string
	help?: string
	question: string
	answer: string
}

// True of every unknown desk id: the id hashes the repository root and the session, so reopening that session there brings the desk back at this same address - with its review when the open is the same one.
export const DESK_NOT_OPEN: NotFoundCopy = {
	title: 'Desk not open · Syneva hub',
	crumb: 'Desk',
	heading: 'This desk isn\u2019t open.',
	lede: 'It was closed, or this hub never had it. A closed desk keeps its review.',
	help: 'Run the same `syneva open` (same mode and session) in its repository and it comes back at this address.',
	question: 'Where did this desk go?',
	answer: 'It isn\u2019t open on this hub. A closed desk keeps its review on the hub\u2019s machine.',
}

export const NOTHING_HERE: NotFoundCopy = {
	title: 'Not found · Syneva hub',
	crumb: 'Not found',
	heading: 'Nothing at this address.',
	lede: 'This hub serves its dashboard and its desks. Every open desk is listed there.',
	question: 'What is at this address?',
	answer: 'Nothing this hub serves. Its dashboard lists every open desk.',
}

const SETUP_GUIDE = 'https://syneva.dev/get-started/'

function undoneAddressFigure(copy: NotFoundCopy, path: string): string {
	return `<figure class="art" aria-hidden="true">${CORNERS}
<div class="card"><div class="chead"><span>hub · open desks</span><span>+1 &minus;1</span></div>
<div class="lines"><p class="ln rm"><span>&minus;</span><s>${escapeHtml(path)}</s></p><p class="ln add"><span>+</span><span>${STATIC_PATHS.index}</span></p></div></div>
<div class="anchor"></div>
<div class="ask"><p class="who">YOU · ASK</p><p class="q">${escapeHtml(copy.question)}</p><p class="a">${escapeHtml(copy.answer)}</p></div>
<figcaption>Illustrative. The struck line is the address you asked for.</figcaption></figure>`
}

export function notFoundPage(copy: NotFoundCopy, path: string): string {
	const help = copy.help ? `<p class="help">${proseHtml(copy.help)}</p>` : ''
	return shell({
		title: copy.title,
		brandLink: true,
		body: `<div><p class="crumbs"><a href="${STATIC_PATHS.index}">Hub</a><span aria-hidden="true">/</span><b>${escapeHtml(copy.crumb)}</b></p>
<h1>${escapeHtml(copy.heading)}</h1>
<p class="lede">${proseHtml(copy.lede)}</p>
<div class="acts"><a class="btn" href="${STATIC_PATHS.index}">Back to all desks${ARROW}</a><a class="tl" href="${SETUP_GUIDE}" target="_blank" rel="noopener noreferrer">Setup guide<span aria-hidden="true">↗</span></a></div>
${help}</div>
${undoneAddressFigure(copy, path)}`,
	})
}
