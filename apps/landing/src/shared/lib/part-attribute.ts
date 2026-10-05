type DataAttribute = `data-${string}`

// A part's name in its data attribute, for the markup to spread.
type PartMark<Name extends string> = Readonly<Record<DataAttribute, Name>>

export type PartAttribute<Name extends string> = {
	mark: (name: Name) => PartMark<Name>
	selector: (name: Name) => string
}

// The parts of a figure a runtime drives, named once: the markup marks a
// part with mark(name) and the runtime finds it with selector(name), both
// typed by the same Name union, so a name only one side knows fails the
// type check.
export function partAttribute<Name extends string>(
	attribute: DataAttribute,
): PartAttribute<Name> {
	return {
		mark: name => ({ [attribute]: name }),
		selector: name => `[${attribute}="${name}"]`,
	}
}
