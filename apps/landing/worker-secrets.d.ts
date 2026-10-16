// The Worker's secrets come from the repository's Infisical project, synced
// on every deploy, not from nextnode.toml: worker-types generates the bindings
// and vars only, so the secrets the code reads are typed here.
declare namespace Cloudflare {
	interface Env {
		readonly RESEND_API_KEY: string
	}
}
