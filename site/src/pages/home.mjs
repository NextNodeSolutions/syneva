import { circuit } from '../art/circuit.mjs'
import { heroStage } from '../art/hero-stage.mjs'
import {
	askFigure,
	deskFigure,
	gapChart,
	localFigure,
	planFigure,
} from '../art/home.mjs'
import { REPO_URL } from '../nav.mjs'
import {
	ARROW_RIGHT,
	chapter,
	command,
	ctaBand,
	EXT,
	faqRows,
	textLink,
} from '../ui.mjs'

const hero = () => `<section class="hero" aria-labelledby="hero-title">
      <div class="hero-field" aria-hidden="true"><span class="hero-light"></span></div>
      <a class="hero-news" href="/resources/changelog/"><span class="news-tag">New</span><span>Review notes: every comment and question, one keystroke away</span><span class="news-arrow" aria-hidden="true">→</span></a>
      <h1 class="hero-title" id="hero-title">
        <span class="hl hl-agent"><span class="hl-gutter" aria-hidden="true"><i>1</i><b>+</b></span><span class="hl-clip"><span class="hl-text">Your agent writes.</span></span></span>
        <span class="hl hl-human"><span class="hl-gutter" aria-hidden="true"><i>2</i><b><svg viewBox="0 0 20 20"><path d="m4 10.5 4 4 8-9"/></svg></b></span><span class="hl-clip"><span class="hl-text">You <em>decide<svg class="hl-underline" viewBox="0 0 320 18" preserveAspectRatio="none" aria-hidden="true"><path d="M6 12C80 5 230 4 314 10" pathLength="100"/></svg></em> what ships.</span></span></span>
      </h1>
      <div class="hero-body">
        <div class="hero-copy">
          <p class="hero-lede">Syneva is the review desk for code your agent wrote. Read the diff in a reading order, ask about the exact line, give every change a verdict, and hand a structured result back to your agent. Same tab, every round.</p>
          <div class="hero-actions">
            <a class="button primary" href="/get-started/">Start a local review ${ARROW_RIGHT}</a>
            <a class="text-link" href="#how">See how it works <span aria-hidden="true">↓</span></a>
          </div>
          ${command('npm install -g syneva', 'Installation command')}
          <p class="hero-works"><span>Works with the agent you already use</span> Claude Code · Codex · Cursor · pi · your own scripts</p>
        </div>
        <figure class="hero-stage motion-scene">
          <div class="figure-top"><span><span class="live-dot" aria-hidden="true"></span>ONE REVIEW ROUND</span><span>ILLUSTRATIVE · NOT A SCREENSHOT</span></div>
          ${heroStage()}
        </figure>
      </div>
    </section>`

const principles = () =>
	`<div class="principle-strip" role="list"><span role="listitem"><b aria-hidden="true">01</b>Local by default</span><span role="listitem"><b aria-hidden="true">02</b>Your agent, not ours</span><span role="listitem"><b aria-hidden="true">03</b>No model inside Syneva</span><span role="listitem"><b aria-hidden="true">04</b>Open source · MIT</span></div>`

const problem = () => `<section class="problem section-pad" id="problem" aria-labelledby="problem-title" data-reveal>
      <div class="problem-copy">
        <h2 id="problem-title" data-reveal-item>Writing code got faster.<br>Knowing what to trust didn’t.</h2>
        <p data-reveal-item>Your agent hands back a long plan and an even longer diff. Your editor shows it as a pile of files. So you scroll, you skim, you ask the agent what it changed, and sometimes you merge and hope.</p>
        <p data-reveal-item>That gap between what gets written and what gets understood is where bugs, rewrites and lost afternoons come from. Syneva is built to close it: one place to read the work, question it, and decide.</p>
      </div>
      <figure class="problem-art motion-scene" data-reveal-item>${gapChart()}<figcaption>Conceptual drawing. No data, no benchmark.</figcaption></figure>
    </section>`

