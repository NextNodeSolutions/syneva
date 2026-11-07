// The Conventional Commit types the changelog lists and its history rail counts; the content schema accepts no other.
export const CHANGE_KINDS = ['feat', 'fix', 'perf'] as const
export type ChangeKind = (typeof CHANGE_KINDS)[number]
