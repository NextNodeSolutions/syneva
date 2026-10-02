// Product section drawings. Same vocabulary as the home page: the markup is
// the finished pose, motion.css plays the entrance once the section arrives.
import { artFrame, check, cross, d, from, pending } from './kit.mjs'

// Flat 128-unit content square mapped onto an isometric sheet face.
const ISO = 'matrix(.859 .43 -.859 .43 0 -55)'
const sheet = (body, cls = '') =>
	`<path class="iso-edge${cls}" d="M-110 0 0 55 110 0v6L0 61-110 6Z"/><path class="iso-face${cls}" d="M0-55 110 0 0 55-110 0Z"/><g transform="${ISO}">${body}</g>`

// Product overview: the desk, exploded into the four layers it is made of.
export function deskLayers() {
	const layers = [
		{
			y: 388,
			from: -138,
			label: '01 · THE DIFF',
			text: 'Everything your agent changed.',
			body: [70, 92, 50, 84, 62, 40]
				.map(
					(w, i) =>
						`<rect class="iso-mark ${i % 3 === 1 ? 'is-del' : 'is-add'}" x="12" y="${20 + i * 16}" width="6" height="6"/><rect class="iso-bar" x="24" y="${20 + i * 16}" width="${w}" height="6"/>`,
				)
				.join(''),
		},
		{
			y: 296,
			from: -46,
			label: '02 · WALKTHROUGH',
			text: 'Your agent’s reading order.',
			cls: ' is-guide',
			body: [0, 1, 2]
				.map(
					i =>
						`<rect class="iso-num" x="12" y="${16 + i * 38}" width="12" height="12"/><rect class="iso-bar" x="32" y="${18 + i * 38}" width="${[78, 64, 86][i]}" height="7"/><rect class="iso-bar is-faint" x="32" y="${32 + i * 38}" width="${[52, 70, 40][i]}" height="5"/>`,
				)
				.join(''),
		},
		{
			y: 204,
			from: 46,
			label: '03 · THREADS',
			text: 'Questions pinned to the line.',
			cls: ' is-thread',
			body: `<rect class="iso-bar is-faint" x="14" y="18" width="90" height="6"/><rect class="iso-band" x="10" y="34" width="110" height="14"/><rect class="iso-bar" x="14" y="38" width="76" height="6"/><rect class="iso-bubble" x="26" y="60" width="92" height="50"/><rect class="iso-rail" x="26" y="60" width="4" height="50"/><rect class="iso-bar" x="38" y="72" width="62" height="5"/><rect class="iso-bar is-accent" x="38" y="90" width="48" height="5"/>`,
		},
		{
			y: 112,
			from: 138,
			label: '04 · VERDICTS',
			text: 'Yours. Recorded per change.',
			cls: ' is-verdict',
			body: [0, 1, 2, 3]
				.map(
					i =>
						`<rect class="iso-bar" x="14" y="${20 + i * 26}" width="${[70, 82, 60, 76][i]}" height="7"/><rect class="iso-verdict ${i === 2 ? 'is-no' : 'is-yes'}" x="104" y="${16 + i * 26}" width="14" height="14"/>`,
				)
				.join(''),
		},
	]
	const sheets = layers
		.map(
			(layer, i) =>
				`<g class="a-move" ${from(0.1 + i * 0.12, 0, layer.from)}><g transform="translate(220 ${layer.y})">${sheet(layer.body, layer.cls ?? '')}</g></g>`,
		)
		.join('')
	const labels = layers
		.map(
			(layer, i) =>
				`<path class="art-route a-draw" pathLength="1" ${d(1 + i * 0.12)} d="M332 ${layer.y}h48"/><circle class="art-port" cx="332" cy="${layer.y}" r="2.5"/><g class="a-fade" ${d(1.15 + i * 0.12)}><text class="art-tiny ${i === 3 ? 'is-green' : i === 0 ? '' : 'is-accent'}" x="392" y="${layer.y - 4}">${layer.label}</text><text class="art-small" x="392" y="${layer.y + 14}">${layer.text}</text></g>`,
		)
		.join('')
	return `<svg viewBox="0 0 600 460" data-compact="96 40 504 420" role="img" aria-labelledby="layers-title layers-desc">
  <title id="layers-title">The review desk, layer by layer</title>
  <desc id="layers-desc">Four stacked sheets: your agent's diff at the bottom, the walkthrough your agent can attach above it, the questions you pin to lines above that, and your verdicts on top.</desc>
  ${artFrame('layers', 600, 460)}
  ${sheets}${labels}
</svg>`
}

