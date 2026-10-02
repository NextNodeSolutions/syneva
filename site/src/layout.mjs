import {
	ICONS,
	OPEN_SOURCE,
	REPO_URL,
	SECTIONS,
	SITE_URL,
	sectionOf,
} from './nav.mjs'

export const icon = (name, className = '') =>
	`<svg${className ? ` class="${className}"` : ''} viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`

export const MARK =
	'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v5m0 10v5M2 12h5m10 0h5M5 5l4 4m6 6 4 4M5 19l4-4m6-6 4-4"/><path d="M8 12l4-4 4 4-4 4Z"/></svg>'

const ARROW = '<span aria-hidden="true">↗</span>'
const CHEVRON =
	'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5 6 3 3 3-3"/></svg>'

const current = (href, route) =>
	href === route ? ' aria-current="page"' : ''

// The product menu keeps its illustrative side preview: each link swaps in a
// tiny, honest scene of what that page is about.
const PREVIEWS = {
	review: `<div class="preview-caption"><span>YOUR LOCAL DESK</span><span class="preview-dot"></span></div><div class="preview-diff"><div class="preview-filename">auth/session.ts <span>+2 −1</span></div><div class="preview-code"><span class="diff-minus">− return run(req)</span><span class="diff-plus">+ await verifySession(req)</span><span class="diff-plus">+ return run(req)</span></div><div class="preview-verdict"><span class="verdict-check">✓</span> Accepted by you</div></div><p>Your agent writes.<br><strong>You decide what stays.</strong></p>`,
	guide: `<div class="preview-caption"><span>A READING ORDER</span><span class="preview-dot"></span></div><div class="preview-tree"><div><span>01</span><strong>Start with the contract</strong><small>contracts/review.ts</small></div><div><span>02</span><strong>Follow the behavior</strong><small>auth/session.ts</small></div><div><span>03</span><strong>Check the interface</strong><small>pages/desk.tsx</small></div></div><p>Your agent sets the order.<br><strong>Every file stays visible.</strong></p>`,
	ask: `<div class="preview-caption"><span>ON THE EXACT LINE</span><span class="preview-dot"></span></div><div class="preview-conversation"><code>+ await verifySession(req)</code><div><span>YOU</span><p>What if the session already expired?</p></div><div><span>YOUR AGENT</span><p>It returns 401 before the handler runs.</p></div></div><p>Ask where it matters.<br><strong>The answer stays there.</strong></p>`,
	plan: `<div class="preview-caption"><span>PLAN DESK · PROTOTYPE</span></div><div class="preview-plan"><span>plan.md</span><strong>Move session checks<br>into middleware.</strong><div>What happens when<br>the session expires? <span>?</span></div></div><p>Find the assumption.<br><strong>Settle it before the diff.</strong></p>`,
}

function productPanel(section, route) {
	const links = section.items
		.map(
			item =>
				`<a class="menu-link" href="${item.href}" data-preview="${item.preview}"${current(item.href, route)}>${icon(item.icon)}<span><strong>${item.title}${item.badge ? ` <em>${item.badge}</em>` : ''}</strong><small>${item.blurb}</small></span><span class="menu-arrow" aria-hidden="true">→</span></a>`,
		)
		.join('')
	const scenes = Object.entries(PREVIEWS)
		.map(
			([name, body], index) =>
				`<div class="preview-scene${index === 0 ? ' is-current' : ''}" data-scene="${name}">${body}</div>`,
		)
		.join('')
	return `<div class="product-menu-body"><div class="product-links">${links}</div><div class="nav-preview" aria-hidden="true">${scenes}<span class="preview-example">Illustrative example</span></div></div>`
}

function workflowsPanel(section, route) {
	return `<div class="workflow-links">${section.items
		.map(
			item =>
				`<a class="workflow-link" href="${item.href}"${current(item.href, route)}><strong>${icon(item.icon)}${item.title} <span aria-hidden="true">→</span></strong><span>${item.blurb}</span><code>${item.code}</code></a>`,
		)
		.join('')}</div>`
}

function resourcesPanel(section, route) {
	return `<div class="resource-links">${section.items
		.map(
			item =>
				`<a class="menu-link" href="${item.href}"${current(item.href, route)}>${icon(item.icon)}<span><strong>${item.title}</strong><small>${item.blurb}</small></span><span class="menu-arrow" aria-hidden="true">→</span></a>`,
		)
		.join('')}</div>`
}

const PANELS = {
	product: productPanel,
	workflows: workflowsPanel,
	resources: resourcesPanel,
}

