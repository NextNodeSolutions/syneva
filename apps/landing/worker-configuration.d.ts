/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
	interface Env {
		readonly ASSETS: Fetcher
		readonly D1_DATABASE_ID: string
		readonly DB: D1Database
		readonly RL_SUBSCRIBE: RateLimit
		readonly SITE_URL: string
	}
}

interface Env extends Cloudflare.Env {}