// Review desk: an annotated wireframe of the desk.
export function deskAnatomy() {
	const files = [
		['CONTRACTS', 110, 'section'],
		['contracts/review.ts', 130, 'yes'],
		['BEHAVIOR', 158, 'section'],
		['auth/session.ts', 178, 'current'],
		['api/middleware.ts', 200, 'pending'],
		['INTERFACE', 228, 'section'],
		['pages/desk.tsx', 248, 'pending'],
		['OTHER', 276, 'section'],
		['README.md', 296, 'yes'],
	]
	const side = files
		.map(([name, y, kind]) => {
			if (kind === 'section')
				return `<text class="art-tiny is-accent" x="38" y="${y}">${name}</text>`
			const mark =
				kind === 'yes' ? check(164, y - 9, 10) : pending(164, y - 9, 10)
			return `<text class="art-file${kind === 'current' ? ' is-strong' : ''}" x="38" y="${y}">${name}</text>${mark}`
		})
		.join('')
	const marker = (n, x, y, delay) =>
		`<g class="a-pop" ${d(delay)}><rect class="anat-num" x="${x}" y="${y}" width="16" height="16"/><text class="anat-num-text" x="${x + 8}" y="${y + 11.5}" text-anchor="middle">${n}</text></g>`
	return `<svg viewBox="0 0 600 450" data-compact="176 22 408 380" role="img" aria-labelledby="anat-title anat-desc">
  <title id="anat-title">Anatomy of the review desk</title>
  <desc id="anat-desc">A wireframe of the desk with five numbered parts: the walkthrough sidebar, the keep and undo verdicts on each change, a question thread anchored to a line, the review progress strip, and the Send to agent button. Illustrative, not a screenshot.</desc>
  ${artFrame('anat', 600, 450)}
  <g class="a-rise" ${d(0)}>
    <rect class="art-panel is-white" x="24" y="30" width="552" height="362"/>
    <path class="art-hair" d="M24 62h552M184 62v330M184 96h392"/>
    <text class="art-label" x="38" y="51">syneva</text><text class="art-tiny" x="300" y="50" text-anchor="middle">AUTH-REFACTOR · ROUND 2</text>
    <rect class="anat-send" x="486" y="37" width="80" height="18"/><text class="art-tiny is-white" x="526" y="49.5" text-anchor="middle">SEND · ⇧S</text>
    <rect class="art-track" x="24" y="62" width="552" height="3"/>
    <rect class="art-fill a-sweep" ${d(1.6)} x="24" y="62" width="330" height="3"/>
    <text class="art-label" x="38" y="86">WALKTHROUGH</text>
    ${side}
    <rect class="desk-cursor a-pulse" x="28" y="166" width="152" height="18"/>
    <text class="art-tiny" x="38" y="378">3 OF 5 FILES SETTLED</text>
    <text class="art-file is-strong" x="198" y="84">auth/session.ts</text><text class="art-tiny" x="312" y="84">+12 −3</text>
    <rect class="art-kbd" x="470" y="72" width="96" height="17"/><text class="art-tiny" x="518" y="84" text-anchor="middle">APPROVE · ⇧A</text>
  </g>
  <g class="a-fade" ${d(0.3)}>
    <text class="art-ln" x="210" y="120" text-anchor="end">12</text><text class="art-code" x="222" y="120">export function handle(req) {</text>
    <rect class="art-band-yes a-sweep" ${d(0.7)} x="185" y="126" width="390" height="40"/>
    <text class="art-ln" x="210" y="140" text-anchor="end">13</text><text class="art-code is-add" x="222" y="140">+  await verifySession(req)</text>
    <text class="art-ln" x="210" y="160" text-anchor="end">14</text><text class="art-code is-add" x="222" y="160">+  return run(req)</text>
    <path class="art-hair" d="M184 180h392"/>
    <rect class="art-band-no a-sweep" ${d(1.1)} x="185" y="194" width="390" height="20"/>
    <text class="art-ln" x="210" y="208" text-anchor="end">41</text><text class="art-code is-del" x="222" y="208">+  cache.set(token, user)</text>
    <path class="art-strike a-draw" pathLength="1" ${d(1.3)} d="M238 204h148"/>
    <text class="art-ln" x="210" y="230" text-anchor="end">42</text><text class="art-code" x="222" y="230">   return user</text>
  </g>
  <g class="a-pop" ${d(0.9)}><rect class="art-chip-yes" x="494" y="136" width="72" height="20"/><text class="art-tiny is-green" x="530" y="149.5" text-anchor="middle">✓ KEEP ⇧Y</text></g>
  <g class="a-pop" ${d(1.25)}><rect class="art-chip-no" x="494" y="194" width="72" height="20"/><text class="art-tiny is-accent" x="530" y="207.5" text-anchor="middle">✕ UNDO ⇧N</text></g>
  <g class="a-rise" ${d(1.5)}>
    <path class="ask-anchor" d="M214 214v40"/>
    <rect class="ask-thread" x="206" y="254" width="356" height="96"/><path class="ask-rail" d="M206 254v96"/>
    <text class="art-tiny" x="222" y="275">YOU · ASK</text><text class="art-copy" x="222" y="293">Why not cache the user here?</text>
    <text class="art-tiny is-accent" x="222" y="318">YOUR AGENT</text><text class="art-copy" x="222" y="336">Tokens rotate, so the cache would go stale.</text>
  </g>
  ${marker(1, 150, 72, 1.9)}${marker(2, 474, 115, 2)}${marker(3, 544, 262, 2.1)}${marker(4, 372, 68, 2.2)}${marker(5, 462, 38, 2.3)}
  <g class="a-fade is-secondary" ${d(2.4)}><text class="art-tiny" x="24" y="424"><tspan class="anat-key">1</tspan> WALKTHROUGH   <tspan class="anat-key">2</tspan> KEEP / UNDO   <tspan class="anat-key">3</tspan> THREAD   <tspan class="anat-key">4</tspan> PROGRESS   <tspan class="anat-key">5</tspan> SEND</text></g>
</svg>`
}

