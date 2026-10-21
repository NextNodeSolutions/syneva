// The frame of the Worker's own pages (sign-in, the device page, sign-out, not found): core's
// http/pages.ts frame and sheet, copied rather than imported (the Worker never imports core), so a
// sign-in on the web reads like the local hub's key page. Tiny and dependency-free on purpose: no
// script, one inline sheet, the faces from the static assets, and the policy that allows exactly
// that.
import { STATIC_PATHS } from '@syneva/contracts/routes'

// The :root values mirror @syneva/design-system's tokens, hand-kept in sync as core's are.
const STYLES = `
:root{color-scheme:light;--paper:#f6f6f0;--white:#ffffff;--ink:#191b18;--muted:#60635c;--accent:#0e6582;--accent-deep:#0b506a;--wash:#dcedf4;--red:#a8322d;--red-tint:#f8e7e3;--line:#dcdfd4;--line-strong:#a8afa1;--grid:#e4e7dc;--wordmark:#dfe3d6;--field:#eef0e7;--sans:Geist,system-ui,-apple-system,'Segoe UI',sans-serif;--mono:'Geist Mono',ui-monospace,'SF Mono',Menlo,monospace;--out:cubic-bezier(.2,0,0,1);--spring:cubic-bezier(.34,1.36,.5,1);--g:48px}
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
.btn.quiet{color:var(--ink);background:var(--white);border-color:var(--line-strong)}.btn.quiet:hover{border-color:var(--muted);background:var(--white)}
.btn svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.5;transition:transform .15s var(--out)}.btn:hover svg{transform:translateX(3px)}
.acts{display:flex;flex-wrap:wrap;align-items:center;gap:16px 24px;margin-top:30px}
.err{display:flex;align-items:center;gap:8px;margin-top:7px;font-size:12.5px;line-height:1.45;color:var(--red)}.err::before{content:'';flex:none;width:7px;height:7px;background:currentColor}
.help{margin-top:22px;max-width:460px;font-size:14px;color:var(--muted)}
.art{position:relative;padding:44px 40px;background-color:var(--field);background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:26px 26px;border:1px solid var(--line-strong)}
.mk{position:absolute;width:12px;height:12px;border:0 solid var(--line-strong)}
.mk.tl{top:18px;left:18px;border-top-width:1px;border-left-width:1px}.mk.tr{top:18px;right:18px;border-top-width:1px;border-right-width:1px}
.mk.bl{bottom:18px;left:18px;border-bottom-width:1px;border-left-width:1px}.mk.br{bottom:18px;right:18px;border-bottom-width:1px;border-right-width:1px}
.art figcaption{position:relative;margin-top:16px;font:11px var(--mono);color:var(--muted);text-wrap:pretty}
.term{position:relative;background:var(--white);border:1px solid var(--ink)}
.tbar{display:flex;align-items:center;gap:14px;padding:10px 16px;border-bottom:1px solid var(--line);font:11px var(--mono);color:var(--muted)}
.dots{display:flex;gap:5px}.dots i{width:8px;height:8px;border:1px solid var(--line-strong)}.dots i:first-child{border-color:var(--accent);background:var(--wash)}
pre{padding:18px 20px;font:12.5px/1.9 var(--mono);white-space:pre-wrap;overflow-wrap:break-word}pre .c{display:block;padding-left:2ch;text-indent:-2ch;color:var(--muted)}pre .cmd{display:flex}pre .p{flex:none;margin-right:10px;color:var(--accent);user-select:none}
.word{border-top:1px solid var(--line);container-type:inline-size;overflow:hidden;padding-inline:calc(var(--g) - 8px)}
.word span{display:block;margin:-.12em 0 0 -.04em;padding-bottom:.2em;font-weight:500;font-size:35.4cqi;letter-spacing:-.075em;line-height:.72;color:var(--wordmark);white-space:nowrap;user-select:none}
.bar{display:flex;justify-content:space-between;gap:20px;padding:20px var(--g);border-top:1px solid var(--line);font:11px var(--mono);color:var(--muted)}
@media (max-width:900px){:root{--g:30px}.page{grid-template-columns:minmax(0,1fr);gap:48px;padding:64px var(--g) 72px}.page>.art{margin-top:0}}
@media (max-width:600px){:root{--g:20px}.top{min-height:64px}.brand{font-size:24px}.page{padding:40px var(--g) 56px}h1{font-size:34px}.lede{font-size:15px}.row{flex-direction:column}.row .btn{align-self:flex-start}.art{padding:36px 16px}.bar{flex-direction:column;gap:6px}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important}}`

