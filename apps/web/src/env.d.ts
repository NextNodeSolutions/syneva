/// <reference types="@cloudflare/workers-types" />

// The Worker's env, by hand: no nextnode.toml service generates it (the pipeline does not know
// this Worker yet, AGENTS.md "Deploy: what the pipeline must learn"), so it is wrangler.jsonc's
// bindings and vars, kept in step with that file, plus the secrets the code reads: SESSION_SECRET,
// OPS_TOKEN and RESEND_API_KEY come from the `syneva` Infisical project on a deploy and from
// .dev.vars (gitignored) or `--var` locally, never from a config file.
interface Env {
	readonly DB: D1Database
	readonly USER_HUB: DurableObjectNamespace
	readonly ASSETS: Fetcher
	readonly RL_AUTH: RateLimit
	// A tab's upgrade, per person (auth/limits.ts).
	readonly RL_TABS: RateLimit
	// The web's own origin, as a browser reaches it: links in emails, the device page's URL, the
	// one authority the same-origin guard trusts.
	readonly SITE_URL: string
	// `log` prints the magic link on stdout instead of sending it (local development only).
	readonly MAIL_TRANSPORT?: 'log' | undefined
	readonly RESEND_API_KEY?: string | undefined
	// Keys the session digests (HMAC-SHA256): a database dump alone forges no session.
	readonly SESSION_SECRET: string
	// control-center's Bearer on the ops routes (RFC 6.5), 32 random bytes.
	readonly OPS_TOKEN: string
}

// Baked in by scripts/build.mjs (tsdown's define): the CLI's version, the build's id (the commit
// a deploy builds, else the build time) and when it was built.
declare const SYNEVA_VERSION: string
declare const SYNEVA_BUILD_ID: string
declare const SYNEVA_BUILT_AT: string
