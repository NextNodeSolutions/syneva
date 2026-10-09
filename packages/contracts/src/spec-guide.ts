// The guide's section of the agent contract (spec.ts splices it in): the schema an agent writes to, its limits, and the examples it can start from.
export const GUIDE_SPEC = `## The guide - a risk-ranked explanation of the changeset
A guide is the review's reading order AND its explanation: the coherent behaviors the changeset
changes ("domains"), highest risk first, each owning its changed code across files and explaining
itself in the form that fits it. You write it (Syneva runs no model), Syneva validates it, resolves
it against the real diff and renders it beside the real code; the reviewer's decisions, comments
and Send are never affected by it. A repo or pr desk opens with it (\`syneva open … --guide <file>\`;
without one the open is refused, GUIDE_REQUIRED, unless the session's saved guide still fits the
source or there is nothing to review); a file desk takes one optionally. Swap it with
\`syneva reload --guide <new>\` after your edits (one desk only - see Between rounds). Write the
file OUTSIDE the working tree (temp or gitignored): working mode surfaces untracked files, so an
in-repo guide shows as a stray addition. Validation refuses a guide naming the field and what it
wanted - fix the field, never pad the guide.

### Guide JSON schema (format "syneva-guide/2")
One JSON object:
- format (required) - exactly "syneva-guide/2". The retired file-grouping format is refused, not adapted.
- source (required) - the review source the guide was written against: { mode: "repo"|"file"|"pr",
  fingerprint, head?, base?, staged?, path? }. Copy \`mode\` and \`fingerprint\` from the inventory
  (below) of exactly the source you open; the desk refuses a guide whose fingerprint is not the
  diff it opens, so references are never read against another revision.
- overview (required, ≤ 3000 chars, Markdown) - what the changeset does and why, in a short paragraph.
- domains (required array, ≤ 60; empty only on an empty changeset) - one per coherent changed
  behavior, NOT per folder or file:
  - id (required) - stable identity ([A-Za-z0-9][A-Za-z0-9._:-]*, ≤ 80): feedback and the reviewer's
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
  - members (required, 1..400) - the changed code this domain OWNS, one primary owner per changed
    unit across the whole guide: { kind: "change", path, side, lineNumber, endLine? } names a
    changed block by any line of it on its side ("additions" = the new file, "deletions" = the old
    one, 1-based file lines, never rendered-diff numbers); { kind: "file", path } owns a file
    operation without a text block (a pure rename, an untracked addition, a hunk-less deletion).
  - references? (≤ 60) - code the explanation points at: { id, path, side, lineNumber, endLine?,
    role: "changed"|"context", label? }. "changed" points into changed code (this domain's or
    another's); "context" points at supporting UNCHANGED code on the reviewed revision - read-only
    for the reviewer, never a change to approve.
  - related? - [{ domainId, note? }]: another domain this one touches without owning its code.
  - evidence? (≤ 12) - [{ text, refs? }]: the facts the risk rests on, each citing reference ids
    when it can; a claim without refs reads as your word alone.
  - unknowns? (≤ 12) - what you could not establish; say so rather than guess.
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
    Every \`ref\` names one of the domain's references, every edge end a declared node. A ref'd
    element is what the reviewer clicks to land on the code.
  - order? - the tie order among domains of the same risk.
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
  contentHash, title }. A member or a reference names a block by any line of lineNumber..endLine on
  its side; \`key\` (path:stableKey) is what verdicts and the unassigned list name.
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
A later \`syneva reload\` never rewrites the guide. It re-reads the diff and marks what no longer
holds: a domain whose owned code, cited context or file operation changed is stale (with its
reasons), its dependents through \`prerequisites\` are stale too, a reference reads stale (the cited
code changed) or unresolved (gone), and changes no domain owns are listed as unassigned - pending,
visible in Other, never hidden. Verdicts keep their own hash-based rule (a rewritten block resets to
pending); a stale explanation changes no verdict. Supply a fresh guide (\`syneva reload --guide\`)
authored against the new inventory to clear it: a replacement is validated the same way and, when
refused, leaves the desk, its guide and every verdict as they were.

### Feedback on domains
From the explanation pane the reviewer asks and requests changes on a domain, or on one of its
blocks, without leaving it. A question reaches you as a question event with anchor "domain" (answer
it with \`syneva comment --domain <id> [--block <id>]\`; the correspondent does on a Pi attachment),
a change request rides the Send as \`domainRequests\`, both carrying the target's title and the code
it pointed at when written. Threads stay with their domain and block ids across guide replacements
(keep the ids when you regenerate); a target a new guide drops is marked unanchored with its
context kept, never re-pointed. Resolving a thread or reading an explanation approves nothing.

### Authoring a guide - the workflow
1. Take the inventory of exactly the source you will open - same mode, target and flags
   (\`syneva inventory …\`). It is the input: its files and units are the changed code, its
   fingerprint goes into \`source\`. Never author from another diff (a working-tree diff for a pr
   open, another base, another revision): references would land on other lines, and the open
   refuses a fingerprint that is not the desk's.
2. Write the guide outside the working tree, then open with it (\`syneva open … --guide <file>\`).
   A refusal names the field and what it wanted: fix that field.
3. Read the reviewer's feedback through the review loop (verdicts and comments land on the code the
   domain owns; a question about a domain reaches you like any question).
4. After you change code a domain owns or context it cites, take the inventory again and reload
   with an updated guide (\`syneva reload --guide <new>\`, same domain ids): nothing refreshes a
   guide for you - a plain reload only marks what went stale. Nothing here runs a model or a
   worker; every step is yours.

### Authoring a guide - the rules
- Group by changed behavior, across files: one domain per coherent behavior the changeset changes,
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
  behavioral difference, "prose" when a paragraph says it best. No form is required, a diagram is
  not expected everywhere, and the same long template in every domain is wrong: a one-line change
  gets a sentence.
- Reference the facts: the key claims of an explanation and every diagram element that stands for
  code carry a \`ref\` the reviewer can click; a claim without one reads as your word. Keep the
  first read short (summary, consequence, a block or two) and put the long reasoning in
  \`detail\`. Separate facts (what the code does, cited), assumptions (what you believe without a
  citation - say so) and rationale (why the change is right). Always say what the reviewer should
  verify. Never write that code is approved, tested or checked unless the guide cites the evidence
  (the test, the run): the reviewer approves, the guide explains.

### Examples
A domain spanning two files, pointing at supporting context:
{"format":"syneva-guide/2","source":{"mode":"repo","fingerprint":"5b3d9c0a1e2f4a6b"},
 "overview":"Rate limiting moves from a per-process counter to the shared store so every worker sees the same budget.",
 "domains":[{"id":"shared-rate-limit","title":"Shared rate limit budget","risk":"high",
   "consequence":"A misread budget lets a burst through on every worker at once, or blocks everyone when one worker trips.",
   "summary":"The limiter reads and writes its counter in the shared store instead of memory.",
   "verify":"The decrement and the check happen in one store round trip.",
   "members":[{"kind":"change","path":"src/limit/limiter.ts","side":"additions","lineNumber":12},
              {"kind":"change","path":"src/limit/store.ts","side":"additions","lineNumber":40,"endLine":58}],
   "references":[{"id":"check","path":"src/limit/limiter.ts","side":"additions","lineNumber":12,"role":"changed","label":"the check"},
                 {"id":"budget-type","path":"src/limit/types.ts","side":"additions","lineNumber":4,"endLine":9,"role":"context","label":"Budget shape"}],
   "evidence":[{"text":"The old counter was a module-level Map, one per worker.","refs":["check"]}],
   "blocks":[{"id":"flow","kind":"flow","title":"Where the budget lives now",
     "nodes":[{"id":"req","label":"Request"},{"id":"lim","label":"limiter.check()","ref":"check"},{"id":"store","label":"Shared store"}],
     "edges":[{"from":"req","to":"lim"},{"from":"lim","to":"store","label":"DECR budget"}]}]}]}

Two independent behaviors in one file (distinct blocks of src/api/users.ts):
{"format":"syneva-guide/2","source":{"mode":"pr","fingerprint":"9f1e2d3c4b5a6978","base":"origin/main"},
 "overview":"Users API: the create path validates emails, and the list path pages by cursor.",
 "domains":[
  {"id":"email-validation","title":"Email validation on create","risk":"medium",
   "consequence":"An invalid address is accepted and the welcome mail bounces.",
   "summary":"POST /users rejects malformed emails before the insert.",
   "members":[{"kind":"change","path":"src/api/users.ts","side":"additions","lineNumber":22,"endLine":31}],
   "blocks":[{"id":"what","kind":"prose","markdown":"The check runs **before** the insert, so a rejected request leaves no row."}]},
  {"id":"cursor-paging","title":"Cursor paging on list","risk":"low",
   "consequence":"A page boundary skips or repeats a user.",
   "summary":"GET /users pages by the last seen id instead of an offset.",
   "members":[{"kind":"change","path":"src/api/users.ts","side":"additions","lineNumber":70,"endLine":92},
              {"kind":"change","path":"src/api/users.ts","side":"deletions","lineNumber":64}],
   "blocks":[]}]}

A prose-only domain (no diagram, no references):
{"id":"copy","title":"Button copy","risk":"low","consequence":"A label reads wrong; nothing breaks.",
 "summary":"Three labels change wording.","members":[{"kind":"change","path":"src/ui/labels.ts","side":"additions","lineNumber":3}],
 "blocks":[{"id":"p","kind":"prose","markdown":"Sentence case, matching the rest of the desk."}]}

A state diagram whose elements reach the code:
{"id":"desk-lifecycle","title":"Desk lifecycle","risk":"critical",
 "consequence":"A desk closed while a Send is queued loses the round.",
 "summary":"Closing now drains the queue before the desk leaves the hub.",
 "members":[{"kind":"change","path":"src/hub.ts","side":"additions","lineNumber":114,"endLine":128}],
 "references":[{"id":"drain","path":"src/hub.ts","side":"additions","lineNumber":118,"role":"changed","label":"drain()"},
               {"id":"grace","path":"src/hub.ts","side":"additions","lineNumber":25,"role":"context","label":"the grace period"}],
 "blocks":[{"id":"states","kind":"state",
   "states":[{"id":"live","label":"Live","isInitial":true},{"id":"closing","label":"Closing","ref":"drain"},{"id":"gone","label":"Gone","isFinal":true}],
   "transitions":[{"from":"live","to":"closing","label":"close()"},{"from":"closing","to":"gone","label":"after grace","ref":"grace"}]}]}

An empty changeset:
{"format":"syneva-guide/2","source":{"mode":"repo","fingerprint":"e3b0c44298fc1c14"},
 "overview":"Nothing to review yet: the desk waits for the next reload.","domains":[]}`