const how = () => `<section class="how" id="how" aria-labelledby="how-title" data-reveal data-rule>
      <div class="how-head section-pad"><h2 id="how-title" data-reveal-item>One loop.<br>Same tab, every round.</h2><p data-reveal-item>Your agent’s full diff comes in. You read the critical parts closely, settle every change, and send your verdict back. The agent revises, and the next round lands in the tab you never closed.</p></div>
      <figure class="circuit motion-scene" aria-labelledby="circuit-caption" data-reveal-item>
        <div class="figure-top"><span>YOUR AGENT’S DIFF. YOUR ATTENTION.</span><span>THE REVIEW CIRCUIT</span></div>
        ${circuit()}
        <figcaption id="circuit-caption">Your full diff. Room to understand it. Confidence in what ships.</figcaption>
      </figure>
      <div class="loop section-pad">
        <ol class="loop-steps">
          <li class="loop-step" data-reveal-item><span class="step-index">01</span><strong>Open the desk</strong><p>Run <code>syneva</code> next to your repository. The diff opens in your browser, on localhost. Nothing leaves your machine.</p></li>
          <li class="loop-step" data-reveal-item><span class="step-index">02</span><strong>Read in order</strong><p>Your agent can attach a reading order that groups files into sections. Files it doesn’t list still appear, under Other.</p></li>
          <li class="loop-step" data-reveal-item><span class="step-index">03</span><strong>Ask on the line</strong><p>Questions anchor to the exact change. Your agent answers in the same thread while you keep reviewing.</p></li>
          <li class="loop-step" data-reveal-item><span class="step-index">04</span><strong>Send the verdict</strong><p>Keep or undo each change, then Send. Your agent receives a structured result and re-diffs its edits into the same tab.</p></li>
        </ol>
        <p class="loop-note" data-reveal-item>Anything your agent rewrites resets to pending. Anything you settled stays settled.</p>
      </div>
    </section>`

const chapters = () =>
	[
		chapter({
			id: 'desk',
			title: 'A big diff.<br>A smaller mental load.',
			body: [
				'<span class="chapter-status">Review desk · available now</span>',
				'The agent has finished. Now it’s your turn. Read its work in a local browser desk, in the order that makes it make sense, and record a verdict on every change.',
			],
			list: [
				[
					'Follow the change, not the file list.',
					'Your agent groups files into a walkthrough, general to specific. Every file stays visible.',
				],
				[
					'Keep the good, undo the rest.',
					'A verdict per change, or sign off a whole file. Nothing is ever auto-approved.',
				],
				[
					'Never touch the mouse.',
					'j and k between changes, ⇧Y to keep, ⇧N to undo, ⇧S to send. Press ? for the full map.',
				],
			],
			after: textLink('/product/review-desk/', 'Explore the review desk'),
			art: deskFigure(),
			caption: 'Read in order → keep or undo → next change',
		}),
		chapter({
			id: 'ask',
			reverse: true,
			title: 'Ask on the line.<br>Get the answer there.',
			body: [
				'<span class="chapter-status">Ask your agent · available now</span>',
				'Stop copying snippets into a chat window. Ask about the exact change, keep reviewing, and the answer lands in the thread where your question lives.',
			],
			list: [
				[
					'Two intents, one keystroke apart.',
					'Ask for an explanation now, or request a change that rides along with your verdict.',
				],
				[
					'Answers in place, progress in sight.',
					'Your agent reads, posts a live status beside the thread, then replies on the same line.',
				],
				[
					'No question gets lost.',
					'Anything still unanswered when you Send travels with the result, flagged as open.',
				],
			],
			after: textLink('/product/ask-your-agent/', 'See how questions work'),
			art: askFigure(),
			caption: 'Ask → agent reads → answer on the line',
		}),
		chapter({
			id: 'plan',
			title: 'A clear plan.<br>A better starting point.',
			body: [
				'<span class="chapter-status is-prototype">Plan desk · prototype</span>',
				'The cheapest bug is the one you argue out of the plan. The plan desk we’re exploring turns an agent’s proposal into a map of claims you can question before any code exists.',
			],
			list: [
				[
					'See the shape of the work.',
					'Read the plan as a map, a document, or source.',
				],
				[
					'Find the assumptions worth checking.',
					'See which claims carry risk, and what would prove them wrong.',
				],
				[
					'Give your agent a clearer brief.',
					'Comment on the exact line. Settle the decision before the diff.',
				],
			],
			after: `<p class="honest-note" data-reveal-item>A direction, not a shipped feature. Today, <code>syneva file plan.md</code> already reviews a plan line by line.</p>${textLink('/product/plan-desk/', 'Follow the plan desk')}`,
			art: planFigure(),
			caption: 'Plan → claims → decisions',
		}),
	].join('')

