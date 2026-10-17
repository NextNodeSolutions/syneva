import * as stylex from '@stylexjs/stylex'

import type { ModelElementKind } from '@entities/review/guide/system-model'
import type { StaticStyle } from '@shared/lib/cx'
import type { ReactElement } from 'react'

// What an element is, said in a word under its name and drawn as a 14px line glyph beside it.
export const KIND_WORDS: Record<ModelElementKind, string> = {
	actor: 'Person',
	system: 'System',
	ui: 'Interface',
	service: 'Service',
	component: 'Component',
	store: 'Store',
	queue: 'Queue',
	external: 'External',
}

const PATHS: Record<ModelElementKind, string> = {
	actor: 'M7 6.8a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8ZM2.5 12.5c0-2.6 2-4.2 4.5-4.2s4.5 1.6 4.5 4.2',
	system: 'M1.5 1.5h11v11h-11zM4.5 4.5h5v5h-5z',
	ui: 'M1.5 2.5h11v9h-11zM1.5 5h11',
	service: 'M7 1.5l4.8 2.75v5.5L7 12.5 2.2 9.75v-5.5z',
	component: 'M4 2.5h8.5v9H4zM1.5 5h4M1.5 9h4',
	store: 'M2.5 3.5c0-1 2-1.8 4.5-1.8s4.5.8 4.5 1.8-2 1.8-4.5 1.8-4.5-.8-4.5-1.8v7c0 1 2 1.8 4.5 1.8s4.5-.8 4.5-1.8v-7',
	queue: 'M3.5 4.5h7a2.5 2.5 0 0 1 0 5h-7a2.5 2.5 0 0 1 0-5zM5.5 7h3',
	external: 'M8 1.5h4.5V6M12.5 1.5 6.5 7.5M10.5 9v3.5h-9v-9H5',
}

export function KindGlyph({
	kind,
	css,
}: {
	kind: ModelElementKind
	css?: StaticStyle
}): ReactElement {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 14 14"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.3"
			strokeLinejoin="round"
			strokeLinecap="round"
			aria-hidden="true"
			{...stylex.props(css)}
		>
			<path d={PATHS[kind]} />
		</svg>
	)
}
