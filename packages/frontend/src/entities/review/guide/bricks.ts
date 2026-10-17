import type { ChangeState, ChangeSymbol, SymbolKind } from '../model'

// A brick: the declaration a file's changed blocks sit in - what the reviewer reads as one unit, before and after. Blocks with no declaration group by what they are: the file's imports, its comments, or (in a language the hub does not outline) each block on its own.
export type BrickKind = SymbolKind | 'imports' | 'comments' | 'block'

export type Brick = {
	key: string
	path: string
	name: string
	kind: BrickKind
	symbol?: ChangeSymbol | undefined
	changes: ChangeState[]
}

// How a brick's kind reads beside its name, in the code's own words.
export const BRICK_KIND_LABELS: Record<BrickKind, string> = {
	function: 'fn',
	method: 'method',
	class: 'class',
	interface: 'interface',
	type: 'type',
	enum: 'enum',
	variable: 'const',
	call: 'call',
	section: 'section',
	imports: '',
	comments: '',
	block: '',
}

const MINUS = '\u2212'
const EN_DASH = '\u2013'

// A block with no name is named by its span, as the chips did: the sign of its side, its first line and its last.
export function spanLabel(change: ChangeState): string {
	const sign = change.side === 'deletions' ? MINUS : '+'
	const end =
		change.endLine && change.endLine !== change.lineNumber
			? `${EN_DASH}${change.endLine}`
			: ''
	return `${sign}${change.lineNumber}${end}`
}

function brickIdentity(change: ChangeState): {
	name: string
	kind: BrickKind
	key: string
} {
	const { symbol } = change
	if (symbol)
		return {
			name: symbol.name,
			kind: symbol.kind,
			key: `${change.path}#${symbol.name}`,
		}
	if (change.trivia === 'import')
		return {
			name: 'imports',
			kind: 'imports',
			key: `${change.path}#:imports`,
		}
	if (change.trivia === 'comment')
		return {
			name: 'comments',
			kind: 'comments',
			key: `${change.path}#:comments`,
		}
	return { name: spanLabel(change), kind: 'block', key: change.id }
}

// The bricks of a list of changes, in the changes' own order (first seen), each with its changes in that order.
export function bricksOf(changes: readonly ChangeState[]): Brick[] {
	const bricks = new Map<string, Brick>()
	for (const change of changes) {
		const identity = brickIdentity(change)
		const brick = bricks.get(identity.key)
		if (brick) brick.changes.push(change)
		else
			bricks.set(identity.key, {
				key: identity.key,
				path: change.path,
				name: identity.name,
				kind: identity.kind,
				symbol: change.symbol,
				changes: [change],
			})
	}
	return [...bricks.values()]
}
