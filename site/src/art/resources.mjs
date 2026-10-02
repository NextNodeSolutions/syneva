// Resources, open source and 404 drawings.
import { artFrame, check, d, from } from './kit.mjs'

// Resources overview: a ruled table of contents.
export function resourcesIndex() {
	const entries = [
		['Get started', '01', 'From install to your first verdict'],
		['Connect your agent', '02', 'The pi package and the CLI contract'],
		['Questions & answers', '03', 'Local state, agents, limits'],
		['Changelog', '04', 'What shipped, from the history'],
	]
	const rows = entries
		.map(
			([title, num, text], i) =>
				`<g class="a-rise" ${d(0.2 + i * 0.12)}><text class="art-head" x="70" y="${132 + i * 70}">${title}</text><text class="art-small" x="70" y="${152 + i * 70}">${text}</text><path class="toc-leader" d="M${title.length * 9.6 + 82} ${128 + i * 70}H486"/><text class="art-label is-accent" x="530" y="${132 + i * 70}" text-anchor="end">${num}</text><path class="art-hair" d="M70 ${170 + i * 70}h460"/></g>`,
		)
		.join('')
	return `<svg viewBox="0 0 600 420" data-compact="50 60 500 330" role="img" aria-labelledby="toc-title toc-desc">
  <title id="toc-title">Resources, as a table of contents</title>
  <desc id="toc-desc">Four resources listed like a book's contents: get started, connect your agent, questions and answers, and the changelog.</desc>
  ${artFrame('toc', 600, 420)}
  <text class="art-tiny a-fade" ${d(0)} x="70" y="80">CONTENTS</text>
  <path class="art-ink-line a-draw" pathLength="1" ${d(0.1)} d="M70 92h460"/>
  ${rows}
  <rect class="toc-ribbon a-move" ${from(0.9, 0, -60)} x="548" y="92" width="14" height="80"/>
  <path class="toc-ribbon-cut" d="M548 172l7-8 7 8"/>
  <rect class="desk-cursor a-sweep" ${d(1.2)} x="60" y="108" width="480" height="56"/>
</svg>`
}

// Get started: three commands, then the desk opens in your browser.
export function startFlow() {
	const steps = [
		['01 · INSTALL', '$ npm install -g syneva', 'added 1 package', 70],
		['02 · OPEN A DESK', '$ syneva', 'desk ready · http://localhost:41873', 180],
		['03 · ATTACH YOUR AGENT', '$ syneva await', '{ "kind": "review", "result": … }', 290],
	]
	const blocks = steps
		.map(
			([label, cmd, out, y], i) =>
				`<g class="a-fade" ${d(0.3 + i * 0.6)}><text class="art-tiny is-accent" x="50" y="${y}">${label}</text></g><text class="art-code a-type" ${d(0.4 + i * 0.6)} x="50" y="${y + 26}">${cmd}</text><text class="art-code ${i === 2 ? 'is-green' : 'is-muted'} a-fade" ${d(0.75 + i * 0.6)} x="50" y="${y + 48}">${out}</text>`,
		)
		.join('')
	return `<svg viewBox="0 0 600 420" data-compact="24 30 316 370" role="img" aria-labelledby="start-title start-desc">
  <title id="start-title">Three commands to your first review</title>
  <desc id="start-desc">Install the CLI with npm, run syneva in your repository and a desk opens on localhost in your browser, then your agent attaches with syneva await and receives your verdict as JSON.</desc>
  ${artFrame('startflow', 600, 420)}
  <g class="a-rise" ${d(0)}><rect class="art-panel is-white" x="34" y="40" width="300" height="340"/><path class="art-hair" d="M34 56h300"/><rect class="term-dot is-accent" x="42" y="45" width="6" height="6"/><rect class="term-dot" x="52" y="45" width="6" height="6"/><rect class="term-dot" x="62" y="45" width="6" height="6"/></g>
  ${blocks}
  <path class="art-route is-accent a-draw" pathLength="1" ${d(1.4)} d="M334 228C352 228 352 200 370 200"/>
  <path class="art-signal a-signal" pathLength="100" ${d(2.2)} d="M334 228C352 228 352 200 370 200"/>
  <g class="a-rise" ${d(1.5)}>
    <rect class="art-panel is-white" x="370" y="100" width="200" height="200"/>
    <path class="art-hair" d="M370 122h200"/><rect class="art-dot" x="378" y="109" width="5" height="5"/><text class="art-tiny" x="390" y="115">localhost:41873</text>
    <path class="art-hair" d="M430 122v178"/>
    <path class="art-lines" d="M380 140h40M380 156h32M380 172h44M380 188h28"/>
    <rect class="art-band-yes" x="431" y="134" width="138" height="30"/><path class="art-lines" d="M440 144h90M440 154h70"/>
    <rect class="art-band-no" x="431" y="172" width="138" height="16"/><path class="art-lines" d="M440 180h80"/>
    <path class="art-lines" d="M440 204h100M440 218h80M440 232h96"/>
    ${check(548, 140, 12, 2)}
    <rect class="anat-send" x="486" y="272" width="76" height="18"/><text class="art-tiny is-white" x="524" y="284.5" text-anchor="middle">SEND · ⇧S</text>
  </g>
  <text class="art-tiny a-fade" ${d(1.8)} x="470" y="322" text-anchor="middle">OPENS IN YOUR BROWSER</text>
</svg>`
}

