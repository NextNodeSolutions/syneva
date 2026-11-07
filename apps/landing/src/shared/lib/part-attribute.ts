type DataAttribute = `data-${string}`

type PartMark<Name extends string> = Readonly<Record<DataAttribute, Name>>

export type PartAttribute<Name extends string> = {
	mark: (name: Name) => PartMark<Name>
	selector: (name: Name) => string
}

// Parts named once: markup marks a part with mark(name), the runtime selects with selector(name), both typed by one Name union - a name only one side knows fails the type check.
export function partAttribute<Name extends string>(
	attribute: DataAttribute,
): PartAttribute<Name> {
	return {
		mark: name => ({ [attribute]: name }),
		selector: name => `[${attribute}="${name}"]`,
	}
}
