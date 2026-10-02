// The hero instrument: one review round, drawn as a technical figure.
// Your agent's files arrive scattered, settle into a reading order, one change
// opens on the desk, you ask, the agent answers, you accept, every file gets a
// verdict, Send hands it back and only the rejected file comes back pending.
//
// The markup IS the static pose (round 1, decided and ready to send): without
// JS or with reduced motion the figure still tells the whole story. hero.js
// adds the timeline with the Web Animations API, one 16s clock for everything.

const files = [
	['01', 'contracts/review.ts'],
	['02', 'auth/session.ts'],
	['03', 'pages/desk.tsx'],
]

// Code bars per card: [kind, width]; kind marks the gutter: + added, − removed.
const bars = [
	[
		['add', 96],
		['add', 128],
		['ctx', 70],
	],
	[
		['del', 84],
		['add', 120],
		['add', 92],
	],
	[
		['ctx', 110],
		['add', 76],
		['del', 120],
	],
]

function card([index, name], i) {
	const y = 72 + i * 98
	const rows = bars[i]
		.map(
			([kind, width], r) =>
				`<rect class="hs-mark hs-${kind}" x="12" y="${42 + r * 12}" width="4" height="4"/><rect class="hs-bar${kind === 'ctx' ? ' is-faint' : ''}" data-bar="${i}" x="22" y="${42 + r * 12}" width="${width}" height="4"/>`,
		)
		.join('')
	return `<g transform="translate(30 ${y})"><g class="hs-card" data-card="${i}">
        <rect class="hs-sheet" width="172" height="84"/>
        <text class="hs-idx" x="12" y="20">${index}</text><text class="hs-file" x="34" y="20">${name}</text>
        <path class="hs-hair" d="M0 30h172"/>${rows}
      </g></g>`
}

const ledger = [
	['contracts/review.ts', 'yes'],
	['auth/session.ts', 'yes'],
	['api/middleware.ts', 'yes'],
	['pages/desk.tsx', 'no'],
	['lib/hash.ts', 'yes'],
	['README.md', 'yes'],
]

function glyph(kind, x, y) {
	if (kind === 'yes')
		return `<rect class="hs-glyph-yes" x="${x - 7}" y="${y - 7}" width="14" height="14"/><path class="hs-glyph-check" d="m${x - 3.5} ${y}l2.5 2.6 4.6-5.2"/>`
	if (kind === 'no')
		return `<rect class="hs-glyph-no" x="${x - 7}" y="${y - 7}" width="14" height="14"/><path class="hs-glyph-x" d="m${x - 3} ${y - 3} 6 6m0-6-6 6"/>`
	return `<rect class="hs-glyph-pending" x="${x - 7}" y="${y - 7}" width="14" height="14"/>`
}

function ledgerRows() {
	return ledger
		.map(([name, verdict], i) => {
			const top = 72 + i * 34
			const rule = i ? `<path class="hs-hair" d="M562 ${top}h178"/>` : ''
			const pending =
				verdict === 'no'
					? `<g class="hs-row-pending" opacity="0">${glyph('pending', 722, top + 17)}</g>`
					: ''
			// Every row starts pending; the verdict lands on top of it.
			return `${rule}<text class="hs-file" x="574" y="${top + 21}">${name}</text>${glyph('pending', 722, top + 17)}<g class="hs-verdict" data-row="${i}">${glyph(verdict, 722, top + 17)}</g>${pending}`
		})
		.join('')
}

