import { currentFileDomains, guideInputs } from '@entities/review/guide/guide'
import { cx } from '@shared/lib/cx'
import { esc } from '@shared/lib/esc'
import { riskTagHtml } from '@shared/ui/risk-tag-html'
import { caption } from '@syneva/design-system/controls.styles'

import { diffCtx } from './context'
import { domainChips } from './guide-domain-chips.styles'

import type { GuideDomain } from '@entities/review/guide/model'
import type { StaticStyle } from '@shared/lib/cx'

// The domains owning a file, highest risk first, each as its risk tag and title: the file header and the oversized card print the same rows, so two independent behaviors in one file read as two rows on either.
function domainChipsHtml(domains: readonly GuideDomain[]): string {
	return domains
		.map(
			domain =>
				`<span class="${cx(domainChips.row)}" data-domain-chip="${esc(domain.id)}">${riskTagHtml(domain.risk)}<span class="${cx(caption.base, caption.upper, domainChips.title)}">${esc(domain.title)}</span></span>`,
		)
		.join('')
}

// The rows for the shown file in the caller's frame style, or nothing when no domain owns it.
export function currentDomainRows(frame: StaticStyle): HTMLElement | null {
	const domains = currentFileDomains(guideInputs(diffCtx().S))
	if (!domains.length) return null
	const wrap = document.createElement('div')
	wrap.className = cx(frame)
	wrap.innerHTML = domainChipsHtml(domains)
	return wrap
}