// Review desk: what happens to a verdict across rounds.
export function verdictLifecycle() {
	return `<svg class="is-dense" viewBox="0 0 600 310" data-compact="40 20 550 285" role="img" aria-labelledby="life-title life-desc">
  <title id="life-title">The life of a verdict</title>
  <desc id="life-desc">Every change starts pending. You keep it or undo it. After your agent edits and reloads, a change it rewrote returns to pending, while a change it left untouched keeps your verdict.</desc>
  ${artFrame('life', 600, 310)}
  <g class="art-routes" fill="none">
    <path class="art-route a-draw" pathLength="1" ${d(0.4)} d="M170 140C230 140 230 72 290 72"/>
    <path class="art-route a-draw" pathLength="1" ${d(0.55)} d="M170 160C230 160 230 228 290 228"/>
    <path class="art-route a-draw" pathLength="1" ${d(0.9)} d="M410 72C440 72 440 140 470 140"/>
    <path class="art-route a-draw" pathLength="1" ${d(1)} d="M410 228C440 228 440 160 470 160"/>
    <path class="art-route is-dotted a-draw" pathLength="1" ${d(1.4)} d="M525 175V272q0 12-12 12H127q-12 0-12-12V175"/>
    <path class="art-signal a-signal" pathLength="100" ${d(1.8)} d="M170 140C230 140 230 72 290 72"/>
    <path class="art-signal is-green a-signal" pathLength="100" ${d(2.4)} d="M410 72C440 72 440 140 470 140"/>
    <path class="art-signal a-signal" pathLength="100" ${d(3)} d="M525 175V272q0 12-12 12H127q-12 0-12-12V175"/>
  </g>
  <g class="a-rise" ${d(0)}><rect class="art-pending" x="60" y="125" width="110" height="50"/><text class="art-label" x="115" y="148" text-anchor="middle">PENDING</text><text class="art-small" x="115" y="165" text-anchor="middle">every change</text></g>
  <g class="a-rise" ${d(0.7)}><rect class="art-panel is-mint" x="290" y="47" width="120" height="50"/><text class="art-label is-green" x="350" y="70" text-anchor="middle">✓ KEPT</text><text class="art-small" x="350" y="87" text-anchor="middle">you pressed ⇧Y</text></g>
  <g class="a-rise" ${d(0.8)}><rect class="art-panel is-peach" x="290" y="203" width="120" height="50"/><text class="art-label is-accent" x="350" y="226" text-anchor="middle">✕ UNDONE</text><text class="art-small" x="350" y="243" text-anchor="middle">you pressed ⇧N</text></g>
  <g class="a-rise" ${d(1.1)}><rect class="art-panel is-white" x="470" y="125" width="110" height="50"/><text class="art-label" x="525" y="148" text-anchor="middle">RELOAD</text><text class="art-small" x="525" y="165" text-anchor="middle">agent edited</text></g>
  <text class="art-tiny a-fade" ${d(1.5)} x="320" y="302" text-anchor="middle">REWRITTEN → BACK TO PENDING</text>
  <text class="art-tiny is-green a-fade" ${d(1.6)} x="350" y="34" text-anchor="middle">UNTOUCHED → STAYS SETTLED</text>
  <text class="art-tiny a-fade" ${d(0.2)} x="60" y="114">CONTENT-HASHED</text>
</svg>`
}

