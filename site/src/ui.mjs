// Shared page sections. Every subpage is built from these few pieces, so the
// reading rhythm (hero, ruled chapters, CTA, pager) stays identical across
// the site and only the words and drawings change.
import { icon } from './layout.mjs'
import { REPO_URL, siblingsOf } from './nav.mjs'

export const ARROW_RIGHT =
	'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5"/></svg>'
export const EXT = '<span aria-hidden="true">↗</span>'

export const esc = value =>
	String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')

// A selectable command with copy feedback (motion.js wires every .command).
let commandCount = 0
export function command(text, label = 'Command') {
	commandCount += 1
	const id = `command-${commandCount}`
	return `<div class="command"><span aria-hidden="true">$</span><input id="${id}" value="${esc(text)}" readonly aria-label="${label}" spellcheck="false"><button class="copy-command" type="button" aria-label="Copy: ${esc(text)}"><svg class="icon-copy" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 7h9v10H7ZM4 13H2V2h10v2"/></svg><svg class="icon-check" viewBox="0 0 20 20" aria-hidden="true"><path d="m4 11 5 5 8-11"/></svg></button><span class="copy-status" role="status" aria-live="polite"></span></div>`
}

// Terminal-style block: "$ " lines are commands (prompt drawn, not
// selectable), "#" lines are comments, anything else is plain output.
export function terminal(lines, title = 'terminal') {
	const body = lines
		.map(line => {
			if (line.startsWith('$ '))
				return `<span class="t-line"><span class="t-prompt" aria-hidden="true">$</span>${esc(line.slice(2))}</span>`
			if (line.startsWith('#'))
				return `<span class="t-comment">${esc(line)}</span>`
			return `<span class="t-out">${esc(line) || ' '}</span>`
		})
		.join('')
	return `<figure class="terminal" data-reveal-item><div class="terminal-top"><span class="terminal-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>${title}</span></div><pre>${body}</pre></figure>`
}

export function crumbs(route, title) {
	const { section } = siblingsOf(route)
	const trail = section && section.href !== route
		? `<a href="${section.href}">${section.label}</a><span aria-hidden="true">/</span>`
		: ''
	return `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Syneva</a><span aria-hidden="true">/</span>${trail}<span aria-current="page">${title}</span></nav>`
}

export function status(kind) {
	return kind === 'prototype'
		? '<p class="page-status is-prototype"><span aria-hidden="true"></span>Prototype · not in the CLI today</p>'
		: '<p class="page-status"><span aria-hidden="true"></span>Available now · in the CLI</p>'
}

// The page hero: words on the left, the page's own drawing on the right.
export function pageHero({
	route,
	crumb,
	title,
	lede,
	state,
	actions = '',
	art,
	caption,
}) {
	return `<section class="page-hero" aria-labelledby="page-title" data-reveal>
      <div class="page-hero-copy">
        ${crumbs(route, crumb)}
        <h1 id="page-title" data-reveal-item>${title}</h1>
        ${state ? `<div data-reveal-item>${status(state)}</div>` : ''}
        <p class="page-lede" data-reveal-item>${lede}</p>
        ${actions ? `<div class="page-actions" data-reveal-item>${actions}</div>` : ''}
      </div>
      <figure class="page-art motion-scene" data-reveal-item>${art}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>
    </section>`
}

export const primary = (href, label) =>
	`<a class="button primary" href="${href}">${label} ${ARROW_RIGHT}</a>`
export const textLink = (href, label, external = false) =>
	`<a class="text-link" href="${href}">${label} ${external ? EXT : '<span aria-hidden="true">→</span>'}</a>`

// A ruled chapter: copy and drawing side by side, alternating per call.
export function chapter({ id, title, body, list = [], art, caption, reverse, after = '' }) {
	const items = list.length
		? `<ul class="detail-list">${list
				.map(
					([head, text]) =>
						`<li data-reveal-item><strong>${head}</strong><span>${text}</span></li>`,
				)
				.join('')}</ul>`
		: ''
	return `<section class="chapter${reverse ? ' is-reverse' : ''}"${id ? ` id="${id}"` : ''} data-reveal data-rule>
      <div class="chapter-copy"><h2 data-reveal-item>${title}</h2>${body
				.map(p => `<p data-reveal-item>${p}</p>`)
				.join('')}${items}${after}</div>
      <figure class="chapter-art motion-scene" data-reveal-item>${art}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>
    </section>`
}

// Plain prose section with an optional side column.
export function prose({ id, title, body, side = '' }) {
	return `<section class="prose section-pad"${id ? ` id="${id}"` : ''} data-reveal data-rule>
      <h2 data-reveal-item>${title}</h2>
      <div class="prose-body">${body}</div>${side}
    </section>`
}

