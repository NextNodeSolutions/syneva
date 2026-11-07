import { PRODUCT_NAME } from '@shared/config/product-name'

import type { ReactElement } from 'react'

export function DocumentTitle({ title }: { title: string }): ReactElement {
	return <title>{`${title} · ${PRODUCT_NAME}`}</title>
}
