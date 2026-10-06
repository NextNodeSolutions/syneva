import { countLines, SAMPLE_CHANGE } from '@entities/desk/model/sample-round'
import { PRINCIPLES, TAGLINE } from '@entities/site/model/project'
import { twoDigits } from '@shared/lib/two-digits'

import { COMING } from '../model/coming'

import { followLinks, footerReason, WELCOME_COPY } from './welcome-copy'

import type { WelcomeEmailProps } from './WelcomeEmail'

const SIGN = { context: ' ', added: '+', removed: '-' } as const

const roundText = (): string[] => {
	const { round, illustrative, asker, answerer } = WELCOME_COPY
	const { path, lines, thread } = SAMPLE_CHANGE
	return [
		`${round.toUpperCase()} (${illustrative.toLowerCase()})`,
		`${path}  +${countLines('added')} -${countLines('removed')}  accepted`,
		...lines.map(
			({ line, kind, code }) => `  ${line} ${SIGN[kind]} ${code}`,
		),
		`  ${asker}: ${thread.question}`,
		`  ${answerer}: ${thread.answer}`,
	]
}

// The plain-text body, laid out for a text reader rather than derived from the HTML's tables.
export function welcomeText({ recipient, origin }: WelcomeEmailProps): string {
	const { added, verdict, body, coming, follow } = WELCOME_COPY
	const pages = COMING.flatMap((page, index) => [
		`${twoDigits(index + 1)} ${page.title}: ${page.blurb}`,
		`   ${origin}${page.href}`,
	])
	const links = followLinks(origin).map(link => `${link.label}: ${link.href}`)
	return [
		added,
		`${verdict.before} ${verdict.decided} ${verdict.after}`,
		'',
		body,
		'',
		...roundText(),
		'',
		`${coming}:`,
		...pages,
		'',
		PRINCIPLES.join(' / '),
		'',
		'--',
		`${follow}:`,
		...links,
		'',
		footerReason(recipient, new URL(origin).host),
		TAGLINE,
		'',
	].join('\n')
}
