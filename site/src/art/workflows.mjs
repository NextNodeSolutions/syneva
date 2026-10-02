// Workflows section drawings: where a review's diff comes from.
import { artFrame, check, d, pending } from './kit.mjs'

const GLYPHS = {
	tree: 'M0 0v22M0 5h7M0 17h7M7 2h13v6H7zM7 14h13v6H7z',
	staged: 'M0 8 10 3l10 5-10 5zM0 14l10 5 10-5',
	branch:
		'M4 0v15.5M1.5 18a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M13.5 4a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M16 6.5c0 5-4 7-12 8',
	file: 'M2 0h11l5 5v17H2zM13 0v5h5M6 11h8M6 15h6',
}

// Overview: four sources, one desk, one verdict.
export function workflowHub() {
	const sources = [
		['tree', 'Working tree', 'syneva', 50],
		['staged', 'Staged changes', 'syneva --diff staged', 145],
		['branch', 'Branch or PR', 'syneva pr 128', 240],
		['file', 'A single file', 'syneva file plan.md', 335],
	]
	const cards = sources
		.map(
			([glyph, title, cmd, y], i) =>
				`<g class="a-rise" ${d(i * 0.12)}><rect class="art-panel is-white" x="30" y="${y}" width="210" height="64"/><g transform="translate(46 ${y + 14})"><path class="hub-glyph" d="${GLYPHS[glyph]}"/></g><text class="art-copy" x="80" y="${y + 28}">${title}</text><text class="art-code is-accent" x="80" y="${y + 48}">${cmd}</text></g>`,
		)
		.join('')
	const routes = sources
		.map(([, , , y], i) => {
			const path = `M240 ${y + 32}C290 ${y + 32} 290 220 340 220`
			return `<path class="art-route a-draw" pathLength="1" ${d(0.5 + i * 0.1)} d="${path}"/><path class="art-signal a-signal" pathLength="100" ${d(1.4 + i * 0.8)} d="${path}"/><circle class="art-port" cx="240" cy="${y + 32}" r="2.5"/>`
		})
		.join('')
	return `<svg viewBox="0 0 600 440" data-compact="20 30 570 380" role="img" aria-labelledby="hub-title hub-desc">
  <title id="hub-title">Four ways in, one desk</title>
  <desc id="hub-desc">The working tree, staged changes, a branch or pull request, and a single file each feed the same local desk, which produces one structured verdict whose mode tells your agent how to read it.</desc>
  ${artFrame('hub', 600, 440)}
  <g fill="none">${routes}<path class="art-route is-green a-draw" pathLength="1" ${d(1.2)} d="M450 220h40"/><path class="art-signal is-green a-signal" pathLength="100" ${d(2)} d="M450 220h40"/></g>
  ${cards}
  <g class="a-rise" ${d(0.8)}><rect class="art-panel is-white" x="340" y="160" width="110" height="120"/><path class="art-hair" d="M340 180h110"/><rect class="art-dot" x="348" y="167" width="5" height="5"/><text class="art-tiny" x="358" y="173">LOCALHOST</text><text class="art-small" x="352" y="202">One desk</text>${check(352, 214)}${check(352, 234)}${pending(352, 254)}<path class="art-lines" d="M370 220h64M370 240h54M370 260h60"/></g>
  <circle class="art-port" cx="340" cy="220" r="2.5"/>
  <g class="a-rise" ${d(1.4)}><rect class="art-panel is-mint" x="490" y="180" width="86" height="80"/><text class="art-tiny is-green" x="533" y="204" text-anchor="middle">VERDICT</text><text class="art-code" x="533" y="226" text-anchor="middle">mode</text><text class="art-tiny" x="533" y="246" text-anchor="middle">REPO·FILE·PR</text></g>
</svg>`
}

