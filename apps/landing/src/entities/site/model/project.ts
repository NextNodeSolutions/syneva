// The project's facts: where it stands, how to install and start Syneva, and
// where its source, history and issues live on GitHub.

// Where Syneva stands, fixed at build. `waitlist` while the CLI is not ready
// for anyone to install: every primary action asks for an email, and the
// setup guide and the install calls to action stay in the code but out of the
// site. `live` brings them back. Flipping it is the whole launch.
export type LaunchStage = 'waitlist' | 'live'
export const LAUNCH_STAGE: LaunchStage = 'waitlist'

export const INSTALL_COMMAND = 'npm install -g syneva'
// The runtime the published CLI requires (apps/syneva/package.json
// engines.node).
export const NODE_REQUIREMENT = 'Node 22+'
// Run inside a repository, it opens a desk over the working tree.
export const START_COMMAND = 'syneva'

export const REPO_URL = 'https://github.com/walid-mos/syneva'
// A file of the repository, as its main branch has it.
export const repoFile = (path: string): string =>
	`${REPO_URL}/blob/main/${path}`
// The agent contract's source, the one `syneva spec` prints.
export const CONTRACT_SOURCE_URL = repoFile('packages/contracts/src/spec.ts')
// Every commit, newest first.
export const COMMITS_URL = `${REPO_URL}/commits/main`
// Where questions, gaps and bugs go.
export const ISSUES_URL = `${REPO_URL}/issues`
