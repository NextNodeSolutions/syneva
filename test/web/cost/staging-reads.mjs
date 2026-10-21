// What a person reads after a staging run, for the parts no script can: the Analytics API.
// Printed after each test that ran against `--staging` (or with `--procedures`). Dataset and
// field names are the Cloudflare GraphQL Analytics API's as documented when this was written
// (RFC 0001, 6.4 says they were confirmed by introspection): verify them against the live schema
// first - `query { __schema { types { name } } }`, then `__type(name: ...) { fields { name } }`
// on the types whose names contain DurableObjectsPeriodicGroups and DurableObjectsInvocations.
const ENDPOINT = 'POST https://api.cloudflare.com/client/v4/graphql'
const AUTH =
	'Authorization: Bearer $CLOUDFLARE_API_TOKEN   (a token with Account Analytics: Read)'
const WAIT = 'Metrics lag: wait ten minutes after the run before reading.'

const periodic =
	fields => `query ($accountTag: string!, $from: Time!, $to: Time!) {
  viewer { accounts(filter: { accountTag: $accountTag }) {
    durableObjectsPeriodicGroups(limit: 1000,
        filter: { datetime_geq: $from, datetime_leq: $to }) {
      dimensions { datetimeMinute namespaceId }
      sum { ${fields} }
    } } } }`

const invocations = `query ($accountTag: string!, $from: Time!, $to: Time!) {
  viewer { accounts(filter: { accountTag: $accountTag }) {
    durableObjectsInvocationsAdaptiveGroups(limit: 1000,
        filter: { datetime_geq: $from, datetime_leq: $to }) {
      dimensions { datetimeMinute scriptName }
      sum { requests errors wallTime }
    } } } }`

const workerRequests = `query ($accountTag: string!, $script: string!, $from: Time!, $to: Time!) {
  viewer { accounts(filter: { accountTag: $accountTag }) {
    workersInvocationsAdaptive(limit: 1000,
        filter: { scriptName: $script, datetime_geq: $from, datetime_leq: $to }) {
      dimensions { datetimeMinute status }
      sum { requests errors subrequests }
    } } } }`

const edgeEvents = `query ($zoneTag: string!, $from: Time!, $to: Time!) {
  viewer { zones(filter: { zoneTag: $zoneTag }) {
    firewallEventsAdaptiveGroups(limit: 100,
        filter: { datetime_geq: $from, datetime_leq: $to }) {
      count
      dimensions { action source ruleId clientRequestHTTPHost }
    } } }       # a zone-scoped token (Analytics: Read)`

const logs = (
	from,
	to,
) => `POST https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/observability/telemetry/query
{ "queryId": "t8-count", "timeframe": { "from": "${from}", "to": "${to}" }, "view": "calculations",
  "parameters": { "datasets": ["cloudflare-workers"],
    "filters": [{ "key": "$metadata.service", "operation": "eq", "type": "string", "value": "<staging Worker name>" }],
    "calculations": [{ "operator": "count" }] } }
# the same count is Workers & Pages > the Worker > Logs > query, "count" over the window`

