import { createElement } from 'react'

import { render } from '@react-email/components'

import { welcomeText } from './welcome-text'
import { WelcomeEmail } from './WelcomeEmail'

import type { WelcomeEmailProps } from './WelcomeEmail'

export type RenderedEmail = { html: string; text: string }

export async function renderWelcome(
	props: WelcomeEmailProps,
): Promise<RenderedEmail> {
	return {
		html: await render(createElement(WelcomeEmail, props)),
		text: welcomeText(props),
	}
}