// Connect your agent: the wire between the agent and the desk.
export function protocolWire() {
	const verbs = ['await', 'comment', 'status', 'reload', 'stop']
	const events = ['question', 'review', 'closed']
	const verbRow = verbs
		.map(
			(verb, i) =>
				`<g class="a-pop" ${d(0.8 + i * 0.1)}><rect class="wire-pill" x="${162 + i * 56}" y="128" width="52" height="18"/><text class="art-tiny" x="${188 + i * 56}" y="140.5" text-anchor="middle">${verb}</text></g>`,
		)
		.join('')
	const eventRow = events
		.map(
			(event, i) =>
				`<g class="a-pop" ${d(1.4 + i * 0.12)}><rect class="wire-pill is-event" x="${222 + i * 58}" y="272" width="52" height="18"/><text class="art-tiny is-accent" x="${248 + i * 58}" y="284.5" text-anchor="middle">${event}</text></g>`,
		)
		.join('')
	return `<svg class="is-dense" viewBox="0 0 600 420" data-compact="30 90 540 290" role="img" aria-labelledby="wire-title wire-desc">
  <title id="wire-title">The contract between your agent and the desk</title>
  <desc id="wire-desc">Your agent talks to the desk with five CLI subcommands: await, comment, status, reload and stop. The desk answers with three kinds of event: question, review and closed. Everything is plain JSON on stdout and a localhost HTTP server.</desc>
  ${artFrame('wire', 600, 420)}
  <g class="a-rise" ${d(0)}><rect class="art-panel is-white" x="40" y="150" width="140" height="120"/><text class="art-tiny" x="54" y="172">YOUR AGENT</text><text class="art-small" x="54" y="194">Claude Code,</text><text class="art-small" x="54" y="211">Codex, Cursor,</text><text class="art-small" x="54" y="228">pi, a script</text><text class="art-code is-accent" x="54" y="256">$ syneva …</text></g>
  <g class="a-rise" ${d(0.2)}><rect class="art-panel is-white" x="420" y="150" width="140" height="120"/><text class="art-tiny" x="434" y="172">YOUR DESK</text><text class="art-small" x="434" y="198">localhost, the tab</text><text class="art-small" x="434" y="216">you review in</text>${check(434, 236, 12)}<rect class="art-pending" x="452" y="236" width="12" height="12"/></g>
  <g fill="none">
    <path class="art-route a-draw" pathLength="1" ${d(0.5)} d="M180 180H420"/>
    <path class="art-route is-accent a-draw" pathLength="1" ${d(1.2)} d="M420 240H180"/>
    <path class="art-signal a-signal" pathLength="100" ${d(1.8)} d="M180 180H420"/>
    <path class="art-signal a-signal" pathLength="100" ${d(2.8)} d="M420 240H180"/>
  </g>
  <path class="seq-head is-muted" d="M420 180l-7-4v8Z"/><path class="seq-head is-accent" d="M180 240l7-4v8Z"/>
  <text class="art-tiny a-fade" ${d(0.7)} x="300" y="116" text-anchor="middle">SUBCOMMANDS · AGENT → DESK</text>
  ${verbRow}
  <text class="art-tiny is-accent a-fade" ${d(1.3)} x="300" y="310" text-anchor="middle">EVENTS · DESK → AGENT</text>
  ${eventRow}
  <g class="a-fade" ${d(2)}><text class="art-tiny" x="300" y="360" text-anchor="middle">PLAIN JSON ON STDOUT · LOCALHOST HTTP · NO VENDOR LOCK-IN</text></g>
  <g class="a-fade is-secondary" ${d(2.1)}><text class="art-code" x="300" y="66" text-anchor="middle">$ syneva spec</text><text class="art-tiny" x="300" y="86" text-anchor="middle">PRINTS THE WHOLE CONTRACT</text></g>
</svg>`
}

