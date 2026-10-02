// Home page drawings. Shared vocabulary (see motion.css): .a-draw strokes
// draw on, .a-fade/.a-rise/.a-pop/.a-sweep enter, --d staggers them, and
// .a-signal / .a-pulse keep a scene quietly alive once it has arrived. The
// markup is always the finished pose, so reduced motion loses nothing.
import { artFrame } from '../ui.mjs'

const d = seconds => `style="--d:${seconds}s"`

// The problem, as a conceptual chart: output climbs, attention does not.
export function gapChart() {
	return `<svg viewBox="0 0 560 380" data-compact="36 22 500 330" role="img" aria-labelledby="gap-art-title gap-art-desc">
  <title id="gap-art-title">The review gap</title>
  <desc id="gap-art-desc">A conceptual drawing with no data. The code your agent writes climbs steeply through a session while the code you can read with real attention rises slowly; the space between them is the review gap. A stepped green line shows review rounds settling the work as it arrives.</desc>
  ${artFrame('gap', 560, 380)}
  <defs><pattern id="gap-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v7" stroke="var(--signal)" stroke-width="1.2" opacity=".42"/></pattern></defs>
  <path class="art-axis a-draw" pathLength="1" ${d(0)} d="M56 44V316H520"/>
  <text class="art-label a-fade" ${d(0.2)} x="64" y="40">LINES IN THE DIFF</text>
  <text class="art-label a-fade" ${d(0.2)} x="520" y="340" text-anchor="end">ONE AGENT SESSION →</text>
  <path class="gap-area a-fade" ${d(1.1)} d="M56 312C190 306 300 232 512 64L512 270C330 286 200 304 56 312Z" fill="url(#gap-hatch)"/>
  <path class="gap-written a-draw" pathLength="1" ${d(0.3)} d="M56 312C190 306 300 232 512 64"/>
  <path class="gap-written-signal a-signal" pathLength="100" ${d(2.6)} d="M56 312C190 306 300 232 512 64"/>
  <path class="gap-read a-draw" pathLength="1" ${d(0.6)} d="M56 312C200 304 330 286 512 270"/>
  <g class="a-pop" ${d(1.5)}><rect class="gap-tag" x="372" y="204" width="118" height="22"/><text class="art-label is-accent" x="431" y="219" text-anchor="middle">THE REVIEW GAP</text></g>
  <text class="art-copy is-accent a-fade" ${d(1)} x="504" y="52" text-anchor="end">Written by your agent</text>
  <text class="art-small a-fade" ${d(1.2)} x="512" y="292" text-anchor="end">Read with real attention</text>
  <path class="gap-steps a-draw" pathLength="1" ${d(1.9)} d="M56 312H174V292H255V253H345V195H423V137H506V72"/>
  <g class="gap-rounds">
    <rect class="a-pop" ${d(2.2)} x="171" y="289" width="6" height="6"/>
    <rect class="a-pop" ${d(2.45)} x="252" y="250" width="6" height="6"/>
    <rect class="a-pop" ${d(2.7)} x="342" y="192" width="6" height="6"/>
    <rect class="a-pop" ${d(2.95)} x="420" y="134" width="6" height="6"/>
    <rect class="a-pop" ${d(3.2)} x="503" y="69" width="6" height="6"/>
  </g>
  <g class="a-rise" ${d(2.4)}><text class="art-copy is-green" x="76" y="232">Settled on a desk,</text><text class="art-copy is-green" x="76" y="250">round by round</text><path class="gap-pointer" d="M148 258l22 26"/></g>
</svg>`
}

