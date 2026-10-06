export type LaunchStage = 'waitlist' | 'live'
export const LAUNCH_STAGE: LaunchStage = 'waitlist'

export const INSTALL_COMMAND = 'npm install -g syneva'
export const NODE_REQUIREMENT = 'Node 22+'
export const START_COMMAND = 'syneva'

// What the project holds itself to, said wherever it signs off: the home's principles strip, the footer, the emails.
export const PRINCIPLES = [
	'Local by default',
	'Your agent, not ours',
	'No model inside Syneva',
	'Open source · MIT',
] as const
export const TAGLINE = 'Your agent writes. You decide.'
export const FOOTNOTE = 'No model inside · No telemetry · MIT'

export const REPO_URL = 'https://github.com/walid-mos/syneva'
export const repoFile = (path: string): string =>
	`${REPO_URL}/blob/main/${path}`
export const CONTRACT_SOURCE_URL = repoFile('packages/contracts/src/spec.ts')
export const COMMITS_URL = `${REPO_URL}/commits/main`
export const ISSUES_URL = `${REPO_URL}/issues`