// Questions & answers: a disclosure list with one answer open.
export function faqArt() {
	const rows = [
		'Does Syneva review code for me?',
		'Does it ever auto-approve?',
		'Which agents work with it?',
		'Where does my review live?',
	]
	return `<svg viewBox="0 0 600 400" data-compact="40 40 520 330" role="img" aria-labelledby="qa-title qa-desc">
  <title id="qa-title">Straight answers</title>
  <desc id="qa-desc">A list of questions with the first one open: does Syneva review code for me? No. You do; your agent helps.</desc>
  ${artFrame('qa', 600, 400)}
  <path class="art-ink-line a-draw" pathLength="1" ${d(0)} d="M60 70h480"/>
  <g class="a-rise" ${d(0.2)}><text class="art-head" x="60" y="104">${rows[0]}</text><path class="qa-chev is-open" d="M520 92l8 8 8-8"/></g>
  <rect class="qa-open a-sweep" ${d(0.5)} x="60" y="120" width="480" height="96"/>
  <path class="ask-rail a-draw" pathLength="1" ${d(0.6)} d="M60 120v96"/>
  <text class="art-copy is-accent a-type" ${d(0.8)} x="80" y="152">No. You review the code.</text>
  <text class="art-small a-fade" ${d(1.4)} x="80" y="176">Your agent sets the order and answers your questions.</text>
  <text class="art-small a-fade" ${d(1.5)} x="80" y="196">Syneva records your verdicts and hands them back.</text>
  ${rows
		.slice(1)
		.map(
			(row, i) =>
				`<g class="a-rise" ${d(0.3 + i * 0.1)}><path class="art-hair" d="M60 ${236 + i * 50}h480"/><text class="art-copy" x="60" y="${266 + i * 50}">${row}</text><path class="qa-chev" d="M524 ${256 + i * 50}l6 6 6-6"/></g>`,
		)
		.join('')}
  <path class="art-hair" d="M60 386h480"/>
</svg>`
}

// Real commit counts per day, Sept 15 - Oct 2 2026: [feat, fix, perf].
const HISTORY = [
	['09-15', 3, 0, 0],
	['09-16', 1, 0, 0],
	['09-17', 0, 1, 0],
	['09-18', 0, 0, 0],
	['09-19', 1, 2, 3],
	['09-20', 1, 4, 4],
	['09-21', 0, 4, 1],
	['09-22', 1, 2, 5],
	['09-23', 5, 5, 3],
	['09-24', 0, 0, 0],
	['09-25', 0, 0, 0],
	['09-26', 0, 0, 0],
	['09-27', 0, 0, 0],
	['09-28', 0, 0, 0],
	['09-29', 0, 0, 0],
	['09-30', 0, 2, 0],
	['10-01', 1, 0, 0],
	['10-02', 2, 2, 0],
]