// Chapter: the review desk - a reading order on the left, verdicts on the right.
export function deskFigure() {
	const side = [
		['CONTRACTS', 118],
		['BEHAVIOR', 186],
		['INTERFACE', 276],
		['OTHER', 344],
	]
	const rows = [
		['contracts/review.ts', 144, 'yes', 0.3],
		['auth/session.ts', 212, 'current', 0],
		['api/middleware.ts', 240, 'pending', 0],
		['pages/desk.tsx', 302, 'pending', 0],
		['README.md', 370, 'pending', 0],
	]
	return `<svg viewBox="0 0 520 520" data-compact="206 56 288 408" role="img" aria-labelledby="desk-art-title desk-art-desc">
  <title id="desk-art-title">A reading order and a verdict on every change</title>
  <desc id="desk-art-desc">On the left, your agent's walkthrough groups files into contracts, behavior, interface and a trailing Other section, so nothing is hidden. On the right, the open file's first change is kept, the second is undone, and the third waits for your verdict. Illustrative, not a screenshot.</desc>
  ${artFrame('desk', 520, 520)}
  <g class="a-rise" ${d(0)}>
    <rect class="art-panel" x="34" y="64" width="166" height="392"/>
    <text class="art-label" x="48" y="90">WALKTHROUGH</text>
    <path class="art-hair" d="M34 102h166"/>
    ${side.map(([label, y]) => `<text class="art-tiny is-accent" x="48" y="${y}">${label}</text>`).join('')}
    ${rows
			.map(
				([name, y, state]) =>
					`<text class="art-file${state === 'current' ? ' is-strong' : ''}" x="48" y="${y}">${name}</text>${
						state === 'yes'
							? `<g class="a-pop" ${d(0.5)}><rect class="art-yes" x="180" y="${y - 9}" width="11" height="11"/><path class="art-check" d="m182.8 ${y - 3.6} 2 2 3.6-4"/></g>`
							: `<rect class="art-pending" x="180" y="${y - 9}" width="11" height="11"/>`
					}`,
			)
			.join('')}
    <rect class="desk-cursor a-sweep" ${d(0.4)} x="38" y="198" width="158" height="22"/>
    <path class="art-hair" d="M34 414h166"/>
    <rect class="art-track" x="48" y="428" width="138" height="3"/><rect class="art-fill desk-progress" x="48" y="428" width="56" height="3"/>
    <text class="art-tiny" x="48" y="446">2 OF 5 SETTLED</text>
  </g>
  <g class="a-rise" ${d(0.2)}>
    <rect class="art-panel is-white" x="214" y="64" width="272" height="392"/>
    <text class="art-file is-strong" x="228" y="90">auth/session.ts</text><text class="art-tiny" x="472" y="90" text-anchor="end">3 CHANGES</text>
    <path class="art-hair" d="M214 102h272"/>
    <text class="art-tiny" x="228" y="124">@@ 12 · VERIFY THE SESSION</text>
    <rect class="art-band-yes a-sweep" ${d(0.9)} x="215" y="150" width="270" height="44"/>
    <text class="art-code" x="228" y="146">export function handle(req) {</text>
    <text class="art-code is-add" x="228" y="168">+  await verifySession(req)</text>
    <text class="art-code is-add" x="228" y="188">+  return run(req)</text>
    <g class="a-pop" ${d(1.3)}><rect class="art-chip-yes" x="384" y="111" width="88" height="19"/><text class="art-tiny is-green" x="428" y="124.5" text-anchor="middle">✓ KEPT · ⇧Y</text></g>
    <path class="art-hair" d="M214 212h272"/>
    <text class="art-tiny" x="228" y="234">@@ 41 · CACHE THE USER</text>
    <rect class="art-band-no a-sweep" ${d(1.7)} x="215" y="244" width="270" height="22"/>
    <text class="art-code is-del" x="228" y="260">+  cache.set(token, user)</text>
    <path class="art-strike a-draw" pathLength="1" ${d(2)} d="M246 256h158"/>
    <text class="art-code" x="228" y="282">   return user</text>
    <g class="a-pop" ${d(2.1)}><rect class="art-chip-no" x="372" y="221" width="100" height="19"/><text class="art-tiny is-accent" x="422" y="234.5" text-anchor="middle">✕ UNDONE · ⇧N</text></g>
    <path class="art-hair" d="M214 300h272"/>
    <text class="art-tiny" x="228" y="322">@@ 60 · LOG THE SESSION</text>
    <rect class="desk-next a-pulse" x="220" y="330" width="260" height="26"/>
    <text class="art-code is-add" x="228" y="348">+  log.debug(session.id)</text>
    <g class="a-fade" ${d(2.5)}><rect class="art-kbd" x="228" y="378" width="16" height="16"/><text class="art-tiny" x="236" y="390" text-anchor="middle">j</text><text class="art-small" x="252" y="390">next change, waiting for you</text></g>
    <path class="art-hair" d="M214 414h272"/>
    <text class="art-tiny" x="228" y="439">NOTHING IS AUTO-APPROVED</text>
  </g>
</svg>`
}

