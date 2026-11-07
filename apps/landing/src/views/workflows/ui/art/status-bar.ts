import { workflowsArt } from './workflows-art.styles'

export const STATUS_BAR = {
	M: workflowsArt.barMod,
	A: workflowsArt.barAdd,
} as const

export type FileStatus = keyof typeof STATUS_BAR
