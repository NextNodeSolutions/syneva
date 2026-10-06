import { Head } from '@react-email/components'
import geistMonoUrl from '@syneva/design-system/fonts/geist-mono.woff2?url'
import geistUrl from '@syneva/design-system/fonts/geist.woff2?url'

import type { ReactElement } from 'react'

const fontFace = (family: string, url: string): string =>
	`@font-face{font-family:'${family}';src:url(${url}) format('woff2');font-weight:100 900;font-style:normal;}`

// The site's own faces, served beside its pages, for the clients that load web fonts (Apple Mail, iOS); the rest fall back through email.styles.ts. Declared as bare faces: React Email's <Font> also sets `* { font-family }`, and a second one (the mono) would take over every element that inherits its face. Light only, as the site is: a client that darkens mail on its own turns the bands muddy.
export function EmailHead({ origin }: { origin: string }): ReactElement {
	return (
		<Head>
			<meta
				name="viewport"
				content="width=device-width, initial-scale=1"
			/>
			<meta name="color-scheme" content="light only" />
			<meta name="supported-color-schemes" content="light only" />
			<style>
				{fontFace('Geist', `${origin}${geistUrl}`) +
					fontFace('Geist Mono', `${origin}${geistMonoUrl}`)}
			</style>
		</Head>
	)
}