// Changelog: shipped work as a day-by-day stacked rail.
export function historyRail() {
	const base = 320
	const columns = HISTORY.map(([day, feat, fix, perf], i) => {
		const x = 52 + i * 28
		const kinds = [
			...Array(feat).fill('feat'),
			...Array(fix).fill('fix'),
			...Array(perf).fill('perf'),
		]
		const cells = kinds
			.map(
				(kind, k) =>
					`<rect class="hist-cell is-${kind}" x="${x}" y="${base - 12 - k * 11}" width="10" height="10"/>`,
			)
			.join('')
		const tick =
			(i % 4 === 0 && i < HISTORY.length - 2) || i === HISTORY.length - 1
				? `<text class="art-tiny" x="${x + 5}" y="${base + 22}" text-anchor="middle">${day.replace('-', '/')}</text>`
				: ''
		return `<g class="a-move" ${from(0.2 + i * 0.05, 0, 30)}>${cells}</g><path class="art-hair" d="M${x + 5} ${base + 2}v5"/>${tick}`
	}).join('')
	return `<svg viewBox="0 0 600 400" data-compact="36 40 540 330" role="img" aria-labelledby="hist-title hist-desc">
  <title id="hist-title">Shipped, day by day</title>
  <desc id="hist-desc">Feature, fix and performance commits per day from September 15 to October 2, 2026, taken from the repository history. The busiest day, September 23, shipped the review notes panel.</desc>
  ${artFrame('hist', 600, 400)}
  <text class="art-tiny a-fade" ${d(0)} x="52" y="66">COMMITS PER DAY · FROM THE GIT HISTORY</text>
  <g class="a-fade" ${d(0.1)}><rect class="hist-cell is-feat" x="52" y="84" width="10" height="10"/><text class="art-tiny" x="68" y="93">FEAT</text><rect class="hist-cell is-fix" x="120" y="84" width="10" height="10"/><text class="art-tiny" x="136" y="93">FIX</text><rect class="hist-cell is-perf" x="180" y="84" width="10" height="10"/><text class="art-tiny" x="196" y="93">PERF</text></g>
  <path class="art-axis a-draw" pathLength="1" ${d(0)} d="M44 ${base + 2}H556"/>
  ${columns}
  <path class="art-route is-accent a-draw" pathLength="1" ${d(1.4)} d="M281 160V130h40"/>
  <text class="art-tiny is-accent a-fade" ${d(1.5)} x="326" y="134">REVIEW NOTES PANEL</text>
</svg>`
}