export function heroStage() {
	return `<svg class="hs" viewBox="0 0 760 440" data-compact="224 22 316 342" role="img" aria-labelledby="hs-title hs-desc">
  <title id="hs-title">One review round, from your agent's diff to your verdict</title>
  <desc id="hs-desc">Your agent's six changed files settle into a reading order. One change opens on your local desk: you ask why the session is checked there, your agent answers on that line, and you accept it. Every file gets your verdict, one is rejected, and Send hands the result back. The agent revises, and only the rejected file returns as pending. Illustrative, not a screenshot.</desc>
  <defs><pattern id="hs-grid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="var(--grid)"/></pattern></defs>
  <g class="hs-stage">
    <rect width="760" height="440" fill="url(#hs-grid)"/>
    <path class="art-register" d="M8 20V8h12M740 8h12v12M8 420v12h12M740 432h12v-12" fill="none"/>
    <g class="hs-routes" fill="none">
      <path class="hs-route" d="M202 212C219 212 219 170 236 170"/>
      <path class="hs-route" d="M528 88C545 88 545 123 562 123"/>
      <path class="hs-return" d="M651 352V388q0 12-12 12H128q-12 0-12-12V352"/>
      <path class="hs-signal hs-signal-in" pathLength="100" d="M202 212C219 212 219 170 236 170"/>
      <path class="hs-signal hs-signal-out" pathLength="100" d="M528 88C545 88 545 123 562 123"/>
      <path class="hs-signal hs-signal-back" pathLength="100" d="M651 352V388q0 12-12 12H128q-12 0-12-12V352"/>
    </g>
    <text class="hs-loop" x="384" y="424" text-anchor="middle">SAME TAB · NEXT ROUND</text>

    <g class="hs-layer hs-agent">
      <text class="hs-kicker" x="30" y="40">YOUR AGENT</text>
      <text class="hs-sub" x="30" y="58">wrote 6 files · +214 −37</text>
      <path class="hs-rail" pathLength="1" d="M18 92V288"/>
      <g class="hs-rail-dots"><rect x="15" y="89" width="6" height="6"/><rect x="15" y="187" width="6" height="6"/><rect x="15" y="285" width="6" height="6"/></g>
      ${files.map(card).join('')}
      <g class="hs-rev" opacity="0"><rect x="156" y="277" width="40" height="15"/><text x="176" y="287.8" text-anchor="middle">REV 2</text></g>
      <text class="hs-sub hs-more" x="202" y="374" text-anchor="end">+3 more files</text>
      <path class="hs-focus" d="M22 176v-14h14M196 162h14v14M22 248v14h14M196 262h14v-14" fill="none"/>
      <circle class="hs-port" cx="202" cy="212" r="2.5"/>
      <circle class="hs-port" cx="116" cy="352" r="2.5"/>
    </g>

    <g class="hs-layer hs-desk">
      <text class="hs-kicker" x="236" y="40">YOUR DESK</text>
      <text class="hs-sub hs-mono" x="236" y="58">localhost:41873</text>
      <rect class="hs-panel" x="236" y="72" width="292" height="280"/>
      <g class="hs-idle" opacity="0"><text class="hs-tiny" x="382" y="215" text-anchor="middle">WAITING FOR YOUR AGENT’S DIFF</text><rect class="hs-caret" x="379" y="225" width="6" height="11"/></g>
      <g class="hs-head"><text class="hs-file is-strong" x="250" y="93">auth/session.ts</text><text class="hs-sub hs-mono" x="354" y="93">+2 −1</text>
      <g class="hs-btn-reject"><rect class="hs-btn" x="460" y="80" width="28" height="16"/><path class="hs-btn-glyph" d="m471 85 6 6m0-6-6 6"/></g>
      <g class="hs-btn-accept"><rect class="hs-btn hs-accept" x="492" y="80" width="28" height="16"/><path class="hs-btn-glyph hs-accept-glyph" d="m502 88 2.6 2.6 5-5.6"/></g></g>
      <path class="hs-hair" d="M236 104h292"/>
      <rect class="hs-band-del" x="237" y="134" width="290" height="24"/>
      <rect class="hs-band-add" x="237" y="158" width="290" height="48"/>
      <rect class="hs-sweep" x="237" y="110" width="290" height="24" opacity="0"/>
      <g class="hs-row"><text class="hs-ln" x="262" y="126" text-anchor="end">12</text><text class="hs-code" x="284" y="126">export function handle(req) {</text></g>
      <g class="hs-row"><text class="hs-ln" x="262" y="150" text-anchor="end">13</text><text class="hs-sign is-del" x="270" y="150">−</text><text class="hs-code is-del" x="298" y="150">return run(req)</text><path class="hs-strike" d="M298 146h104"/></g>
      <g class="hs-row"><text class="hs-ln" x="262" y="174" text-anchor="end">14</text><text class="hs-sign is-add" x="270" y="174">+</text><text class="hs-code is-add" x="298" y="174">await verifySession(req)</text></g>
      <g class="hs-row"><text class="hs-ln" x="262" y="198" text-anchor="end">15</text><text class="hs-sign is-add" x="270" y="198">+</text><text class="hs-code is-add" x="298" y="198">return run(req)</text></g>
      <g class="hs-row"><text class="hs-ln" x="262" y="222" text-anchor="end">16</text><text class="hs-code" x="284" y="222">}</text></g>
      <path class="hs-gcheck" pathLength="1" d="m241 171 3 3 5.5-6.5"/>
      <path class="hs-gcheck" pathLength="1" d="m241 195 3 3 5.5-6.5"/>
      <path class="hs-leader" pathLength="1" d="M510 179V244"/>
      <g class="hs-qchip"><circle cx="510" cy="170" r="9"/><text x="510" y="174" text-anchor="middle">?</text></g>
      <g class="hs-thread">
        <rect class="hs-thread-box" x="250" y="244" width="264" height="94"/>
        <path class="hs-thread-rail" d="M250 244v94"/>
        <g class="hs-msg-you"><text class="hs-who" x="264" y="264">YOU · ASK</text><text class="hs-msg" x="264" y="281">What if the session already expired?</text></g>
        <g class="hs-typing" opacity="0"><circle cx="266" cy="318" r="2"/><circle cx="274" cy="318" r="2"/><circle cx="282" cy="318" r="2"/></g>
        <g class="hs-msg-agent"><text class="hs-who" x="264" y="304">YOUR AGENT</text><text class="hs-msg" x="264" y="321">It returns 401 before the handler runs.</text></g>
      </g>
      <circle class="hs-port" cx="236" cy="170" r="2.5"/>
      <circle class="hs-port" cx="528" cy="88" r="2.5"/>
    </g>

    <g class="hs-layer hs-ledger">
      <text class="hs-kicker" x="562" y="40">YOUR VERDICT</text>
      <text class="hs-sub hs-round-1" x="562" y="58">Round 1 · decided by you</text>
      <text class="hs-sub hs-round-2" x="562" y="58" opacity="0">Round 2 · one file to re-read</text>
      <rect class="hs-ledger-box" x="562" y="72" width="178" height="244"/>
      ${ledgerRows()}
      <path class="hs-hair" d="M562 276h178"/>
      <rect class="hs-track" x="574" y="290" width="154" height="3"/>
      <rect class="hs-fill" x="574" y="290" width="154" height="3"/>
      <text class="hs-tiny hs-progress-1" x="574" y="307">6/6 DECIDED BY YOU</text><text class="hs-tiny hs-progress-2" x="574" y="307" opacity="0">5/6 · 1 BACK TO PENDING</text>
      <g class="hs-send"><rect class="hs-send-box" x="562" y="324" width="178" height="28"/><text class="hs-send-label" x="576" y="342.5">Send to agent</text><text class="hs-send-sent" x="576" y="342.5" opacity="0">Sent · agent revising</text><text class="hs-send-kbd" x="728" y="342" text-anchor="end">⇧S</text></g>
      <circle class="hs-port" cx="562" cy="123" r="2.5"/>
      <circle class="hs-port" cx="651" cy="352" r="2.5"/>
    </g>

    <path class="hs-cursor" d="M0 0v15.5l4.2-4 3.1 6.9 3-1.4-3-6.7h6Z" opacity="0"/>
  </g>
</svg>`
}
