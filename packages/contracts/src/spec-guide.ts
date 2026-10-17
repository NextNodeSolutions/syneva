// The guide's section of the agent contract (spec.ts splices it in): the schema an agent writes to, its limits, and the examples it can start from.
import { GUIDE_EXAMPLES_SPEC } from './spec-guide-examples.js'
import { MODEL_FIELD_SPEC, MODEL_RULE_SPEC } from './spec-guide-model.js'

// A domain's fields and the authoring rules are their own constants: the spec prints them once, and every code packet an agent explains a domain from (guide-authoring.ts) carries the same text.
export const DOMAIN_FIELDS_SPEC = `  - id (required) - stable identity ([A-Za-z0-9][A-Za-z0-9._:-]*, ≤ 80): feedback and the reviewer's
    position key on it across guides of the same changeset - keep it when you regenerate.
  - title (required, ≤ 120).
  - risk (required) - "critical" | "high" | "medium" | "low". Syneva sorts by it, never reorders
    otherwise: ties follow \`order\` (ascending), then array position; prerequisites never move a
    domain down.
  - consequence (required, ≤ 1000) - the concrete failure if this behavior is wrong: who or what
    breaks, not the risk word again.
  - summary (required, ≤ 1000) - the minimum context: what the behavior is for.
  - verify? (≤ 1000) - what the reviewer should check with their own eyes.
  - prerequisites? - ids of domains to read first (summarized beside this one).
  - members (1..400; optional on a posted domain - see Laying a guide over the desk) - the changed
    code this domain OWNS, one primary owner per changed unit across the whole guide:
    { kind: "change", path, side, lineNumber, endLine? } names a changed block by any line of it on
    its side ("additions" = the new file, "deletions" = the old one, 1-based file lines, never
    rendered-diff numbers); { kind: "symbol", path, symbol } every changed block of a declaration
    (a unit's symbol.name; a class takes its members); { kind: "domain", id } every block the
    desk's current domain of that id owns; { kind: "file", path } a file operation without a text
    block (a pure rename, an untracked addition, a hunk-less deletion). The desk stores "symbol"
    and "domain" members as the "change" members they cover.
  - references? (≤ 60) - code the explanation points at: { id, path, side, lineNumber, endLine?,
    role: "changed"|"context", label? }. "changed" points into changed code (this domain's or
    another's); "context" points at supporting UNCHANGED code on the reviewed revision - read-only
    for the reviewer, never a change to approve.
  - related? - [{ domainId, note? }]: another domain this one touches without owning its code.
  - evidence? (≤ 12) - [{ text, refs? }]: the facts the risk rests on, each citing reference ids
    when it can; a claim without refs reads as your word alone.
  - unknowns? (≤ 12) - what you could not establish; say so rather than guess.
  - critical? (≤ 8) - [{ ref, why }]: the few changed spans the reviewer must read line by line
    whatever the diagrams say: money moving (a charge, a refund, an amount's unit), access granted
    (auth, permissions, tokens), data destroyed or exposed (a migration, a delete, a query's
    scope). \`ref\` names one of the domain's "changed" references, \`why\` (≤ 1000) what a wrong
    line there costs. The desk's visual level shows these spans as code and nothing else.
  - blocks (required, 0..12) - the explanation, in YOUR order and YOUR choice of form; every block
    has id (unique in the domain), title?, refs? (reference ids), detail? (≤ 20000, Markdown,
    collapsed until opened: longer reasoning, assumptions, failure cases) and a kind:
    - "prose": { markdown } (≤ 20000). Enough for a simple domain.
    - "before-after": { before: { label?, markdown, ref? }, after: { label?, markdown, ref? } }.
    - "state": { states: [{ id, label, ref?, isInitial?, isFinal? }] (1..40),
      transitions: [{ from, to, label?, ref? }] (≤ 80) }.
    - "sequence": { participants: [{ id, label }] (1..40), steps: [{ from, to, label, ref? }] (1..80) }.
    - "flow" (dependency / data flow): { nodes: [{ id, label, ref?, note? }] (1..40),
      edges: [{ from, to, label? }] (≤ 80) }.
    - "data-model" (tables, types, documents): { entities: [{ id, label, ref?, change?,
      fields?: [field] (≤ 30) }] (1..40), relations?: [{ from, to, label?, cardinality?, change? }]
      (≤ 80) }; a field is { name, type?, change?, note?, ref? }; cardinality "1-1" | "1-n" |
      "n-1" | "n-n".
    - "api" (routes, events, commands): { endpoints: [{ id, method, path, summary?, change?,
      ref?, request?: [field], response?: [field] }] (1..20) }; method "GET" | "POST" | "PUT" |
      "PATCH" | "DELETE" | "EVENT" | "COMMAND" | "RPC".
    - "wireframe" (a screen the change touches): { surface?: "desktop" | "mobile" | "panel" |
      "dialog", before?: element, after: element }; an element is { el, label?, change?, ref?,
      children?: [element] } (≤ 80 per sketch, ≤ 8 deep), el one of screen, header, sidebar, main,
      footer, row, column, card, dialog, tabs, list, item, table (containers) or title, text,
      button, input, select, checkbox, image, badge, toast, divider. Leave \`before\` out for a new
      screen.
    \`change\` ("added" | "changed" | "removed") marks what the change does to an entity, a field,
    a relation, an endpoint or an element; left out, it is unchanged context drawn for orientation.
    Every \`ref\` names one of the domain's references, every edge end a declared node. A ref'd
    element is what the reviewer clicks to land on the code.
  - order? - the tie order among domains of the same risk.`