function reads(id, window) {
	const { from, to } = window
	const range =
		from && to ? `from ${from} to ${to}` : 'for the window the test printed'
	return (
		{
			T1: [
				[
					`active time of the objects over the hold (${range}); ${WAIT}`,
					periodic(
						'activeTime cpuTime exceededMemoryErrors storageWriteUnits',
					),
					'EXPECT: sum(activeTime) over the window < 5 s in all (the unit is in the schema: microseconds in the docs this was written from); storageWriteUnits 0',
				],
				[
					'object requests over the same window',
					invocations,
					'EXPECT: about one per socket opened plus the snapshot asks - a few hundred at most, not growing with the minutes held',
				],
			],
			T2: [
				[
					`the flood minute (${range}); ${WAIT}`,
					periodic('activeTime cpuTime exceededMemoryErrors'),
					'EXPECT: sum(activeTime) for the minute of the 1,000 frames/s flood < 2 s',
				],
			],
			T3: [
				[
					`Worker requests per minute (${range}); ${WAIT}`,
					workerRequests,
					'EXPECT: the minute of the storm < 1,000 requests (the edge rule answers the rest)',
				],
				[
					'the edge rule that answered (zone token)',
					edgeEvents,
					'EXPECT: a block/rate-limit action on the app hostname from the first seconds of the storm',
				],
			],
			T4: [
				[
					`the 30 s timeout and the oversize answer (${range}); ${WAIT}`,
					periodic('activeTime exceededMemoryErrors'),
					'EXPECT: active time about the relays themselves (30 s for the silent hub), idle in the minutes after; exceededMemoryErrors 0',
				],
			],
			T5: [
				[
					`the concurrent streams (${range}); ${WAIT}`,
					periodic('activeTime exceededMemoryErrors'),
					'EXPECT: exceededMemoryErrors 0 for the window',
				],
			],
			T6: [
				[
					`the drained objects (${range}); ${WAIT}`,
					periodic('activeTime'),
					'EXPECT: no active time once drained, until the clients come back',
				],
			],
			T7: [
				[
					`object requests across the deploy (${range})`,
					invocations,
					'EXPECT: about one request per reconnecting socket (6 here) per backoff step, no spike of repeated attempts',
				],
			],
			T8: [
				[
					`Workers Logs events for the hold (${range}); ${WAIT}`,
					logs(from ?? '<start>', to ?? '<end>'),
					'EXPECT: < 100 events for an hour of the T1 traffic, 0 for the minute T3 stormed',
				],
			],
			T9: [
				[
					`Worker invocations for the loads (${range}); ${WAIT}`,
					workerRequests,
					`EXPECT: the delta is the page-shell requests (${window.pageRequests ?? 'shells x 50'}) and nothing for the 200 asset requests; Workers & Pages > the Worker > Metrics, "Static asset requests", shows the assets apart`,
				],
			],
			T10: [
				[
					`Worker invocations while the rule is active; ${WAIT}`,
					workerRequests,
					'EXPECT: invocations stop moving while the rule is up (only /bridge/v1/ops/* get through)',
				],
				[
					'the rule hits (zone token)',
					edgeEvents,
					'EXPECT: block events on the app hostname while the rule was up; none after its deletion',
				],
			],
		}[id] ?? []
	)
}

export function printReads(ctx, id, window = {}) {
	if (!ctx.staging && !ctx.options.procedures) return
	const out = []
	out.push(`\nreads for ${id} (a person's, on the Analytics API):`)
	out.push(`  ${ENDPOINT}`)
	out.push(`  ${AUTH}`)
	out.push(
		'  variables: accountTag = <account id>, script = <staging Worker name>, from/to as printed above',
	)
	for (const [at, [what, query, expect]] of reads(id, window).entries()) {
		out.push(`\n  ${at + 1}. ${what}`)
		out.push(...query.split('\n').map(line => `       ${line}`))
		out.push(`     ${expect}`)
	}
	process.stdout.write(`${out.join('\n')}\n`)
}

// The WAF rule T10 creates and removes through the API, as steps.
export const EDGE_STAGE_STEPS = host => [
	"1. List the zone's custom-rule entrypoint ruleset (it may not exist yet):",
	'     curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \\',
	'       https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/phases/http_request_firewall_custom/entrypoint',
	'2. Create the block rule (RFC 6.5, edge stage): every request to the app hostname except /bridge/v1/ops/*:',
	'     curl -s -X POST -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "content-type: application/json" \\',
	'       https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/$RULESET_ID/rules \\',
	`       -d '{"action":"block","description":"syneva breaker, edge stage (drill)","expression":"(http.host eq \\"${host}\\" and not starts_with(http.request.uri.path, \\"/bridge/v1/ops/\\"))"}'`,
	'     (no entrypoint yet: PUT the same rule inside {"rules":[...]} to .../rulesets/phases/http_request_firewall_custom/entrypoint)',
	'   Note the rule id in the answer.',
	'3. Confirm the edge answers 403 (not the Worker):',
	`     curl -si https://${host}/api/hub/health | head -1          # 403`,
	`     curl -si -H "authorization: Bearer $OPS_TOKEN" https://${host}/bridge/v1/ops/status | head -1   # 200`,
	'4. Delete it (the same way the agent does):',
	'     curl -s -X DELETE -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \\',
	'       https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/$RULESET_ID/rules/$RULE_ID',
]
