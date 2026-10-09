import { cx } from '@shared/lib/cx'
import { $ } from '@shared/lib/dom'

import { empty } from './empty.styles'

export function renderEmptyDesk(): void {
	$('diff').innerHTML =
		`<div class="${cx(empty.page)}"><div class="${cx(empty.card)}">
    <h1 class="${cx(empty.title)}">No changes to review yet.</h1>
    <p class="${cx(empty.note)}">Changes appear when your agent reloads the desk.</p>
  </div></div>`
}