// Working tree: modified and untracked files, and --path as a lens.
export function workingTree() {
	const rows = [
		['src/auth/session.ts', 'M', 92],
		['src/auth/token.ts', 'M', 120],
		['src/api/middleware.ts', 'M', 148],
		['src/limits/rate.ts', 'A', 176],
		['docs/plan.md', '', 204],
		['package.json', '', 232],
	]
	const tree = rows
		.map(
			([name, status, y]) =>
				`<text class="art-file${status ? '' : ' is-ghost'}" x="58" y="${y}">${name}</text>${status ? `<rect class="wt-status is-${status === 'A' ? 'add' : 'mod'}" x="216" y="${y - 11}" width="16" height="15"/><text class="art-tiny ${status === 'A' ? 'is-green' : 'is-accent'}" x="224" y="${y}" text-anchor="middle">${status}</text>` : ''}`,
		)
		.join('')
	const list = (names, x, y, label, delay) =>
		`<g class="a-rise" ${d(delay)}><rect class="art-panel is-white" x="${x}" y="${y}" width="210" height="${36 + names.length * 24}"/><text class="art-code is-accent" x="${x + 14}" y="${y + 22}">${label}</text><path class="art-hair" d="M${x} ${y + 32}h210"/>${names
			.map(
				([name, kind], i) =>
					`<rect class="wt-bar is-${kind}" x="${x + 14}" y="${y + 44 + i * 24}" width="4" height="10"/><text class="art-file" x="${x + 26}" y="${y + 53 + i * 24}">${name}</text>`,
			)
			.join('')}</g>`
	return `<svg viewBox="0 0 600 400" data-compact="20 30 566 350" role="img" aria-labelledby="wt-title wt-desc">
  <title id="wt-title">The working tree, whole or narrowed</title>
  <desc id="wt-desc">Your repository has three modified files and one new untracked file. syneva reviews all four, the new one as a full-file addition. syneva --path src/auth narrows the desk to the two files under src/auth.</desc>
  ${artFrame('wt', 600, 400)}
  <g class="a-rise" ${d(0)}><rect class="art-panel" x="40" y="60" width="210" height="196"/><text class="art-tiny" x="40" y="50">YOUR REPOSITORY</text>${tree}</g>
  <path class="art-bracket a-draw" pathLength="1" ${d(0.9)} d="M50 88v-10h8M50 122v10h8"/>
  <text class="art-tiny is-accent a-fade" ${d(1)} x="40" y="282">--path src/auth</text>
  <g fill="none">
    <path class="art-route a-draw" pathLength="1" ${d(0.5)} d="M250 150C300 150 300 100 350 100"/>
    <path class="art-route is-accent a-draw" pathLength="1" ${d(1.1)} d="M250 106C320 106 280 290 350 290"/>
    <path class="art-signal a-signal" pathLength="100" ${d(1.6)} d="M250 150C300 150 300 100 350 100"/>
    <path class="art-signal a-signal" pathLength="100" ${d(2.4)} d="M250 106C320 106 280 290 350 290"/>
  </g>
  ${list(
		[
			['src/auth/session.ts', 'mod'],
			['src/auth/token.ts', 'mod'],
			['src/api/middleware.ts', 'mod'],
			['src/limits/rate.ts', 'add'],
		],
		350,
		60,
		'$ syneva',
		0.6,
	)}
  ${list(
		[
			['src/auth/session.ts', 'mod'],
			['src/auth/token.ts', 'mod'],
		],
		350,
		250,
		'$ syneva --path src/auth',
		1.2,
	)}
  <text class="art-tiny is-green a-fade is-secondary" ${d(1.4)} x="40" y="330">A · UNTRACKED → FULL-FILE ADDITION</text>
  <text class="art-tiny a-fade is-secondary" ${d(1.5)} x="40" y="348">UNCHANGED FILES STAY OUT</text>
</svg>`
}