// Walkthrough: the git order on the left becomes the guide's order on the right.
export function guideSort() {
	const ghosts = [
		'README.md',
		'api/middleware.ts',
		'auth/session.ts',
		'contracts/review.ts',
		'lib/hash.ts',
		'pages/desk.tsx',
	]
	const ghostY = name => 92 + ghosts.indexOf(name) * 44
	const sections = [
		['01 · CONTRACTS', 84, [['contracts/review.ts', 92]]],
		[
			'02 · BEHAVIOR',
			146,
			[
				['auth/session.ts', 154],
				['api/middleware.ts', 190],
			],
		],
		['03 · INTERFACE', 246, [['pages/desk.tsx', 254]]],
		[
			'OTHER · LISTED ANYWAY',
			308,
			[
				['README.md', 316],
				['lib/hash.ts', 352],
			],
		],
	]
	let order = 0
	const right = sections
		.map(([label, y, rows], s) => {
			const head = `<text class="art-tiny ${s === 3 ? '' : 'is-accent'} a-fade" ${d(0.3 + s * 0.25)} x="330" y="${y - 4}">${label}</text>`
			const chips = rows
				.map(([name, ry]) => {
					order += 1
					const delay = 0.5 + order * 0.2
					return `<g class="a-move" ${from(delay, -300, ghostY(name) - ry)}><rect class="guide-chip${s === 3 ? ' is-other' : ''}" x="330" y="${ry}" width="240" height="28"/><text class="art-file" x="344" y="${ry + 18}">${name}</text><text class="art-tiny" x="556" y="${ry + 18}" text-anchor="end">${String(order).padStart(2, '0')}</text></g>`
				})
				.join('')
			return head + chips
		})
		.join('')
	const left = ghosts
		.map(
			(name, i) =>
				`<rect class="guide-ghost" x="30" y="${92 + i * 44}" width="210" height="28"/><text class="art-file is-ghost" x="44" y="${110 + i * 44}">${name}</text>`,
		)
		.join('')
	return `<svg viewBox="0 0 600 420" data-compact="300 40 290 360" role="img" aria-labelledby="sort-title sort-desc">
  <title id="sort-title">From git's order to a reading order</title>
  <desc id="sort-desc">On the left, six changed files in the order git lists them. On the right, the same files in the order your agent's guide sets: contracts first, then behavior, then the interface. Two files the guide does not mention land in a trailing Other section, so nothing is hidden.</desc>
  ${artFrame('sort', 600, 420)}
  <text class="art-tiny" x="30" y="72">AS GIT LISTS IT</text>
  <text class="art-tiny is-accent" x="330" y="56">AS YOUR AGENT GUIDES IT</text>
  ${left}
  <path class="art-route a-draw" pathLength="1" ${d(0.2)} d="M258 200h52"/>
  <path class="art-signal a-signal" pathLength="100" ${d(2)} d="M258 200h52"/>
  <text class="art-tiny a-fade" ${d(0.3)} x="284" y="190" text-anchor="middle">--guide</text>
  ${right}
</svg>`
}

