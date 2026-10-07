import { ALREADY_LISTED_COPY } from './already-listed-copy'
import { frameText } from './frame-text'

import type { ListEmailProps } from '../model/list-email'

// The plain-text body of the note an address already on the list gets.
export function alreadyListedText(props: ListEmailProps): string {
	const { added, verdict, body } = ALREADY_LISTED_COPY
	return frameText(props, [
		added,
		`${verdict.before} ${verdict.decided} ${verdict.after}`,
		'',
		body,
	])
}