// Staged: review the index, the exact content of your next commit.
export function stagedPlanes() {
	return `<svg viewBox="0 0 600 420" data-compact="30 30 560 370" role="img" aria-labelledby="st-title st-desc">
  <title id="st-title">Reviewing the index, not the working tree</title>
  <desc id="st-desc">Behind, the working tree holds five changes. In front, the index holds the two you staged. syneva --diff staged reviews only the index: exactly what your next commit will contain.</desc>
  ${artFrame('st', 600, 420)}
  <g class="a-rise" ${d(0)}>
    <rect class="art-panel" x="50" y="60" width="300" height="230"/>
    <text class="art-tiny" x="50" y="50">WORKING TREE · 5 CHANGES</text>
    ${[86, 116, 146, 176, 206].map((y, i) => `<rect class="wt-bar is-${i === 1 ? 'add' : 'mod'}" x="66" y="${y}" width="4" height="12"/><path class="art-lines" d="M78 ${y + 6}h${[150, 120, 170, 90, 140][i]}"/>`).join('')}
  </g>
  <path class="art-route is-dotted a-draw" pathLength="1" ${d(0.6)} d="M240 122C290 122 300 136 300 160"/>
  <text class="art-tiny a-fade is-secondary" ${d(0.8)} x="262" y="110">git add</text>
  <g class="a-rise" ${d(0.4)}>
    <rect class="art-panel is-white" x="220" y="160" width="330" height="200"/>
    <text class="art-tiny is-accent" x="236" y="182">INDEX · STAGED · YOUR NEXT COMMIT</text>
    <path class="art-hair" d="M220 194h330"/>
    <rect class="art-band-add" x="221" y="208" width="328" height="44"/>
    <text class="art-code is-add" x="236" y="226">+ await verifySession(req)</text>
    <text class="art-code is-add" x="236" y="244">+ return run(req)</text>
    <rect class="art-band-add" x="221" y="266" width="328" height="24"/>
    <text class="art-code is-add" x="236" y="283">+ export const LIMIT = 120</text>
    ${check(524, 214, 12, 1.2)}${pending(524, 272, 12)}
    <path class="art-hair" d="M220 304h330"/>
    <text class="art-code" x="236" y="336">$ syneva --diff staged</text>
  </g>
  <path class="art-bracket a-draw" pathLength="1" ${d(1)} d="M206 176v-24h24M564 176v-24h-24M206 344v24h24M564 344v24h-24"/>
  <text class="art-tiny is-accent a-fade" ${d(1.3)} x="385" y="390" text-anchor="middle">REVIEWED: THE INDEX, NOTHING ELSE</text>
</svg>`
}

// Pull requests: a branch reviewed against its merge-base.
export function branchGraph() {
	const main = [70, 160, 250, 340, 430, 520]
	const feature = [
		[280, 190],
		[360, 160],
		[440, 160],
		[520, 160],
	]
	return `<svg viewBox="0 0 600 420" data-compact="30 20 560 380" role="img" aria-labelledby="pr-title pr-desc">
  <title id="pr-title">A branch against its merge-base</title>
  <desc id="pr-desc">syneva pr takes a branch name, a pull request number or a GitHub URL. The branch's commits since the merge-base with main are what you review; commits that landed on main in the meantime stay out of the diff.</desc>
  ${artFrame('pr', 600, 420)}
  <g class="a-rise" ${d(0)}>
    <rect class="art-panel is-white" x="40" y="44" width="520" height="62"/>
    <text class="art-code" x="56" y="68">$ syneva pr 128</text>
    <text class="art-tiny" x="544" y="68" text-anchor="end">OR A BRANCH, OR A GITHUB URL</text>
    <text class="art-small" x="56" y="92">Numbers and URLs resolve through gh. The branch is checked out for you.</text>
  </g>
  <path class="pr-main a-draw" pathLength="1" ${d(0.3)} d="M50 300H560"/>
  <text class="art-tiny a-fade" ${d(0.4)} x="50" y="330">MAIN</text>
  ${main.map((x, i) => `<circle class="pr-commit${x === 160 ? ' is-base' : ''} a-pop" ${d(0.4 + i * 0.08)} cx="${x}" cy="300" r="${x === 160 ? 7 : 5}"/>`).join('')}
  <path class="pr-branch a-draw" pathLength="1" ${d(0.8)} d="M160 300C200 300 220 190 280 190C320 190 330 160 360 160H520"/>
  ${feature.map(([x, y], i) => `<circle class="pr-commit is-feature a-pop" ${d(1.1 + i * 0.12)} cx="${x}" cy="${y}" r="6"/>`).join('')}
  <text class="art-tiny is-accent a-fade" ${d(1.5)} x="534" y="164">HEAD</text>
  <text class="art-tiny a-fade" ${d(1)} x="160" y="330" text-anchor="middle">MERGE-BASE</text>
  <path class="art-bracket a-draw" pathLength="1" ${d(1.6)} d="M176 142v-12h352v12"/>
  <text class="art-tiny is-accent a-fade" ${d(1.8)} x="352" y="122" text-anchor="middle">REVIEWED · MERGE-BASE → HEAD</text>
  <g class="a-fade" ${d(2)}><text class="art-tiny" x="345" y="356" text-anchor="middle">COMMITS ON MAIN SINCE THEN STAY OUT</text><path class="art-hair" d="M250 340h190"/></g>
  <g class="a-rise is-secondary" ${d(2.2)}><text class="art-tiny is-green" x="40" y="392">APPROVE → APPROVE</text><text class="art-tiny is-accent" x="190" y="392">REJECT → REQUEST CHANGES</text><text class="art-tiny" x="400" y="392">--base &lt;ref&gt; OVERRIDES</text></g>
</svg>`
}