const FAVICON =
	'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 fill=%27%23f6f6f0%27/%3E%3Cg stroke=%27%230e6582%27 stroke-width=%272%27 fill=%27none%27%3E%3Cpath d=%27M16 3v7m0 12v7M3 16h7m12 0h7M7 7l5 5m8 8 5 5M7 25l5-5m8-8 5-5%27/%3E%3Cpath d=%27m10 16 6-6 6 6-6 6Z%27/%3E%3C/g%3E%3C/svg%3E'

const MARK =
	'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v5m0 10v5M2 12h5m10 0h5M5 5l4 4m6 6 4 4M5 19l4-4m6-6 4-4"/><path d="M8 12l4-4 4 4-4 4Z"/></svg>'

export const ARROW =
	'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5"/></svg>'

const CORNERS =
	'<i class="mk tl"></i><i class="mk tr"></i><i class="mk bl"></i><i class="mk br"></i>'

const BRAND = `<a class="brand" href="${STATIC_PATHS.index}" aria-label="Syneva, all desks">${MARK}syneva<i aria-hidden="true"></i><small>web</small></a>`

// Every interpolation into markup goes through here: addresses, hub names, codes and paths all
// carry request-derived text.
export function escapeHtml(text: string): string {
	return text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')
}

// Prose with `code` spans, escaped first.
export function prose(message: string): string {
	return escapeHtml(message).replaceAll(/`([^`]+)`/g, '<code>$1</code>')
}

export function crumbs(current: string): string {
	return `<p class="crumbs"><a href="${STATIC_PATHS.index}">Syneva</a><span aria-hidden="true">/</span><b>${escapeHtml(current)}</b></p>`
}

// A terminal drawn beside the words: `lines` are a comment (`# ...`) or a command, already
// escaped by the caller only where they carry request text.
export function terminal(input: {
	title: string
	lines: string[]
	caption: string
}): string {
	const lines = input.lines
		.map(line =>
			line.startsWith('#')
				? `<span class="c">${line}</span>`
				: `<span class="cmd"><span class="p" aria-hidden="true">$</span><span>${line}</span></span>`,
		)
		.join('')
	return `<figure class="art" aria-label="${escapeHtml(input.title)}">${CORNERS}
<div class="term"><div class="tbar"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><span>${escapeHtml(input.title)}</span></div>
<pre>${lines}</pre></div>
<figcaption>${escapeHtml(input.caption)}</figcaption></figure>`
}

// What a page may load, sent with every page (http/answer.ts's `html`, RFC 7): nothing by
// default; its one inline sheet, named by its hash so no other style runs; the faces from the
// assets; the favicon's data URI; forms that post to this web. No script runs at all, and no
// frame may hold a page: the device page's Approve under a transparent overlay is a hub paired by
// a click the person never meant. Hashed once per isolate: the sheet never changes.
export function pagePolicy(): Promise<string> {
	sheetPolicy ??= policyOf(STYLES)
	return sheetPolicy
}

let sheetPolicy: Promise<string> | undefined

async function policyOf(sheet: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		'SHA-256',
		new TextEncoder().encode(sheet),
	)
	const hash = btoa(String.fromCharCode(...new Uint8Array(digest)))
	return [
		"default-src 'none'",
		`style-src 'sha256-${hash}'`,
		"font-src 'self'",
		'img-src data:',
		"form-action 'self'",
		"frame-ancestors 'none'",
		"base-uri 'none'",
	].join('; ')
}

export function page(input: { title: string; body: string }): string {
	return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#f6f6f0"><meta name="robots" content="noindex"><title>${escapeHtml(input.title)}</title>
<link rel="icon" type="image/svg+xml" href="${FAVICON}"><style>${STYLES}</style></head><body>
<div class="frame">
<header class="top">${BRAND}</header>
<main class="page">${input.body}</main>
<div class="word" aria-hidden="true"><span>syneva</span></div>
<footer class="bar"><span>Your agent writes. You decide.</span><span>No model inside · No telemetry</span></footer>
</div></body></html>`
}
