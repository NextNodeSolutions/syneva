// The system model's part of the guide spec (spec-guide.ts splices it in): its fields, its authoring rule and an example.
export const MODEL_FIELD_SPEC = `- model? - the system the domains change, drawn on the desk's overview (the visual level the
  reviewer opens on) before any code: { elements: [element] (1..60), relations?: [relation]
  (≤ 120), views?: [view] (≤ 12) }. Left out of a post, the desk keeps the model it has.
  - element: { id, kind, label (≤ 120), description? (≤ 1000), technology? (≤ 120), parent?,
    change?, domains? }; kind "actor" (a person or role) | "system" | "ui" | "service" |
    "component" | "store" (a database, a cache, a bucket) | "queue" | "external" (a third
    party). \`parent\` names the element it sits in (drawn inside it, ≤ 3 levels deep);
    \`domains\` names the guide's domains that change it: picking a domain lights its elements
    up, and an element leads to its domains.
  - relation: { from, to, label?, technology?, change? } between two elements, neither inside the
    other.
  - view (a dynamic view: one path through the model told as numbered steps, a checkout, a webhook
    arriving): { id, title, description?, domains?, steps: [{ from, to, label, change? }] (1..30) }.
  \`change\` marks what the changeset does to an element, a relation or a step, as in blocks.`

export const MODEL_RULE_SPEC = `- Draw the system once: a \`model\` holds the parts the changeset touches and the parts they talk to
  (a handful to a few dozen elements, never one per file), each changed element naming its
  domains, and a view for each path the change alters end to end. It is what the reviewer reads
  first: the model and the critical spans alone should tell what changed and where it can break.`

export const MODEL_EXAMPLE_SPEC = `A model: the checkout path a payment change runs through, its new webhook as a view:
{"model":{"elements":[{"id":"buyer","kind":"actor","label":"Buyer"},
   {"id":"shop","kind":"system","label":"Shop"},
   {"id":"web","kind":"ui","label":"Checkout page","parent":"shop","technology":"React"},
   {"id":"api","kind":"service","label":"Orders API","parent":"shop","change":"changed","domains":["charge"]},
   {"id":"db","kind":"store","label":"Orders","parent":"shop","technology":"Postgres"},
   {"id":"stripe","kind":"external","label":"Stripe"}],
 "relations":[{"from":"buyer","to":"web","label":"pays"},{"from":"web","to":"api","label":"POST /orders"},
   {"from":"api","to":"stripe","label":"create intent","change":"changed"},{"from":"api","to":"db","label":"writes"}],
 "views":[{"id":"webhook","title":"Payment confirmed","domains":["charge"],
   "steps":[{"from":"stripe","to":"api","label":"payment_intent.succeeded","change":"added"},
            {"from":"api","to":"db","label":"mark order paid","change":"added"}]}]}}`
