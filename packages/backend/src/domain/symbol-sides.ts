// A changed declaration's lines on each side of the diff: the side the block is on from its own outline, the other side from that side's outline where the same declaration still (or already) stands - matched by its qualified name and kind, as a rename reads as one declaration gone and another added.
import type {
	ChangeSymbol,
	LineRange,
	OutlineDeclaration,
	SourceOutline,
} from './outline.js'

type Side = 'additions' | 'deletions'

function rangeOf(
	declaration: OutlineDeclaration | undefined,
): LineRange | undefined {
	if (!declaration) return undefined
	return { startLine: declaration.startLine, endLine: declaration.endLine }
}

export function symbolOnSides(
	declaration: OutlineDeclaration,
	side: Side,
	otherSide: SourceOutline | null,
): ChangeSymbol {
	const twin = otherSide?.declarations.find(
		entry =>
			entry.name === declaration.name && entry.kind === declaration.kind,
	)
	const own = rangeOf(declaration)
	const across = rangeOf(twin)
	return {
		name: declaration.name,
		kind: declaration.kind,
		before: side === 'deletions' ? own : across,
		after: side === 'additions' ? own : across,
	}
}