// Chapter: asking on the exact line, with the agent answering in place.
export function askFigure() {
	return `<svg viewBox="0 0 520 520" data-compact="34 50 452 420" role="img" aria-labelledby="ask-art-title ask-art-desc">
  <title id="ask-art-title">A question anchored to the changed line</title>
  <desc id="ask-art-desc">On line 19 of api/middleware.ts you ask why the session is verified there. While your agent reads, its status shows beside the thread; then its answer lands on the same line. A second comment on line 20 is a change request that rides along with your verdict. Illustrative, not a screenshot.</desc>
  ${artFrame('ask', 520, 520)}
  <g class="a-rise" ${d(0)}>
    <rect class="art-panel is-white" x="40" y="58" width="440" height="404"/>
    <text class="art-file is-strong" x="56" y="84">api/middleware.ts</text>
    <path class="art-hair" d="M40 98h440"/>
    <text class="art-ln" x="72" y="124" text-anchor="end">18</text><text class="art-code" x="88" y="124">const token = readCookie(req)</text>
    <rect class="art-band-add" x="41" y="134" width="438" height="24"/>
    <text class="art-ln" x="72" y="151" text-anchor="end">19</text><text class="art-code is-add" x="88" y="151">+ await verifySession(req)</text>
  </g>
  <path class="ask-anchor a-draw" pathLength="1" ${d(0.5)} d="M56 158v18"/>
  <g class="a-rise" ${d(0.6)}>
    <rect class="ask-thread" x="56" y="176" width="408" height="142"/>
    <path class="ask-rail" d="M56 176v142"/>
    <g class="ask-tabs"><rect class="ask-tab is-on" x="72" y="190" width="40" height="18"/><text class="art-tiny is-white" x="92" y="203" text-anchor="middle">ASK</text><rect class="ask-tab" x="116" y="190" width="110" height="18"/><text class="art-tiny" x="171" y="203" text-anchor="middle">REQUEST CHANGE</text><text class="art-tiny" x="448" y="203" text-anchor="end">⌘⇧↵</text></g>
    <text class="art-tiny" x="72" y="230">YOU</text>
    <text class="art-copy a-type" ${d(0.9)} x="72" y="248">Why verify the session here and not in the router?</text>
    <g class="a-fade" ${d(1.7)}><circle class="ask-spin a-spin" cx="76" cy="270" r="4"/><text class="art-small" x="88" y="274">Agent · reading auth/session.ts…</text></g>
    <text class="art-tiny is-accent a-fade" ${d(2.4)} x="72" y="290">YOUR AGENT</text>
    <text class="art-copy a-type" ${d(2.5)} x="72" y="308">So an expired session returns 401 before any handler.</text>
  </g>
  <g class="a-rise" ${d(0.1)}>
    <text class="art-ln" x="72" y="346" text-anchor="end">20</text><text class="art-code" x="88" y="346">return next()</text>
  </g>
  <g class="a-rise" ${d(3.2)}>
    <rect class="ask-change" x="56" y="360" width="408" height="58"/>
    <path class="ask-change-rail" d="M56 360v58"/>
    <text class="art-tiny is-accent" x="72" y="381">REQUEST CHANGE</text>
    <text class="art-copy" x="72" y="402">Log why the session was rejected.</text>
    <text class="art-tiny" x="448" y="381" text-anchor="end">RIDES TO THE HANDOFF →</text>
  </g>
  <text class="art-tiny a-fade" ${d(3.6)} x="56" y="444">THE ANSWER LIVES ON THE LINE IT EXPLAINS</text>
</svg>`
}

// Chapter: the plan desk prototype - a plan becomes a map of decisions.
export function planFigure() {
	return `<svg viewBox="0 0 520 520" data-compact="44 60 456 440" role="img" aria-labelledby="plan-art-title plan-art-desc">
  <title id="plan-art-title">A plan becomes a map of decisions</title>
  <desc id="plan-art-desc">A plan document routes into three claims: an assumption that needs proof, a question for the agent, and a decision that is understood. Illustrative prototype concept.</desc>
  ${artFrame('plan', 520, 520)}
  <g class="a-rise" ${d(0)}>
    <path d="M64 100h-8v-8h8M212 92h8v8" class="art-ink-line"/>
    <rect class="art-panel is-white" x="64" y="100" width="156" height="212"/>
    <rect class="plan-highlight a-sweep" ${d(0.6)} x="80" y="150" width="124" height="24"/>
    <path class="art-lines" d="M84 128h96m-96 34h92m-92 32h104m-104 30h80m-80 28h58m-58 26h88"/>
    <text class="art-label" x="64" y="82">plan.md</text>
  </g>
  <g fill="none" class="plan-bus">
    <path class="a-draw" pathLength="1" ${d(0.8)} d="M220 162h30"/>
    <path class="a-draw" pathLength="1" ${d(1)} d="M250 150v240"/>
    <path class="a-draw" pathLength="1" ${d(1.3)} d="M250 150h36"/>
    <path class="a-draw" pathLength="1" ${d(1.5)} d="M250 270h36"/>
    <path class="a-draw" pathLength="1" ${d(1.7)} d="M250 390h36"/>
    <path class="plan-signal a-signal" pathLength="100" ${d(2.6)} d="M220 162h30v228h36"/>
  </g>
  <g class="plan-dots"><rect class="a-pop" ${d(0.9)} x="247" y="159" width="6" height="6"/><rect class="a-pop" ${d(1.3)} x="247" y="147" width="6" height="6"/><rect class="a-pop" ${d(1.5)} x="247" y="267" width="6" height="6"/><rect class="a-pop" ${d(1.7)} x="247" y="387" width="6" height="6"/></g>
  <g class="a-rise" ${d(1.4)}><rect class="plan-claim is-risk" x="286" y="122" width="200" height="56"/><text class="art-copy" x="304" y="146">An assumption</text><text class="art-small" x="304" y="165">Needs proof before code</text><rect class="plan-flag a-pulse" x="462" y="144" width="10" height="10"/></g>
  <g class="a-rise" ${d(1.6)}><rect class="plan-claim" x="286" y="242" width="200" height="56"/><text class="art-copy" x="304" y="266">A question</text><text class="art-small" x="304" y="285">Ask the agent on the line</text><text class="art-copy is-accent" x="467" y="275" text-anchor="middle">?</text></g>
  <g class="a-rise" ${d(1.8)}><rect class="plan-claim is-settled" x="286" y="362" width="200" height="56"/><text class="art-copy" x="304" y="386">A decision</text><text class="art-small" x="304" y="405">Understood and settled</text><path class="art-check a-draw" pathLength="1" ${d(2.3)} d="m461 390 4 4 8-9"/></g>
  <text class="art-label a-fade" ${d(2)} x="28" y="487">LESS READING BLIND. MORE DECIDING.</text>
</svg>`
}

