import { threadSignature } from './comment-thread/comment-thread'

import type { AnnotationInput } from './types'

// Pierre keeps a rendered annotation while its metadata is the same object and skips the row rebuild entirely while the annotations array is the same one.
// Each pass builds annotations fresh from the store, so the previous objects - and the previous array - are handed back for as long as what they render is unchanged.
let lastAnnotations: AnnotationInput[] = []
let reusable = new Map<string, AnnotationInput>()

function annotationSignature(annotation: AnnotationInput): string {
	const { metadata } = annotation
	const content =
		metadata.type === 'thread'
			? threadSignature(metadata)
			: JSON.stringify(metadata)
	return `${annotation.side}:${annotation.lineNumber}:${content}`
}

function isSameList(next: AnnotationInput[]): boolean {
	return (
		next.length === lastAnnotations.length &&
		next.every((annotation, index) => annotation === lastAnnotations[index])
	)
}

export function stableAnnotations(fresh: AnnotationInput[]): AnnotationInput[] {
	const kept = new Map<string, AnnotationInput>()
	const next = fresh.map(annotation => {
		const key = annotationSignature(annotation)
		const stable = reusable.get(key) ?? kept.get(key) ?? annotation
		kept.set(key, stable)
		return stable
	})
	reusable = kept
	if (isSameList(next)) return lastAnnotations
	lastAnnotations = next
	return next
}
