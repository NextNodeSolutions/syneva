// The events an agent receives, the ReviewResult a Send carries and how to act on it (spec.ts splices it in).
export const EVENTS_SPEC = `## Events
await yields exactly one:
- {"kind":"question","question":{path,lineNumber,side,body,mode,session},"questions":[…]} -
  reviewer wants an answer NOW. \`questions\` holds every question batched into this delivery
  (arrival order; \`question\` is the oldest, kept for compatibility). On a Pi attachment, the
  desk correspondent answers the batch (see Question routing); do not duplicate its work in
  the owner session. A question wants
  an ANSWER, not a code change: answering is READ-ONLY - read for context, reply with \`syneva
  comment\` at path/lineNumber/side, and NEVER edit tracked files (the "Between rounds" rule) unless
  the question's own text asks for a change (then edit + \`syneva reload\`). lineNumber 0 (anchor
  "file") = a whole-file question asked from the file header - reply with \`syneva comment --path
  <f> --line 0 --body "…"\`. A question may be on the guide instead of a line: {"anchor":"domain",
  domainId, blockId?, domainTitle, blockTitle?, guideFingerprint, refs:[{path,side,lineNumber,
  endLine?,label?}], body, mode, session} - no path or line; answer it read-only from the code
  \`refs\` name and the explanation, with \`syneva comment --domain <id> [--block <id>]\`. Questions
  are a live side-channel - never in a Send/ReviewResult except openQuestions below. Slow answer →
  post \`syneva status\` lines so the human sees progress.
- {"kind":"review","result":{…ReviewResult…}} - reviewer clicked Send. Act on result.
- {"kind":"closed","session":...} - the reviewer ended the review (the desk's Close, ⇧Q, or the
  dashboard's Close). The desk leaves the hub right after emitting it, so no await will ever
  answer again: end your round and DON'T reopen the desk yourself (reopen/reattach only when the
  human asks). A Send queued but never picked up live still left artifacts.resultJson (file-poll
  fallback); all review state is saved, and a later \`syneva open --session\` restores it. A Pi
  attachment deals with closed internally - it auto-detaches and notifies the session.

## ReviewResult
The \`result\` field of a review event:
- session, repoRoot, mode, staged, head (sha|null), baseDiffHash (hash of the reviewed diff)
- accepted[], rejected[]: {path, lineNumber, side, title}
- requestedChanges[]: {path, lineNumber, side, body} - the edit to make per request (lineNumber 0
  + anchor "file" = a whole-file request from the file header: apply it to that file as a whole).
- overallNote? - optional note about the WHOLE review (absent if blank): an overall remark, or an
  afterthought instruction for after applying (e.g. "run the formatter"). Not tied to any line.
- domainRequests[]: {domainId, blockId?, domainTitle, blockTitle?, guideFingerprint, refs[], body} -
  change requests on the guide's domains or blocks: the reviewer challenged an explanation or asked
  for a behavior change from the explanation pane. Act on the behavior (\`refs\` is the code the
  target pointed at), refresh the guide if the explanation was wrong (reload --guide), then answer in
  the thread with \`syneva comment --domain\`.
- stagedFiles[], approvedFiles[]
- openQuestions[]: {path,lineNumber,side,body,mode,session}, or the domain shape of a question event
  (anchor "domain") - questions you never answered, folded into this Send (superseding queued live
  question events). Answer each with \`syneva comment\` (READ-ONLY, as a live question) while acting
  on the round.
- artifacts: {resultJson, sessionDir} under ~/.syneva/<repoHash>/<session>/ (repoHash =
  sha256(abs repo root)[:16])
The arrays above ARE the review - act on them directly; there's no prose summary to parse.
Each changed file ends pending | approved (no objections → listed in approvedFiles) |
changes-requested (a rejected hunk and/or a requested change).
File-poll fallback (can't hold a long-poll): every Send (over)writes the same ReviewResult to
artifacts.resultJson - watch sessionDir, read the newest *-result.json (new mtime = new Send).
Live questions arrive only via await, so a file-poller sees Sends but not Asks.

## How to act on a review - one path per item, don't mix
- rejected → revert that change; the reviewer doesn't want it.
- requestedChanges (a comment) → make the edit at path:lineNumber; lineNumber 0 (anchor "file")
  = a whole-file request - apply it to that file as a whole, wherever it belongs.
- accepted → leave it; don't re-touch.
- approvedFiles → signed off as-is; leave the whole file unless a requested change forces a touch
  (which re-opens it for re-review).
- stagedFiles → already staged by the reviewer; don't touch unless a requested change requires it.
- domainRequests → the behavior the domain explains is what the reviewer wants changed (or its
  explanation was wrong): edit the code the refs name, reload (with a refreshed guide when the
  explanation changes), reply in the thread. A resolved thread approves nothing - the verdicts do.
In pr mode the diff is committed changes: amend the branch/commits to apply the review, leaving
approved hunks as-is (rather than editing the working tree).
Then \`syneva reload\` to surface your edits. With the Pi attachment, return control; otherwise
run \`syneva await\` for the next round. When the round is fully handled and nothing needs the
reviewer's eyes anymore (no edits awaiting re-review, no open questions - e.g. a clean
all-approved send already committed to an empty diff), call \`syneva close\` in the same turn:
never end a round by asking the human "say done to close" - that buys an idle desk with one
whole LLM round-trip for nothing.`