function header(route) {
	const active = sectionOf(route)
	const triggers = SECTIONS.map(
		section =>
			`<button class="nav-trigger${active === section ? ' is-section' : ''}" id="${section.id}-trigger" type="button" aria-expanded="false" aria-controls="${section.id}-menu">${section.label} ${CHEVRON}</button>`,
	).join('')
	const panels = SECTIONS.map(
		section =>
			`<section class="nav-panel ${section.id}-menu" id="${section.id}-menu" aria-labelledby="${section.id}-trigger" aria-hidden="true" inert>${PANELS[section.id](section, route)}<a class="menu-footer" href="${section.href}"${current(section.href, route)}><span>${section.footer}</span><span>${section.overview} <span aria-hidden="true">→</span></span></a></section>`,
	).join('')
	const noscript = [...SECTIONS.map(s => [s.href, s.label]), [OPEN_SOURCE.href, OPEN_SOURCE.title]]
		.map(([href, label]) => `<a href="${href}">${label}</a>`)
		.join('')
	return `<header class="navigation">
    <a class="brand" href="/" aria-label="Syneva home">${MARK}syneva</a>
    <nav class="nav-links" id="site-navigation" aria-label="Main navigation">
      ${triggers}
      <a class="nav-direct${route === OPEN_SOURCE.href ? ' is-section' : ''}" href="${OPEN_SOURCE.href}"${current(OPEN_SOURCE.href, route)}>Open source</a>
      <span class="nav-indicator" aria-hidden="true"></span>
    </nav>
    <a class="nav-action" href="/get-started/"${current('/get-started/', route)}>Get started <span aria-hidden="true">→</span></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-navigation" aria-label="Open navigation"><span class="nav-toggle-label">Menu</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 7h12M4 13h12"/></svg></button>
    <div class="nav-dropdown" data-open="false">${panels}</div>
    <noscript>${noscript}</noscript>
  </header>`
}

function footer() {
	const columns = SECTIONS.map(
		section =>
			`<div class="footer-col"><a class="footer-head" href="${section.href}">${section.label}</a><ul>${section.items
				.map(item => `<li><a href="${item.href}">${item.title}</a></li>`)
				.join('')}</ul></div>`,
	).join('')
	return `<footer class="site-footer">
    <div class="footer-top">
      <div class="footer-pitch"><a class="brand" href="/" aria-label="Syneva home">${MARK}syneva</a><p>The review desk for code your agent wrote. Local, open source, and built for the human in the loop.</p><a class="button primary small" href="/get-started/">Start a local review <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5"/></svg></a></div>
      <nav class="footer-map" aria-label="Site map">${columns}<div class="footer-col"><a class="footer-head" href="${OPEN_SOURCE.href}">Project</a><ul><li><a href="${OPEN_SOURCE.href}">Open source</a></li><li><a href="${REPO_URL}">GitHub ${ARROW}</a></li><li><a href="${REPO_URL}/blob/main/LICENSE">MIT license ${ARROW}</a></li><li><a href="${REPO_URL}/issues">Report an issue ${ARROW}</a></li></ul></div></nav>
    </div>
    <div class="footer-word" aria-hidden="true"><span>syneva</span></div>
    <div class="footer-bottom"><span>Your agent writes. You decide.</span><span>No model inside · No telemetry · MIT</span></div>
  </footer>`
}

const BASE_STYLES = [
	'styles.css',
	'art.css',
	'motion.css',
	'navigation.css',
	'navigation-menus.css',
	'navigation-preview.css',
	'navigation-responsive.css',
]

export function documentShell({
	route,
	title,
	description,
	body,
	styles = [],
	scripts = [],
}) {
	const canonical = `${SITE_URL}${route}`
	const css = [...BASE_STYLES, ...styles]
		.map(file => `<link rel="stylesheet" href="/${file}">`)
		.join('\n  ')
	const js = ['motion.js', 'navigation.js', ...scripts]
		.map(file => `<script src="/${file}" type="module"></script>`)
		.join('\n  ')
	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f6f6f0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Syneva">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE_URL}/og.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/mark.svg" type="image/svg+xml">
  <link rel="preload" href="/fonts/geist.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/geist-mono.woff2" as="font" type="font/woff2" crossorigin>
  <script>document.documentElement.classList.add('js')</script>
  ${css}
  ${js}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<div class="page-frame">
  ${header(route)}
  <main id="main">
${body}
  </main>
  ${footer()}
</div>
</body>
</html>
`
}
