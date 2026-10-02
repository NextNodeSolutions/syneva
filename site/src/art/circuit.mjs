// The review circuit, formerly the hero drawing: the full diff travels
// horizontally while its review layers separate vertically. It now opens the
// How it works section, where its loop (diff, focus, verdict, next revision)
// is the story being told. motion.js routes its wires from the port positions.
export const circuit = () => `
<svg class="circuit-art" viewBox="0 0 1160 480" role="img" aria-labelledby="circuit-title circuit-desc">
  <title id="circuit-title">The review, in two dimensions</title>
  <desc id="circuit-desc">The full diff passes from your agent into a local review. Its layers open vertically: critical, important, and tested. You make your decisions during review, then ship code you've examined with confidence. A dotted return connection carries the next revision back to the agent. An illustrative human review, not automatic approval or a product screenshot.</desc>
  <defs>
    <clipPath id="review-face-clip"><use href="#review-face"/></clipPath>
    <path id="flow-in" data-from="agent-out" data-to="review-in"/>
    <path id="flow-out" data-from="review-out" data-to="verdict-in"/>
    <path id="flow-return" data-from="verdict-return" data-to="agent-return" data-route="return"/>
    <g id="review-leaf">
      <path class="leaf-edge" d="M-112 0 0 56 112 0v5L0 61-112 5Z"/>
      <path id="review-face" class="leaf-face" d="M0-56 112 0 0 56-112 0Z"/>
      <path class="leaf-fold" d="M0 56v5"/>
      <g transform="matrix(.8 .4 -.8 .4 0 -39)" class="leaf-code">
        <path class="code-accent" d="M0 0h47"/>
        <path d="M0 17h18m10 0h44M0 34h32m10 0h40M0 51h14m10 0h39M0 68h42"/>
        <path class="code-faint" d="M81 0h14M90 34h8M72 51h20M51 68h15"/>
      </g>
    </g>
    <g id="review-mark" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M0-11v6M0 5v6M-11 0h6M5 0h6M-8-8l4 4M4 4l4 4M-8 8l4-4M4-4l4-4"/><path d="m0-3 3 3-3 3-3-3Z"/></g>
    <g id="verdict-check" fill="none" stroke="var(--green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m-7 0 5 5 10-11"/></g>
  </defs>
  <g class="circuit-register" fill="none" stroke="var(--line)"><path d="M28 44V28h16m1072 0h16v16M28 436v16h16m1072 0h16v-16"/></g>
  <g class="circuit-world">
    <!-- Visible conductors and travelling signals share the same paths. -->
    <g class="circuit-routes" fill="none">
      <use href="#flow-in"/><use href="#flow-out"/>
      <use class="return-route" href="#flow-return"/>
      <use class="flow-signal signal-in" href="#flow-in"/>
      <use class="flow-signal signal-out" href="#flow-out"/>
      <use class="flow-signal signal-return" href="#flow-return"/>
    </g>
    <g class="source-station" transform="translate(212 312)">
      <path class="station-foot" d="M0-62 124 0 0 62-124 0Z"/><path class="station-rim" d="m-124 0 0 7L0 69 124 7V0"/>
      <g class="source-leaves"><use href="#review-leaf" transform="translate(0 -8) scale(.72)"/><use href="#review-leaf" transform="translate(0 -19) scale(.72)"/><g class="dispatch-sheet"><use href="#review-leaf" transform="translate(0 -30) scale(.72)"/></g></g>
      <g transform="translate(0 51) scale(1 .5)" class="station-mark"><use href="#review-mark"/></g>
      <circle class="circuit-port" id="agent-out" cx="124" cy="0" r="2.5"/><circle class="circuit-port" id="agent-return" cx="0" cy="69" r="2.5"/>
      <text y="-128" class="station-title" text-anchor="middle">Your full diff</text><text y="-109" class="station-detail" text-anchor="middle">Every change from your agent</text>
    </g>
    <g class="center-station" transform="translate(580 312)">
      <path class="station-foot" d="M0-76 152 0 0 76-152 0Z"/><path class="station-rim" d="M-152 0v8L0 84 152 8V0"/>
      <path class="review-seat" d="M0-61 122 0 0 61-122 0Z"/>
      <g transform="translate(0 68) scale(1 .5)" class="station-mark"><use href="#review-mark"/></g>
      <circle class="circuit-port" id="review-in" cx="-152" cy="0" r="2.5"/><circle class="circuit-port" id="review-out" cx="152" cy="0" r="2.5"/>
    </g>
    <g transform="translate(580 276)">
      <g class="review-layer layer-tested">
        <use href="#review-leaf" transform="translate(0 10)"/><use href="#review-leaf"/>
        <g class="layer-check" transform="translate(64 5) scale(1 .5)"><use href="#verdict-check"/></g>
        <g class="layer-note"><path d="M112 0h38"/><circle cx="112" r="2"/><text x="162" y="-3" class="note-title">Tested</text><text x="162" y="15" class="note-detail">Check evidence</text></g>
      </g>
      <g class="review-layer layer-important">
        <use href="#review-leaf"/>
        <g class="layer-note"><path d="M112 0h38"/><circle cx="112" r="2"/><text x="162" y="-3" class="note-title">Important</text><text x="162" y="15" class="note-detail">Follow the change</text></g>
      </g>
      <g class="review-layer layer-critical">
        <use href="#review-leaf"/><path class="critical-margin" d="m-97-3 13-6m-4 15 13-6m-4 15 13-6"/>
        <g clip-path="url(#review-face-clip)"><path class="reading-sweep" d="m-160-80 112 56v18l-112-56Z"/></g>
        <g class="focus-frame" fill="none"><path d="m-128-10 0-10 22-11m212 0 22 11v10M-128 13v10l22 11m212 0 22-11V13"/></g>
        <g class="focus-owner"><path d="M0-58v-12"/><text y="-80" text-anchor="middle">YOUR FOCUS</text></g>
        <g class="layer-note"><path d="M112 0h38"/><circle cx="112" r="2"/><text x="162" y="-3" class="note-title">Critical</text><text x="162" y="15" class="note-detail">Read closely</text></g>
      </g>
    </g>
    <g class="verdict-station" transform="translate(948 312)">
      <path class="station-foot" d="M0-62 124 0 0 62-124 0Z"/><path class="station-rim" d="M-124 0v7L0 69 124 7V0"/>
      <g transform="translate(0 -9) scale(.72)">
        <use href="#review-leaf"/>
        <g class="verdict-accepted"><use href="#review-leaf"/></g>
      </g>
      <g transform="translate(0 -21)"><g class="verdict-seal"><ellipse rx="22" ry="11"/><g transform="scale(1 .5)"><use href="#verdict-check"/></g></g></g>
      <circle class="circuit-port" id="verdict-in" cx="-124" cy="0" r="2.5"/><circle class="circuit-port" id="verdict-return" cx="0" cy="69" r="2.5"/>
      <text y="-128" class="station-title" text-anchor="middle">Ship with confidence</text><text y="-109" class="station-detail" text-anchor="middle">Code you've reviewed</text>
    </g>
    <text class="loop-label" text-anchor="middle">SAME TAB. NEXT REVISION.</text>
  </g>
</svg>
`
