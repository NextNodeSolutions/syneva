import { DecodeError, requiredArray } from '@shared/api/decode'

type Ctx = { endpoint: string }

// An optional list stays absent when the key is missing; present, every entry is decoded in turn.
export function optList<T>(
	o: Record<string, unknown>,
	key: string,
	ctx: Ctx,
	decodeEntry: (entry: unknown) => T,
): T[] | undefined {
	if (!(key in o)) return undefined
	return requiredArray(o, key, ctx.endpoint).map(decodeEntry)
}

export function optStrings(
	o: Record<string, unknown>,
	key: string,
	ctx: Ctx,
): string[] | undefined {
	return optList(o, key, ctx, entry => {
		if (typeof entry !== 'string')
			throw new DecodeError(
				`${key} must be an array of strings`,
				ctx.endpoint,
			)
		return entry
	})
}