const handoff = () => `<section class="handoff section-pad" id="handoff" aria-labelledby="handoff-title" data-reveal data-rule>
      <div class="handoff-copy"><h2 id="handoff-title" data-reveal-item>The verdict,<br>as a contract.</h2><p data-reveal-item>Send to Agent hands back a structured <code>ReviewResult</code>, printed to stdout and written to disk. Not a screenshot, not a vibe: your agent knows exactly what you kept, what you undid, and what you asked for.</p><p data-reveal-item>It acts on the round, calls <code>syneva reload</code>, and the same tab shows its next revision. Your settled decisions carry over; its new edits come back pending.</p><div class="handoff-links" data-reveal-item>${textLink('/resources/connect-your-agent/', 'Connect your agent')}${textLink(`${REPO_URL}/blob/main/packages/contracts/src/spec.ts`, 'Read the full contract', true)}</div></div>
      <figure class="handoff-figure" data-reveal-item>
        <div class="figure-top"><span>$ syneva await</span><span>EVENT · REVIEW</span></div>
        <pre class="handoff-json" aria-label="Illustrative review event"><span class="j-line"><span class="j-punc">{</span> <span class="j-key">"kind"</span><span class="j-punc">:</span> <span class="j-str">"review"</span><span class="j-punc">,</span> <span class="j-key">"result"</span><span class="j-punc">: {</span></span><span class="j-line">  <span class="j-key">"mode"</span><span class="j-punc">:</span> <span class="j-str">"repo"</span><span class="j-punc">,</span></span><span class="j-line is-yes">  <span class="j-key">"accepted"</span><span class="j-punc">: [{</span> <span class="j-key">"path"</span><span class="j-punc">:</span> <span class="j-str">"auth/session.ts"</span><span class="j-punc">,</span> <span class="j-key">"lineNumber"</span><span class="j-punc">:</span> <span class="j-num">14</span><span class="j-punc">,</span></span><span class="j-line is-yes">      <span class="j-key">"side"</span><span class="j-punc">:</span> <span class="j-str">"additions"</span><span class="j-punc">,</span> <span class="j-key">"title"</span><span class="j-punc">:</span> <span class="j-str">"Verify the session first"</span> <span class="j-punc">}],</span></span><span class="j-line is-no">  <span class="j-key">"rejected"</span><span class="j-punc">: [{</span> <span class="j-key">"path"</span><span class="j-punc">:</span> <span class="j-str">"pages/desk.tsx"</span><span class="j-punc">,</span> <span class="j-key">"lineNumber"</span><span class="j-punc">:</span> <span class="j-num">41</span><span class="j-punc">, … }],</span></span><span class="j-line is-ask">  <span class="j-key">"requestedChanges"</span><span class="j-punc">: [{</span> <span class="j-key">"path"</span><span class="j-punc">:</span> <span class="j-str">"api/middleware.ts"</span><span class="j-punc">,</span> <span class="j-key">"lineNumber"</span><span class="j-punc">:</span> <span class="j-num">20</span><span class="j-punc">,</span></span><span class="j-line is-ask">      <span class="j-key">"body"</span><span class="j-punc">:</span> <span class="j-str">"Log why the session was rejected."</span> <span class="j-punc">}],</span></span><span class="j-line">  <span class="j-key">"approvedFiles"</span><span class="j-punc">: [</span><span class="j-str">"contracts/review.ts"</span><span class="j-punc">,</span> <span class="j-str">"lib/hash.ts"</span><span class="j-punc">],</span></span><span class="j-line">  <span class="j-key">"openQuestions"</span><span class="j-punc">: [],</span></span><span class="j-line">  <span class="j-key">"overallNote"</span><span class="j-punc">:</span> <span class="j-str">"Run the formatter after."</span></span><span class="j-line"><span class="j-punc">} }</span></span></pre>
        <figcaption>Illustrative round, trimmed. The full shape is versioned with the CLI: <code>syneva spec</code></figcaption>
      </figure>
    </section>`

const compareRows = [
	[
		'Who judges the change',
		'You, file by file',
		'A model, on its servers',
		'You, with your agent on call',
	],
	[
		'Order you read in',
		'The file tree',
		'The PR’s file list',
		'A walkthrough your agent sets',
	],
	[
		'Questions',
		'Switch to a chat window',
		'Comments on a PR',
		'On the exact line, answered there',
	],
	[
		'What a verdict is',
		'Git staging',
		'A bot’s approval',
		'Your decision, recorded per change',
	],
	[
		'After the agent revises',
		'Start over',
		'A new review pass',
		'Same tab. Only rewritten changes reset',
	],
	[
		'Where your code goes',
		'Stays local',
		'Uploaded for analysis',
		'Stays on localhost',
	],
]

const compare = () => `<section class="compare section-pad" id="compare" aria-labelledby="compare-title" data-reveal data-rule>
      <div class="compare-head"><h2 id="compare-title" data-reveal-item>Built for the loop<br>your editor wasn’t.</h2><p data-reveal-item>Editors were designed for writing code. AI reviewers put a model between you and the diff. Syneva is a review surface for the human, with the agent that wrote the code one keystroke away.</p></div>
      <div class="compare-scroll" data-reveal-item><table class="compare-table">
        <thead><tr><th scope="col"><span class="visually-hidden">Aspect</span></th><th scope="col">Your editor’s diff</th><th scope="col">Hosted AI review</th><th scope="col" class="is-us">Syneva</th></tr></thead>
        <tbody>${compareRows
					.map(
						([aspect, editor, hosted, us]) =>
							`<tr><th scope="row">${aspect}</th><td>${editor}</td><td>${hosted}</td><td class="is-us">${us}</td></tr>`,
					)
					.join('')}</tbody>
      </table></div>
    </section>`

