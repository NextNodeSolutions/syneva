import * as stylex from '@stylexjs/stylex'
import { tag } from '@syneva/design-system/controls.styles'

import { draftTag } from './draft-tag.styles'

import type { ReactElement } from 'react'

export function DraftTag(): ReactElement {
	return <span {...stylex.props(tag.base, draftTag.tag)}>Draft</span>
}
