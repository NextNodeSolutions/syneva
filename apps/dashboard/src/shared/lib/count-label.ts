const plural = new Intl.PluralRules('en')

export type NounForms = { one: string; other: string }

export function countLabel(count: number, forms: NounForms): string {
	return `${count} ${plural.select(count) === 'one' ? forms.one : forms.other}`
}
