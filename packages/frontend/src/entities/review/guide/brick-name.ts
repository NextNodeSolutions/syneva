import type { ChangeState } from '../model'

// The name the strip prints for the brick under the cursor: the declaration's, or what a block with no declaration is (the file's imports, its comments); nothing for a block the hub could not outline. Kept apart from bricks.ts so the cold chrome carries this and not the pane's grouping.
export function brickNameOf(change: ChangeState): string | null {
	if (change.symbol) return change.symbol.name
	if (change.trivia === 'import') return 'imports'
	if (change.trivia === 'comment') return 'comments'
	return null
}