// Single file: three states, and markdown reviewed as rendered blocks.
export function singleFile() {
	const states = [
		['UNCHANGED', 'full file', 40],
		['CHANGED', 'diff · stageable', 220],
		['UNTRACKED', 'full file · verdict', 400],
	]
	return `<svg viewBox="0 0 600 430" data-compact="30 30 560 390" role="img" aria-labelledby="sf-title sf-desc">
  <title id="sf-title">One file, tracked or not</title>
  <desc id="sf-desc">syneva file opens one file. An unchanged file shows in full, a changed file shows as a diff you can stage, and an untracked file shows in full for a verdict. Markdown renders, and you can comment on any rendered block, including the file's own images.</desc>
  ${artFrame('sf', 600, 430)}
  ${states.map(([label, text, x], i) => `<g class="a-rise" ${d(i * 0.12)}><rect class="art-panel${i === 1 ? ' is-white' : ''}" x="${x}" y="40" width="160" height="58"/><text class="art-tiny ${i === 1 ? 'is-accent' : ''}" x="${x + 14}" y="62">${label}</text><text class="art-small" x="${x + 14}" y="84">${text}</text></g>`).join('')}
  <g class="a-rise" ${d(0.4)}>
    <rect class="art-panel is-white" x="40" y="118" width="380" height="280"/>
    <text class="art-file is-strong" x="56" y="140">docs/rollout.md</text>
    <rect class="art-kbd" x="270" y="128" width="138" height="18"/><text class="art-tiny" x="339" y="141" text-anchor="middle">RENDERED · SOURCE m</text>
    <path class="art-hair" d="M40 154h380"/>
    <text class="art-head" x="56" y="184">Rollout</text>
    <path class="art-lines" d="M56 204h320M56 220h260"/>
    <rect class="art-band-focus" x="48" y="234" width="360" height="40"/>
    <path class="art-lines" d="M56 250h300M56 264h220"/>
    <rect class="sf-image" x="56" y="290" width="160" height="90"/>
    <path class="sf-image-line" d="M64 368l40-34 26 20 30-28 48 42"/><rect class="sf-sun" x="182" y="302" width="12" height="12"/>
    <text class="art-tiny is-secondary" x="230" y="374">IMAGES SERVED FROM THE REPO</text>
  </g>
  <path class="ask-anchor a-draw" pathLength="1" ${d(0.9)} d="M408 254h28"/>
  <g class="a-rise" ${d(1.1)}>
    <rect class="ask-thread" x="436" y="214" width="140" height="92"/><path class="ask-rail" d="M436 214v92"/>
    <text class="art-tiny" x="448" y="234">YOU · ASK</text><text class="art-small" x="448" y="252">Who flips the</text><text class="art-small" x="448" y="268">flag in step 2?</text>
    <text class="art-tiny is-accent" x="448" y="292">ON THIS BLOCK</text>
  </g>
</svg>`
}
