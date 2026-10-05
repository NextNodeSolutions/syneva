import { workflowsArt } from './workflows-art.styles'

// A changed file's status as git prints it (modified or added), and the bar
// the workflow drawings mark it with.
export const STATUS_BAR = {
	M: workflowsArt.barMod,
	A: workflowsArt.barAdd,
} as const

export type FileStatus = keyof typeof STATUS_BAR
