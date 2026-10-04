// The project's facts: how to install and start Syneva, and where its
// source, history and issues live on GitHub.
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