// Walkthrough: a guide is stamped to the diff it was written for.
export function guideStamp() {
	return `<svg class="is-dense" viewBox="0 0 600 240" data-compact="30 40 550 190" role="img" aria-labelledby="stamp-title stamp-desc">
  <title id="stamp-title">A guide is stamped to its diff</title>
  <desc id="stamp-desc">The guide is attached to the diff it was written for and survives reloads. When a reload moves the diff past it, the desk notes that the grouping may be out of date, and your agent can swap in a new guide with syneva reload --guide.</desc>
  ${artFrame('stamp', 600, 240)}
  <g class="a-rise" ${d(0)}><rect class="art-panel is-white" x="40" y="60" width="150" height="110"/><text class="art-tiny" x="54" y="82">GUIDE.JSON</text><path class="art-lines" d="M54 100h100M54 116h80M54 132h110M54 148h70"/></g>
  <path class="art-route a-draw" pathLength="1" ${d(0.4)} d="M190 115h60"/>
  <g class="a-rise" ${d(0.5)}><rect class="art-panel" x="250" y="60" width="150" height="110"/><text class="art-tiny" x="264" y="82">DIFF · ROUND 1</text><rect class="art-band-yes" x="251" y="96" width="148" height="20"/><text class="art-tiny is-green" x="264" y="110">STAMPED ✓</text><path class="art-lines" d="M264 134h96M264 150h70"/></g>
  <path class="art-route is-dotted a-draw" pathLength="1" ${d(0.9)} d="M400 115h50"/>
  <text class="art-tiny a-fade" ${d(1)} x="425" y="105" text-anchor="middle">RELOAD</text>
  <g class="a-rise" ${d(1.1)}><rect class="art-panel" x="450" y="60" width="120" height="110"/><text class="art-tiny" x="464" y="82">DIFF · ROUND 3</text><rect class="art-band-no" x="451" y="96" width="118" height="34"/><text class="art-tiny is-accent" x="464" y="110">GROUPING MAY</text><text class="art-tiny is-accent" x="464" y="124">BE OUT OF DATE</text><path class="art-lines" d="M464 150h80"/></g>
  <text class="art-code a-fade" ${d(1.5)} x="300" y="210" text-anchor="middle">syneva reload --guide new.json</text>
</svg>`
}

