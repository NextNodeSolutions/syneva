import * as stylex from '@stylexjs/stylex'

import { RefChip } from '../ref-chip'

import { api } from './api-block.styles'
import { CHANGE_SIGNS, CHANGE_WORDS, changeTone } from './change-mark.styles'

import type {
	ApiBlock,
	ApiEndpoint,
	ChangeMark,
	DataField,
	GuideDomain,
} from '@entities/review/guide/model'
import type { ReactElement } from 'react'

export function ChangeTag({
	change,
}: {
	change: ChangeMark | undefined
}): ReactElement | null {
	if (!change) return null
	return (
		<span {...stylex.props(api.tag, changeTone[change])}>
			{CHANGE_WORDS[change]}
		</span>
	)
}

function RefOf({
	domain,
	refId,
}: {
	domain: GuideDomain
	refId: string | undefined
}): ReactElement | null {
	const reference = domain.references?.find(ref => ref.id === refId)
	if (!reference) return null
	return <RefChip domain={domain} reference={reference} />
}

// A message's fields, each led by the sign of what the change does to it.
export function FieldList({
	fields,
}: {
	fields: readonly DataField[]
}): ReactElement {
	return (
		<ul {...stylex.props(api.fields)}>
			{fields.map(field => (
				<li
					key={field.name}
					{...stylex.props(api.field)}
					title={field.note}
				>
					<span
						{...stylex.props(
							api.sign,
							field.change && changeTone[field.change],
							api.signTone,
						)}
						aria-label={field.change && CHANGE_WORDS[field.change]}
					>
						{field.change ? CHANGE_SIGNS[field.change] : ''}
					</span>
					<span
						{...stylex.props(
							field.change === 'removed' && api.removedText,
						)}
					>
						{field.name}
					</span>
					{field.type && (
						<span {...stylex.props(api.type)}>{field.type}</span>
					)}
				</li>
			))}
		</ul>
	)
}

function Message({
	label,
	fields,
}: {
	label: string
	fields: readonly DataField[] | undefined
}): ReactElement | null {
	if (!fields?.length) return null
	return (
		<div>
			<span {...stylex.props(api.messageLabel)}>{label}</span>
			<FieldList fields={fields} />
		</div>
	)
}

function hasMessages(endpoint: ApiEndpoint): boolean {
	return (
		(endpoint.request?.length ?? 0) > 0 ||
		(endpoint.response?.length ?? 0) > 0
	)
}

function Endpoint({
	domain,
	endpoint,
}: {
	domain: GuideDomain
	endpoint: ApiEndpoint
}): ReactElement {
	return (
		<div {...stylex.props(api.endpoint)} data-endpoint={endpoint.id}>
			<div {...stylex.props(api.head)}>
				<span {...stylex.props(api.method)}>{endpoint.method}</span>
				<code
					{...stylex.props(
						api.path,
						endpoint.change === 'removed' && api.removedText,
					)}
				>
					{endpoint.path}
				</code>
				<ChangeTag change={endpoint.change} />
				<RefOf domain={domain} refId={endpoint.ref} />
			</div>
			{endpoint.summary && (
				<p {...stylex.props(api.summary)}>{endpoint.summary}</p>
			)}
			{hasMessages(endpoint) && (
				<div {...stylex.props(api.messages)}>
					<Message label="Request" fields={endpoint.request} />
					<Message label="Response" fields={endpoint.response} />
				</div>
			)}
		</div>
	)
}

// The entry points a caller depends on: method, path, what the change does to each and to the fields of its messages.
export function ApiView({
	domain,
	block,
}: {
	domain: GuideDomain
	block: ApiBlock
}): ReactElement {
	return (
		<div {...stylex.props(api.list)}>
			{block.endpoints.map(endpoint => (
				<Endpoint
					key={endpoint.id}
					domain={domain}
					endpoint={endpoint}
				/>
			))}
		</div>
	)
}