// Open source: a protocol, an interface, and no model inside.
export function openBox() {
	const agents = ['Claude Code', 'Codex', 'Cursor', 'pi', 'your script']
	return `<svg viewBox="0 0 600 420" data-compact="20 40 570 350" role="img" aria-labelledby="oss-title oss-desc">
  <title id="oss-title">A protocol and an interface, nothing more</title>
  <desc id="oss-desc">Any agent plugs into Syneva over JSON on stdout. Syneva serves your desk over localhost HTTP. The slot where a model would sit is empty, on purpose. MIT licensed.</desc>
  ${artFrame('oss', 600, 420)}
  ${agents.map((name, i) => `<g class="a-rise" ${d(i * 0.08)}><rect class="art-panel is-white" x="40" y="${86 + i * 52}" width="120" height="34"/><text class="art-file" x="54" y="${107 + i * 52}">${name}</text></g><path class="art-route a-draw" pathLength="1" ${d(0.5 + i * 0.06)} d="M160 ${103 + i * 52}C200 ${103 + i * 52} 200 210 240 210"/>`).join('')}
  <path class="art-signal a-signal" pathLength="100" ${d(1.6)} d="M160 103C200 103 200 210 240 210"/>
  <path class="art-signal a-signal" pathLength="100" ${d(3)} d="M160 311C200 311 200 210 240 210"/>
  <g class="a-rise" ${d(0.4)}>
    <rect class="art-panel is-white" x="240" y="120" width="160" height="180"/>
    <text class="art-label" x="256" y="146">syneva</text>
    <rect class="oss-slot" x="256" y="166" width="128" height="58"/>
    <text class="art-tiny" x="320" y="192" text-anchor="middle">NO MODEL</text>
    <text class="art-tiny" x="320" y="208" text-anchor="middle">HERE, ON PURPOSE</text>
    <text class="art-tiny" x="256" y="252">RENDERS THE DIFF</text>
    <text class="art-tiny" x="256" y="268">VALIDATES INPUT</text>
    <text class="art-tiny" x="256" y="284">HANDS BACK A RESULT</text>
  </g>
  <circle class="art-port" cx="240" cy="210" r="3"/>
  <text class="art-tiny a-fade" ${d(0.9)} x="200" y="70" text-anchor="middle">JSON · STDOUT</text>
  <path class="art-route is-green a-draw" pathLength="1" ${d(1)} d="M400 210h60"/>
  <path class="art-signal is-green a-signal" pathLength="100" ${d(2.2)} d="M400 210h60"/>
  <text class="art-tiny a-fade" ${d(1.1)} x="430" y="198" text-anchor="middle">HTTP</text>
  <g class="a-rise" ${d(1.2)}><rect class="art-panel is-mint" x="460" y="170" width="100" height="80"/><text class="art-tiny is-green" x="510" y="196" text-anchor="middle">YOUR DESK</text><text class="art-small" x="510" y="220" text-anchor="middle">localhost</text></g>
  <g class="a-pop" ${d(1.6)}><rect class="oss-stamp" x="464" y="300" width="92" height="44"/><text class="art-head is-accent" x="510" y="329" text-anchor="middle">MIT</text></g>
</svg>`
}

// 404: the page you wanted, as a rejected change.
export function lostDiff() {
	return `<svg viewBox="0 0 560 320" role="img" aria-labelledby="lost-title lost-desc">
  <title id="lost-title">This page, as a diff</title>
  <desc id="lost-desc">A diff where the path you asked for is removed and the home page is added, with a question thread asking where the page went.</desc>
  ${artFrame('lost', 560, 320)}
  <g class="a-rise" ${d(0)}>
    <rect class="art-panel is-white" x="40" y="50" width="480" height="128"/>
    <text class="art-file is-strong" x="56" y="74">routes.ts</text><text class="art-tiny" x="504" y="74" text-anchor="end">+1 −1</text>
    <path class="art-hair" d="M40 86h480"/>
    <rect class="art-band-no" x="41" y="98" width="478" height="26"/>
    <text class="art-code is-del" x="56" y="116">− /the-page-you-wanted</text>
    <path class="art-strike a-draw" pathLength="1" ${d(0.5)} d="M72 112h160"/>
    <rect class="art-band-yes a-sweep" ${d(0.8)} x="41" y="134" width="478" height="26"/>
    <text class="art-code is-add" x="56" y="152">+ /</text>
  </g>
  <path class="ask-anchor a-draw" pathLength="1" ${d(1)} d="M70 178v28"/>
  <g class="a-rise" ${d(1.1)}>
    <rect class="ask-thread" x="56" y="206" width="420" height="78"/><path class="ask-rail" d="M56 206v78"/>
    <text class="art-tiny" x="72" y="226">YOU · ASK</text><text class="art-copy" x="72" y="244">Where did this page go?</text>
    <text class="art-small a-fade" ${d(1.6)} x="72" y="270">It isn’t here. Every page that exists is linked below.</text>
  </g>
</svg>`
}
