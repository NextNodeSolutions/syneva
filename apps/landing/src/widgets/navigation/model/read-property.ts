export const readProperty = (
	styles: CSSStyleDeclaration,
	name: string,
): string => styles.getPropertyValue(name).trim()
