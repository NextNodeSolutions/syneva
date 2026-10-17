// The guide spec's examples (spec-guide.ts splices them in): whole guides and domains an agent can start from.
export const GUIDE_EXAMPLES_SPEC = `A domain spanning two files, pointing at supporting context:
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