export const AUTHORING_RULES_SPEC = `- Group by changed behavior, across files: one domain per coherent behavior the changeset changes,
  never per folder or file; two independent behaviors in one file are two domains. Every changed
  unit has exactly one owning domain - shared context is a "context" reference or a \`related\`
  entry, never a second owner. Own the operations without text too (a rename, an untracked
  addition, a hunk-less deletion) as \`file\` members.
- Rank by risk from consequences: say what breaks and for whom (which users, data, money,
  availability), how far the change reaches (one path, every request, every worker) and cite the
  code that shows it (\`evidence\` with refs). Keep impact and uncertainty apart: what you could not
  establish goes in \`unknowns\`, never into a lower risk; no numbers you cannot back (no
  "95% safe", no severity scores). Highest risk first; a domain the reviewer needs another read
  for names it in \`prerequisites\` - that one is summarized beside it, so keep the dependency to
  what the reviewer must know.
- Choose the form by what it explains: "state" for transitions, "sequence" for the order of
  exchanges between participants, "flow" for dependencies and data movement, "before-after" for a
  behavioral difference, "data-model" when tables or types change, "api" when a contract a caller
  depends on changes, "wireframe" when what a user sees changes, "prose" when a paragraph says it
  best. No form is required, a diagram is not expected everywhere, and the same long template in
  every domain is wrong: a one-line change gets a sentence.
${MODEL_RULE_SPEC}
- Mark what must be read as code: a span goes in \`critical\` when one wrong line there costs money,
  access or data and no diagram can show it is right. Keep it rare (most domains have none) and
  tight (the lines that decide, not the whole file): a critical list that grows to cover the
  domain says nothing.
- Reference the facts: the key claims of an explanation and every diagram element that stands for
  code carry a \`ref\` the reviewer can click; a claim without one reads as your word. Keep the
  first read short (summary, consequence, a block or two) and put the long reasoning in
  \`detail\`. Separate facts (what the code does, cited), assumptions (what you believe without a
  citation - say so) and rationale (why the change is right). Always say what the reviewer should
  verify. Never write that code is approved, tested or checked unless the guide cites the evidence
  (the test, the run): the reviewer approves, the guide explains.`