// Ask your agent: one line, two intents.
export function askFork() {
	return `<svg viewBox="0 0 600 440" data-compact="20 24 566 400" role="img" aria-labelledby="fork-title fork-desc">
  <title id="fork-title">One line, two intents</title>
  <desc id="fork-desc">From a changed line, an Ask goes to your agent and its answer comes back into the thread right away. A Request change stays on the line and rides along with your verdict when you Send, as a requestedChanges entry.</desc>
  ${artFrame('fork', 600, 440)}
  <g class="a-rise" ${d(0)}>
    <rect class="art-panel is-white" x="30" y="150" width="270" height="110"/>
    <text class="art-file is-strong" x="44" y="172">api/middleware.ts</text><path class="art-hair" d="M30 182h270"/>
    <text class="art-ln" x="56" y="202" text-anchor="end">18</text><text class="art-code" x="66" y="202">token = readCookie(req)</text>
    <rect class="art-band-add" x="31" y="210" width="268" height="20"/>
    <text class="art-ln" x="56" y="224" text-anchor="end">19</text><text class="art-code is-add" x="66" y="224">+ await verifySession(req)</text>
    <text class="art-ln" x="56" y="248" text-anchor="end">20</text><text class="art-code" x="66" y="248">return next()</text>
  </g>
  <circle class="art-port" cx="300" cy="220" r="3"/>
  <g fill="none">
    <path class="art-route is-accent a-draw" pathLength="1" ${d(0.5)} d="M300 220C340 220 340 96 380 96"/>
    <path class="art-route a-draw" pathLength="1" ${d(0.7)} d="M300 220C340 220 340 300 380 300"/>
    <path class="art-route is-dotted a-draw" pathLength="1" ${d(1.6)} d="M475 330V362"/>
    <path class="art-signal a-signal" pathLength="100" ${d(1.4)} d="M300 220C340 220 340 96 380 96"/>
    <path class="art-signal a-signal" pathLength="100" ${d(2.2)} d="M300 220C340 220 340 300 380 300"/>
  </g>
  <text class="art-tiny is-accent a-fade" ${d(0.8)} x="380" y="34">ASK · ⌘⇧↵ · ANSWERED NOW</text>
  <g class="a-rise" ${d(0.9)}>
    <rect class="ask-thread" x="380" y="44" width="190" height="112"/><path class="ask-rail" d="M380 44v112"/>
    <text class="art-tiny" x="394" y="64">YOU</text><text class="art-copy" x="394" y="82">Why verify here?</text>
    <text class="art-tiny is-accent" x="394" y="108">YOUR AGENT</text><text class="art-small" x="394" y="126">So an expired session</text><text class="art-small" x="394" y="142">returns 401 first.</text>
  </g>
  <text class="art-tiny a-fade" ${d(1)} x="380" y="262">REQUEST CHANGE · ⌘↵</text>
  <g class="a-rise" ${d(1.1)}>
    <rect class="ask-change" x="380" y="272" width="190" height="58"/><path class="ask-change-rail" d="M380 272v58"/>
    <text class="art-small" x="394" y="296">Log why the session</text><text class="art-small" x="394" y="313">was rejected.</text>
  </g>
  <text class="art-tiny a-fade" ${d(1.7)} x="486" y="350">RIDES WITH SEND</text><g class="a-rise" ${d(1.8)}><rect class="art-kbd" x="380" y="362" width="190" height="40"/><text class="art-code" x="394" y="380">"requestedChanges": [</text><text class="art-code" x="394" y="395">  { "lineNumber": 20 … } ]</text></g>
  <g class="a-fade is-secondary" ${d(0.3)}><text class="art-tiny" x="30" y="300">ON A LINE · c</text><text class="art-tiny" x="30" y="318">ON A WHOLE FILE · ⇧C</text><text class="art-tiny" x="30" y="336">RESOLVE A THREAD · r</text></g>
</svg>`
}