const facts = () => `<section class="gap section-pad" id="facts" aria-labelledby="facts-title" data-reveal data-rule>
      <div class="gap-head"><h2 id="facts-title" data-reveal-item>Numbers we can<br>actually promise.</h2><p data-reveal-item>No adoption charts, no borrowed logos. These are product facts: true on your machine the moment you install it.</p></div>
      <div class="gap-stats">
        <div class="gap-stat" data-reveal-item><span class="stat-number" data-count="0">0</span><span class="stat-label">changes auto-approved. Every verdict is a click you made.</span></div>
        <div class="gap-stat" data-reveal-item><span class="stat-number" data-count="1">1</span><span class="stat-label">tab for the whole loop: review, questions and the next revision.</span></div>
        <div class="gap-stat" data-reveal-item><span class="stat-number" data-count="4">4</span><span class="stat-label">review modes: working tree, staged, a branch or PR, a single file.</span></div>
        <div class="gap-stat" data-reveal-item><span class="stat-number" data-count="100">100<span class="stat-unit">%</span></span><span class="stat-label">local. No model inside, no telemetry, no account.</span></div>
      </div>
    </section>`

const local = () => `<section class="local section-pad" id="local" aria-labelledby="local-title" data-reveal data-rule>
      <div class="local-copy"><h2 id="local-title" data-reveal-item>Your code stays<br>on your machine.</h2><p data-reveal-item>Review doesn’t need another cloud service. Syneva opens next to your repository, on loopback, and never calls a model. Your agent does the thinking; Syneva gives you a better place to judge it.</p><ul class="local-points" data-reveal-item><li>Binds to 127.0.0.1 on a stable port per session</li><li>Decisions saved under <code>~/.syneva</code>, restored after a restart</li><li>Never edits your tracked files</li></ul><p class="benchmark-note" data-reveal-item><a class="text-link" href="${REPO_URL}/blob/main/test/benchmarks/history.json">Recorded performance evidence ${EXT}</a><br>Historical runs published September 17, 2026. Not a guarantee for your repository.</p></div>
      <figure class="local-art motion-scene" data-reveal-item>${localFigure()}</figure>
    </section>`

const faq = () => `<section class="faq section-pad" id="faq" aria-labelledby="faq-title" data-reveal data-rule><div class="faq-head"><h2 id="faq-title" data-reveal-item>A few things<br>worth knowing.</h2><p data-reveal-item>${textLink('/resources/faq/', 'All questions & answers')}</p></div>${faqRows(
	[
		[
			'Does Syneva review code for me?',
			'No. You review the code. Your own agent can set the reading order and answer your questions. Syneva records your decisions and hands them back to that agent.',
		],
		[
			'Does Syneva ever auto-approve anything?',
			'Never. Every change starts pending, and only your click records a verdict. A verdict is stored on that exact change, not inferred from git staging or a blanket approval.',
		],
		[
			'What if the agent rewrites code I already accepted?',
			'Syneva hashes each change. On reload, a rewritten change resets to pending while untouched work keeps your verdict. Approvals and comment anchors follow the same rule, so stale trust can’t survive silently.',
		],
		[
			'Which coding agents work with it?',
			'Any of them. The contract is plain JSON on stdout plus a localhost HTTP server. Syneva ships as a pi package, and Claude Code, Codex, Cursor or a shell script can drive the standalone CLI.',
		],
		[
			'Can I use the plan desk today?',
			'The dedicated plan desk is a prototype. You can already open a plan with <code>syneva file plan.md</code> and comment line by line; the claim map shown here is not shipped yet.',
		],
		[
			'Where does my review live?',
			'On your machine, under <code>~/.syneva</code>. The desk binds to localhost by default and saves every decision between rounds. There is no hosted account and no telemetry.',
		],
	],
)}</section>`

export default {
	route: '/',
	title: 'Syneva: the review desk for code your agent wrote',
	description:
		'Your agent writes. You decide what ships. Syneva is a local, open-source review desk: read the diff in order, ask on the exact line, record a verdict on every change, and hand it back to your agent.',
	styles: ['home.css', 'circuit.css'],
	scripts: ['hero.js'],
	body: () =>
		[
			hero(),
			principles(),
			problem(),
			how(),
			chapters(),
			handoff(),
			compare(),
			facts(),
			local(),
			ctaBand({
				title: 'Keep the speed.<br>Keep the understanding.',
				text: 'Two commands to your first desk. Bring the agent you already use.',
			}),
			faq(),
		].join('\n'),
}
