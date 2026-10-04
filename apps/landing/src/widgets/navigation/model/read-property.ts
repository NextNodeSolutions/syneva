// Reads a stylesheet value the runtime animates by, from a computed style.
export const readProperty = (
	styles: CSSStyleDeclaration,
	name: string,
): string => styles.getPropertyValue(name).trim()
