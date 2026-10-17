import { currentFileDomains, guideInputs } from '@entities/review/guide/guide'
import { isDomainDrafted } from '@entities/review/guide/resolution'
import { cx } from '@shared/lib/cx'
import { esc } from '@shared/lib/esc'
import { riskTagHtml } from '@shared/ui/risk-tag-html'
import { caption } from '@syneva/design-system/controls.styles'

import { diffCtx } from './context'
import { domainChips } from './guide-domain-chips.styles'

import type { GuideDomain } from '@entities/review/guide/model'
import type { ReviewState } from '@entities/review/model'
import type { StaticStyle } from '@shared/lib/cx'

// An explained domain's title is a caption, in capitals like the strip's labels; a drafted one's is the identifiers it was cut from (orders-api.ts · createOrder), which capitals would mangle, so it keeps its case.
function titleClass(state: ReviewState | null, domain: GuideDomain): string {
	return isDomainDrafted(state, domain.id)
		? cx(caption.base, domainChips.title, domainChips.identifiers)
		: cx(caption.base, caption.upper, domainChips.title)
}

// The domains owning a file, highest risk first, each as its risk tag and title: the file header and the oversized card print the same rows, so two independent behaviors in one file read as two rows on either.
function domainChipsHtml(
	state: ReviewState | null,
	domains: readonly GuideDomain[],
): string {
	return domains
		.map(
			domain =>
				`<span class="${cx(domainChips.row)}" data-domain-chip="${esc(domain.id)}">${riskTagHtml(domain.risk)}<span class="${titleClass(state, domain)}">${esc(domain.title)}</span></span>`,
		)
		.join('')
}

// The rows for the shown file in the caller's frame style, or nothing when no domain owns it.
export function currentDomainRows(frame: StaticStyle): HTMLElement | null {
	const { S } = diffCtx()
	const domains = currentFileDomains(guideInputs(S))
	if (!domains.length) return null
	const wrap = document.createElement('div')
	wrap.className = cx(frame)
	wrap.innerHTML = domainChipsHtml(S.state, domains)
	return wrap
}