export function ruledList(items) {
	return `<ol class="ruled-list">${items
		.map(
			([head, text], index) =>
				`<li data-reveal-item><span class="step-index">${String(index + 1).padStart(2, '0')}</span><strong>${head}</strong><p>${text}</p></li>`,
		)
		.join('')}</ol>`
}

// Key/value spec rows in mono, for flags, events and fields.
export function specTable(rows, head = ['', '']) {
	return `<div class="spec-table" role="table" data-reveal-item><div class="spec-row spec-head" role="row"><span role="columnheader">${head[0]}</span><span role="columnheader">${head[1]}</span></div>${rows
		.map(
			([key, value]) =>
				`<div class="spec-row" role="row"><code role="cell">${key}</code><span role="cell">${value}</span></div>`,
		)
		.join('')}</div>`
}

export function ctaBand({
	title = 'Keep the speed.<br>Keep the understanding.',
	text = 'Two commands to your first desk. Bring the agent you already use.',
} = {}) {
	return `<section class="start section-pad" data-reveal>
      <div class="start-copy"><h2 data-reveal-item>${title}</h2><p data-reveal-item>${text}</p><div class="start-links" data-reveal-item>${textLink('/get-started/', 'Read the setup guide')}${textLink(REPO_URL, 'Star it on GitHub', true)}</div></div>
      <div class="install" data-reveal-item><p class="install-label">Install · Node 22+ and git</p>${command('npm install -g syneva', 'Installation command')}<p class="install-then">Then, inside your repository</p>${command('syneva', 'Start a review')}</div>
    </section>`
}

export function pager(route) {
	const { section, previous, next } = siblingsOf(route)
	if (!section) return ''
	const cell = (item, dir) =>
		item
			? `<a class="pager-link is-${dir}" href="${item.href}"><small>${dir === 'prev' ? '← Previous' : 'Next →'}</small>${icon(item.icon)}<strong>${item.title}</strong><span>${item.blurb}</span></a>`
			: `<a class="pager-link is-${dir}" href="${section.href}"><small>${dir === 'prev' ? '← Back to' : 'Back to →'}</small><strong>${section.overview}</strong><span>${section.footer}</span></a>`
	return `<nav class="pager" aria-label="${section.label} pages">${cell(previous, 'prev')}${cell(next, 'next')}</nav>`
}

// Linked index rows for overview pages: icon drawing, title, blurb.
export function indexRows(items, extra = () => '') {
	return `<div class="index-rows">${items
		.map(
			(item, index) =>
				`<a class="index-row" href="${item.href}" data-reveal-item><span class="index-num">${String(index + 1).padStart(2, '0')}</span>${icon(item.icon, 'index-icon')}<span class="index-text"><strong>${item.title}${item.badge ? ` <em>${item.badge}</em>` : ''}</strong><span>${item.blurb}</span></span>${extra(item)}<span class="index-arrow" aria-hidden="true">→</span></a>`,
		)
		.join('')}</div>`
}

export function faqRows(items) {
	return `<div class="faq-rows">${items
		.map(
			([q, a]) =>
				`<details data-reveal-item><summary>${q}</summary><p>${a}</p></details>`,
		)
		.join('')}</div>`
}

// FAQ grouped by domain: an index of the domains, then one block per domain
// with its questions as native disclosures. Groups are [title, blurb, items].
const qaId = index => `qa-${index + 1}`
const qaCount = items =>
	`${items.length} question${items.length === 1 ? '' : 's'}`

export function qaIndex(groups) {
	return `<nav class="qa-index" aria-label="Questions by topic" data-reveal>${groups
		.map(
			([title, blurb, items], index) =>
				`<a href="#${qaId(index)}" data-reveal-item><strong>${title}<small>${String(items.length).padStart(2, '0')}</small></strong><span>${blurb}</span></a>`,
		)
		.join('')}</nav>`
}

export function qaBlock([title, blurb, items], index) {
	return `<section class="chapter qa-block" id="${qaId(index)}" aria-labelledby="${qaId(index)}-title" data-reveal data-rule>
      <div class="chapter-copy"><span class="step-index" data-reveal-item>${String(index + 1).padStart(2, '0')} · ${qaCount(items)}</span><h2 id="${qaId(index)}-title" data-reveal-item>${title}</h2><p data-reveal-item>${blurb}</p></div>
      <div class="qa-list">${items
				.map(
					([q, a]) =>
						`<details class="qa-row" data-reveal-item><summary>${q}</summary><p>${a}</p></details>`,
				)
				.join('')}</div>
    </section>`
}

// SVG scaffolding shared by every drawing: the ruled grid and corner marks.
export function artFrame(id, width, height) {
	return `<defs><pattern id="${id}-grid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="var(--grid)"/></pattern></defs><rect width="${width}" height="${height}" fill="url(#${id}-grid)"/><path class="art-register" d="M18 30V18h12M${width - 30} 18h12v12M18 ${height - 30}v12h12M${width - 30} ${height - 18}h12v-12" fill="none"/>`
}