// Ask your agent: who talks to whom, in order.
export function askSequence() {
	const lanes = [
		['YOU', 90],
		['YOUR DESK', 300],
		['YOUR AGENT', 510],
	]
	const steps = [
		[90, 300, 84, 'Ask on line 19', 'accent'],
		[300, 510, 124, 'question event', 'accent'],
		[510, 300, 164, 'syneva status “reading…”', 'muted'],
		[510, 300, 204, 'syneva comment (the answer)', 'accent'],
		[300, 90, 244, 'Answer in your thread', 'green'],
	]
	const arrows = steps
		.map(([x1, x2, y, label, tone], i) => {
			const dir = x2 > x1 ? -1 : 1
			const delay = 0.5 + i * 0.4
			return `<path class="seq-line is-${tone} a-draw" pathLength="1" ${d(delay)} d="M${x1} ${y}H${x2 + dir * 4}"/><path class="seq-head is-${tone} a-pop" ${d(delay + 0.3)} d="M${x2} ${y}l${dir * 7}-4v8Z"/><text class="art-small a-fade" ${d(delay + 0.2)} x="${(x1 + x2) / 2}" y="${y - 8}" text-anchor="middle">${label}</text>`
		})
		.join('')
	return `<svg viewBox="0 0 600 320" data-compact="40 10 520 300" role="img" aria-labelledby="seq-title seq-desc">
  <title id="seq-title">A question, in order</title>
  <desc id="seq-desc">You ask on a line. The desk hands the question to your agent as an event. Your agent posts a live status while it reads, then posts its answer with syneva comment, and the answer appears in your thread on that line.</desc>
  ${artFrame('seq', 600, 320)}
  ${lanes.map(([name, x]) => `<rect class="seq-lane" x="${x - 56}" y="30" width="112" height="24"/><text class="art-tiny" x="${x}" y="46" text-anchor="middle">${name}</text><path class="seq-rule" d="M${x} 54V292"/>`).join('')}
  ${arrows}
  <text class="art-tiny a-fade" ${d(2.8)} x="300" y="290" text-anchor="middle">READ-ONLY · NO FILE IS EDITED TO ANSWER</text>
</svg>`
}

// Plan desk (prototype): a plan becomes a queue of claims ranked by risk.
export function planQueue() {
	const claims = [
		['Sessions move to middleware', 3, 'Needs proof', 'risk'],
		['Routes never cache users', 2, 'Ask the agent', 'question'],
		['Expired sessions return 401', 1, 'Settled', 'yes'],
		['No schema change is required', 1, 'Settled', 'yes'],
	]
	const rows = claims
		.map(([text, risk, state, kind], i) => {
			const y = 96 + i * 72
			const meter = [0, 1, 2]
				.map(
					k =>
						`<rect class="risk-cell${k < risk ? (risk === 3 ? ' is-high' : risk === 2 ? ' is-mid' : ' is-low') : ''}" x="${528 + k * 12}" y="${y + 14}" width="9" height="9"/>`,
				)
				.join('')
			return `<g class="a-rise" ${d(0.8 + i * 0.18)}><rect class="plan-claim${kind === 'risk' ? ' is-risk' : kind === 'yes' ? ' is-settled' : ''}" x="290" y="${y}" width="282" height="56"/><text class="art-tiny is-accent" x="304" y="${y + 21}">${String(i + 1).padStart(2, '0')}</text><text class="art-copy" x="326" y="${y + 22}">${text}</text><text class="art-small" x="326" y="${y + 41}">${state}</text>${meter}</g>`
		})
		.join('')
	return `<svg viewBox="0 0 600 420" data-compact="270 30 320 380" role="img" aria-labelledby="queue-title queue-desc">
  <title id="queue-title">A plan as a queue of claims</title>
  <desc id="queue-desc">Prototype concept. Sentences highlighted in a plan become claims, ranked by risk: an assumption that needs proof first, then a question for the agent, then claims already settled.</desc>
  ${artFrame('queue', 600, 420)}
  <g class="a-rise" ${d(0)}>
    <rect class="art-panel is-white" x="30" y="70" width="210" height="300"/>
    <text class="art-label" x="30" y="56">plan.md</text>
    <path class="art-lines" d="M48 96h150M48 112h120M48 168h160M48 184h90M48 240h140M48 256h170M48 312h110M48 328h150"/>
    <rect class="plan-highlight a-sweep" ${d(0.4)} x="44" y="128" width="170" height="20"/>
    <rect class="queue-mark a-sweep" ${d(0.5)} x="44" y="200" width="150" height="20"/>
    <rect class="art-band-yes a-sweep" ${d(0.6)} x="44" y="272" width="166" height="20"/>
  </g>
  <g fill="none">
    <path class="art-route is-accent a-draw" pathLength="1" ${d(0.8)} d="M214 138C252 138 252 124 290 124"/>
    <path class="art-route a-draw" pathLength="1" ${d(0.95)} d="M194 210C242 210 242 196 290 196"/>
    <path class="art-route is-green a-draw" pathLength="1" ${d(1.1)} d="M210 282C250 282 250 268 290 268"/>
  </g>
  <text class="art-tiny is-accent" x="290" y="76">RANKED BY RISK</text>
  <g class="a-pop" ${d(1.6)}><rect class="proto-tag" x="476" y="34" width="96" height="20"/><text class="art-tiny is-accent" x="524" y="48" text-anchor="middle">PROTOTYPE</text></g>
  ${rows}
</svg>`
}