export const GUIDE_SPEC = `## The guide - a risk-ranked explanation of the changeset
A guide is the review's reading order AND its explanation: the coherent behaviors the changeset
changes ("domains"), highest risk first, each owning its changed code across files and explaining
itself in the form that fits it. Syneva runs no model: a repo or pr desk (guided by default) opens
on a DRAFT of its guide drawn from the code's structure - domains grouped by the declarations the
changeset touches and the references between them, named, ranked and summarized mechanically,
marked Draft on the desk - and you EXPLAIN it (the workflow below). Syneva validates what you post,
resolves it against the real diff and renders it beside the real code; the reviewer's decisions,
comments and Send are never affected by it. \`--no-guide\` opens a plain review on purpose; a file
desk takes a guide optionally (\`--guide <file>\`), never a draft. Keep guide files OUTSIDE the
working tree (the CLI writes its own under the OS temp folder): working mode surfaces untracked
files, so an in-repo guide shows as a stray addition. Validation refuses a guide naming the field
and what it wanted - fix the field, never pad the guide.

### Guide JSON schema (format "syneva-guide/2")
One JSON object:
- format (required) - exactly "syneva-guide/2". The retired file-grouping format is refused, not adapted.
- source (required) - the review source the guide was written against: { mode: "repo"|"file"|"pr",
  fingerprint, head?, base?, staged?, path? }. The guide.json the CLI writes carries it; from
  scratch, copy \`mode\` and \`fingerprint\` from the inventory (below) of exactly the source you
  open. The desk refuses a guide whose fingerprint is not its diff's, so references are never read
  against another revision.
- overview (required, ≤ 3000 chars, Markdown) - what the changeset does and why, in a short paragraph.
- domains (required array, ≤ 60; empty only on an empty changeset) - one per coherent changed
  behavior, NOT per folder or file:
${DOMAIN_FIELDS_SPEC}
${MODEL_FIELD_SPEC}
- baseDiffHash - stamped by the desk on attach; leave it out.
Unknown keys anywhere are refused by name: nothing you write is silently ignored.

Empty changeset: a guide over nothing to review has \`"domains": []\` and an overview that says so;
domains over an empty diff are refused. Coverage: every changed unit of the diff needs exactly one
owning domain - a unit two domains own, or none, is refused naming the unit (its key is the
inventory's). Rendering never fabricates: a domain without blocks shows its summary and verdict
controls, nothing else.

### The inventory - what to author against
\`syneva inventory [file <path> | pr <ref>] [--diff staged] [--path <p>] [--session <id>]\` prints the
review source as JSON (ReviewInventory), for the same flags an open takes - no desk opens, nothing
is persisted, nothing is checked out (a hub starts when none runs; a PR head is fetched and read
by ref):
- format "syneva-inventory/1", mode, root, session, head, base?, staged, path?
- fingerprint - hash of the mode, the source and every file's and unit's content identity: copy it
  into guide.source.fingerprint. Two inventories with the same fingerprint are the same review.
- files[] - { path, oldPath?, newPath?, changeKind, contentHash, hasHunks, renamePure, added, removed }
- units[] - the changed text blocks: { key, path, side, lineNumber, endLine, removed, added,
  contentHash, title, symbol?, trivia? }. A member or a reference names a block by any line of
  lineNumber..endLine on its side; \`key\` (path:stableKey) is what verdicts and the unassigned
  list name. \`symbol\` ({ name, kind }) is the declaration the block sits in, for TS/JS and
  Markdown (a function, \`Class.method\`, a type, a top-level call such as \`describe("x")\`, a
  heading's section) - group by it instead of re-reading the diff; \`trivia\` is "comment" or
  "import" when the block changes only comments, or only imports and exports.
- fileUnits[] - the paths with no text block (a pure rename, an untracked addition): each needs a
  { kind: "file", path } member.
On a live desk, GET /api/desks/<id>/inventory answers the same for its current diff; the hub answers
POST /api/hub/inventory with an open's body (no guide) for any source.

### Resolution and staleness
On attach the desk resolves the guide against its inventory and refuses it (422 INVALID_GUIDE,
naming every field at fault) when the fingerprint or mode differs, a member names no changed block,
a unit has two owners or none, a file operation is unowned, or a reference does not land ("changed"
on a changed block of that side; "context" on lines that exist on the reviewed revision - reads are
confined to the repository and bounded). What resolved is kept with the guide: each domain's owned
units and each reference's content identity at attach (state.guideResolution).
A later \`syneva reload\` never rewrites your words. It re-reads the diff, draws the drafts again
over the code no explained domain owns, and marks what no longer holds: a domain whose owned code, cited context or file operation changed is stale (with its
reasons), its dependents through \`prerequisites\` are stale too, a reference reads stale (the cited
code changed) or unresolved (gone), and on a desk without drafts (a file desk) changes no domain
owns are listed as unassigned - pending, visible in Other, never hidden. Verdicts keep their own hash-based rule (a rewritten block resets to
pending); a stale explanation changes no verdict. Post the domain's explanation again (\`syneva
reload --guide\` with the guide.json that reload wrote) to clear it: a post is validated the same
way and, when refused, leaves the desk, its guide and every verdict as they were.

### Feedback on domains
From the explanation pane the reviewer asks and requests changes on a domain, or on one of its
blocks, without leaving it. A question reaches you as a question event with anchor "domain" (answer
it with \`syneva comment --domain <id> [--block <id>]\`; the correspondent does on a Pi attachment),
a change request rides the Send as \`domainRequests\`, both carrying the target's title and the code
it pointed at when written. Threads stay with their domain and block ids across guide replacements
(keep the ids when you regenerate); a target a new guide drops is marked unanchored with its
context kept, never re-pointed. Resolving a thread or reading an explanation approves nothing.

### Laying a guide over the desk
A posted guide (\`--guide\`) is laid over the desk's current one, draft included: a domain it names
takes its words; a domain it leaves out stays as it is (a draft stays a draft). A posted domain
without \`members\` keeps the blocks the desk's domain of the same id owns; members it lists join
it, taken from whichever domain owned them (taking every block of a domain removes it). A draft
posted with new words is explained; one posted unchanged stays a draft; draft words over code that
changed hands are drawn again. A stale domain posted, its words changed or not, is taken as
explaining the code as it is now - post it once you checked it. The result still needs one owner
per changed unit, and its \`related\` and \`prerequisites\` must name its domains.

### Authoring a guide - the workflow
1. Open the desk (\`syneva open …\`). On a guided desk the CLI writes the guide to fill (stdout
   \`guide\`: a guide.json with the current fingerprint, the overview and only the domains waiting
   for words, without members - a domain the file leaves out stays as it is) and, per domain
   waiting for words (stdout \`pending\`: [{ id, reason: "draft"|"stale", packet }]), a
   Markdown packet: the domain's diff hunks, the declarations they change, the reference ids it
   may cite (a stale one names the references the code moved under). Read the packet, not the
   repository. \`overviewDrafted\` = the overview is Syneva's.
2. Explain each pending domain in guide.json - title, risk, consequence, summary, verify,
   evidence, blocks - and rewrite the overview. Regroup only where the draft is wrong: move a
   declaration with a "symbol" member, merge a domain in with a "domain" member, split one by
   giving a new domain the declarations it takes. Domains are independent: explain them in
   parallel (one subagent per packet), then post once.
3. Post: \`syneva reload --guide <guide.json>\`. A refusal names the field and what it wanted: fix
   that field. Every open and reload rewrites guide.json and the packets, so they always match the
   desk. To post in several passes, take out of the file the domains you have not checked yet.
4. Read the reviewer's feedback through the review loop (verdicts and comments land on the code the
   domain owns; a question about a domain reaches you like any question).
5. After you change code, \`syneva reload\`: drafts are drawn again over the code no explained
   domain owns, and an explained domain whose code moved comes back in \`pending\` as "stale" with
   its packet - explain it again the same way, same id.
Writing a whole guide yourself still works: take the inventory of exactly the source you open (same
mode, target and flags), give every domain its members, and open with \`--guide <file>\`.

### Authoring a guide - the rules
${AUTHORING_RULES_SPEC}

### Examples
${GUIDE_EXAMPLES_SPEC}`