// Local section: everything runs inside your machine's boundary.
export function localFigure() {
	return `<svg viewBox="0 0 520 340" data-compact="12 14 500 318" role="img" aria-labelledby="local-art-title local-art-desc">
  <title id="local-art-title">Everything stays inside your machine</title>
  <desc id="local-art-desc">Your agent, the review desk on localhost and your repository sit inside your machine, talking over loopback and git. The line to the internet is cut: no model call, no telemetry, no account.</desc>
  <path class="local-boundary a-draw" pathLength="1" ${d(0)} d="M20 40h380v280H20Z"/>
  <text class="art-label a-fade" ${d(0.3)} x="34" y="30">YOUR MACHINE</text>
  <g class="a-rise" ${d(0.3)}><rect class="art-panel is-white" x="44" y="74" width="132" height="76"/><text class="art-tiny" x="56" y="94">YOUR AGENT</text><text class="art-code" x="56" y="122">$ syneva await</text><rect class="local-caret a-blink" x="162" y="112" width="6" height="12"/></g>
  <g class="a-rise" ${d(0.45)}><rect class="art-panel is-white" x="244" y="74" width="140" height="76"/><path class="art-hair" d="M244 92h140"/><rect class="art-dot" x="252" y="80" width="5" height="5"/><text class="art-tiny" x="262" y="86">localhost:41873</text><text class="art-small" x="256" y="116">Your desk</text><rect class="art-yes" x="256" y="126" width="11" height="11"/><path class="art-check" d="m258.8 131.4 2 2 3.6-4"/><text class="art-tiny" x="272" y="136">3 KEPT · 1 UNDONE</text></g>
  <g class="a-rise" ${d(0.6)}><rect class="art-panel" x="144" y="222" width="132" height="70"/><text class="art-tiny" x="156" y="242">YOUR REPOSITORY</text><text class="art-code" x="156" y="270">git diff</text></g>
  <g fill="none" class="local-links">
    <path class="art-route a-draw" pathLength="1" ${d(0.8)} d="M176 112h68"/>
    <path class="art-route a-draw" pathLength="1" ${d(0.9)} d="M310 150v36q0 10-10 10h-14q-10 0-10 10v16"/>
    <path class="art-route a-draw" pathLength="1" ${d(1)} d="M110 150v36q0 10 10 10h14q10 0 10 10v16"/>
    <path class="local-signal a-signal" pathLength="100" ${d(1.6)} d="M176 112h68"/>
    <path class="local-signal is-green a-signal" pathLength="100" ${d(2.4)} d="M310 150v36q0 10-10 10h-14q-10 0-10 10v16"/>
  </g>
  <text class="art-tiny a-fade" ${d(1.1)} x="210" y="104" text-anchor="middle">LOOPBACK</text>
  <path class="local-out a-draw" pathLength="1" ${d(1.3)} d="M400 180h48"/>
  <g class="a-pop" ${d(1.8)}><rect class="local-cut" x="416" y="172" width="16" height="16"/><path class="local-cut-x" d="m420 176 8 8m0-8-8 8"/></g>
  <g class="a-fade" ${d(1.5)}><rect class="local-cloud" x="448" y="152" width="56" height="56"/><text class="art-tiny" x="476" y="184" text-anchor="middle">CLOUD</text></g>
  <text class="art-tiny a-fade" ${d(2)} x="476" y="232" text-anchor="middle">NO MODEL</text>
  <text class="art-tiny a-fade" ${d(2.1)} x="476" y="248" text-anchor="middle">NO TELEMETRY</text>
  <text class="art-tiny a-fade" ${d(2.2)} x="476" y="264" text-anchor="middle">NO ACCOUNT</text>
</svg>`
}
