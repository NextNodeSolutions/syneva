// The words every labelled field carries: its label, an aside at the label
// row's end ("optional"), and the hint under it that an error replaces.
export type FieldText = {
	label: string
	aside?: string | undefined
	hint?: string | undefined
	error?: string | undefined
}
