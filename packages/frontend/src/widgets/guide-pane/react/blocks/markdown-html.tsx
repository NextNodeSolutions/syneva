import { renderGuideMarkdown } from '@shared/markdown'
import * as stylex from '@stylexjs/stylex'

import { block } from './block.styles'

import type { ReactElement } from 'react'

// Agent-authored Markdown through the desk's one sanitized renderer (markdown-it with html:false, then DOMPurify): no raw HTML and no script ever reaches the DOM from a guide; repo-relative images rewrite to the repository's blob route.
// The sanitized string is set as HTML deliberately - the renderer is the trust boundary.
export function MarkdownHtml({ markdown }: { markdown: string }): ReactElement {
	return (
		<div
			{...stylex.props(block.prose)}
			data-prose="guide"
			// oxlint-disable-next-line react/no-danger
			dangerouslySetInnerHTML={{ __html: renderGuideMarkdown(markdown) }}
		/>
	)
}
