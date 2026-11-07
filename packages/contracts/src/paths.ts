const SEPARATOR = '/'
const PARAM_PREFIX = ':'

type ParamNames<Path extends string> =
	Path extends `${string}:${infer Name}/${infer Rest}`
		? Name | ParamNames<Rest>
		: Path extends `${string}:${infer Name}`
			? Name
			: never

export type PathParams<Path extends string> = Readonly<
	Record<ParamNames<Path>, string | number>
>

export function fillPath<Path extends string>(
	pattern: Path,
	params: PathParams<Path>,
): string {
	const values: Readonly<Record<string, string | number>> = params
	return pattern
		.split(SEPARATOR)
		.map(segment =>
			segment.startsWith(PARAM_PREFIX)
				? encodeURIComponent(paramText(values, segment, pattern))
				: segment,
		)
		.join(SEPARATOR)
}

// Params come back as decoded text: the caller's schema decides what they mean.
export function matchPath(
	pattern: string,
	pathname: string,
): Readonly<Record<string, string>> | null {
	const expected = pattern.split(SEPARATOR)
	const actual = pathname.split(SEPARATOR)
	if (expected.length !== actual.length) return null
	const params: Record<string, string> = {}
	for (const [index, segment] of expected.entries()) {
		const pathSegment = actual[index]
		const isParam = segment.startsWith(PARAM_PREFIX)
		if (pathSegment === undefined || (!isParam && segment !== pathSegment))
			return null
		if (!isParam) continue
		const decoded = decodeSegment(pathSegment)
		if (!decoded) return null
		params[segment.slice(PARAM_PREFIX.length)] = decoded
	}
	return params
}

function paramText(
	values: Readonly<Record<string, string | number>>,
	segment: string,
	pattern: string,
): string {
	const param = values[segment.slice(PARAM_PREFIX.length)]
	if (param === undefined)
		throw new Error(`fillPath: ${pattern} needs a value for ${segment}.`)
	return String(param)
}

function decodeSegment(encoded: string): string | null {
	try {
		return decodeURIComponent(encoded)
	} catch {
		return null
	}
}