// Plan desk: what already works today, with syneva file.
export function planToday() {
	return `<svg viewBox="0 0 600 330" data-compact="20 20 566 300" role="img" aria-labelledby="today-title today-desc">
  <title id="today-title">Reviewing a plan today, with syneva file</title>
  <desc id="today-desc">Today the CLI opens a plan as a single file. Markdown renders with a Rendered and Source toggle, and you can comment on any rendered block; your agent answers in the thread.</desc>
  ${artFrame('today', 600, 330)}
  <g class="a-rise" ${d(0)}>
    <rect class="art-panel is-white" x="40" y="40" width="520" height="260"/>
    <text class="art-file is-strong" x="56" y="64">plan.md</text>
    <rect class="art-kbd" x="400" y="50" width="70" height="20"/><text class="art-tiny" x="435" y="64" text-anchor="middle">RENDERED</text>
    <rect class="art-panel" x="470" y="50" width="76" height="20"/><text class="art-tiny" x="508" y="64" text-anchor="middle">SOURCE · m</text>
    <path class="art-hair" d="M40 80h520"/>
    <text class="art-head" x="56" y="112">Move session checks into middleware</text>
    <path class="art-lines" d="M56 136h380M56 152h320"/>
    <rect class="art-band-focus" x="48" y="166" width="300" height="48"/>
    <path class="art-lines" d="M56 182h280M56 198h240"/>
    <path class="art-lines" d="M56 236h360M56 252h300M56 268h200"/>
  </g>
  <path class="ask-anchor a-draw" pathLength="1" ${d(0.6)} d="M348 190h34"/>
  <g class="a-rise" ${d(0.8)}>
    <rect class="ask-thread" x="382" y="150" width="166" height="88"/><path class="ask-rail" d="M382 150v88"/>
    <text class="art-tiny" x="394" y="170">YOU · ASK</text><text class="art-small" x="394" y="188">What happens when</text><text class="art-small" x="394" y="204">the session expires?</text>
    <text class="art-tiny is-accent" x="394" y="226">AGENT IS ANSWERING…</text>
  </g>
  <text class="art-code a-fade" ${d(1.2)} x="56" y="322">$ syneva file plan.md</text>
</svg>`
}
