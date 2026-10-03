import { useState } from 'react'

import { openHubDesk } from '@entities/hub/api'

import type { NewDeskInput, ReviewMode } from '@entities/hub/model'
import type { FormEvent, ReactElement } from 'react'

// The form's source choice: the four review modes the CLI offers, as one select.
type Source = 'working' | 'staged' | 'file' | 'pr'

const SOURCES: readonly Source[] = ['working', 'staged', 'file', 'pr']

const SOURCE_LABELS: Record<Source, string> = {
	working: 'Working tree',
	staged: 'Staged changes',
	file: 'A single file',
	pr: 'A branch or pull request',
}

const TARGET_HINT: Record<Source, string> = {
	working: '',
	staged: '',
	file: 'path/to/plan.md (relative to the repo)',
	pr: 'branch name, PR number or GitHub URL',
}

function isSource(candidate: string): candidate is Source {
	return SOURCES.some(source => source === candidate)
}

type Fields = { root: string; source: Source; target: string; session: string }

function toInput(fields: Fields): NewDeskInput {
	const mode: ReviewMode =
		fields.source === 'file' || fields.source === 'pr'
			? fields.source
			: 'repo'
	return {
		root: fields.root.trim(),
		mode,
		staged: fields.source === 'staged',
		target: fields.target.trim() || undefined,
		session: fields.session.trim() || undefined,
	}
}

function validationError(fields: Fields): string {
	if (!fields.root.trim()) return 'A repo path is required.'
	if (fields.source === 'file' && !fields.target.trim())
		return 'The file to review is required.'
	return ''
}

type NewDeskForm = {
	fields: Fields
	set: <K extends keyof Fields>(key: K, next: Fields[K]) => void
	error: string
	busy: boolean
	submit: (event: FormEvent) => void
}

// The form's state and its one action: open the desk on the hub and land on it. A reused
// desk and a new one both navigate; a refused open stays on the form with the hub's reason.
function useNewDeskForm(): NewDeskForm {
	const [fields, setFields] = useState<Fields>({
		root: '',
		source: 'working',
		target: '',
		session: '',
	})
	const [error, setError] = useState('')
	const [busy, setBusy] = useState(false)
	const open = async (): Promise<void> => {
		setBusy(true)
		setError('')
		try {
			const desk = await openHubDesk(toInput(fields))
			window.location.assign(desk.path)
		} catch (failure) {
			setBusy(false)
			setError(
				failure instanceof Error
					? failure.message
					: 'The hub could not open the desk.',
			)
		}
	}
	return {
		fields,
		set: (key, next) => setFields(current => ({ ...current, [key]: next })),
		error,
		busy,
		submit: (event: FormEvent): void => {
			event.preventDefault()
			const invalid = validationError(fields)
			if (invalid) {
				setError(invalid)
				return
			}
			void open()
		},
	}
}

function TextField({
	label,
	value,
	placeholder,
	onChange,
	autoFocus = false,
}: {
	label: string
	value: string
	placeholder: string
	onChange: (value: string) => void
	autoFocus?: boolean
}): ReactElement {
	return (
		<label>
			<span>{label}</span>
			<input
				value={value}
				onChange={event => onChange(event.target.value)}
				placeholder={placeholder}
				autoFocus={autoFocus}
				spellCheck={false}
			/>
		</label>
	)
}

function SourceSelect({
	source,
	onChange,
}: {
	source: Source
	onChange: (source: Source) => void
}): ReactElement {
	return (
		<label>
			<span>Source</span>
			<select
				value={source}
				onChange={event => {
					if (isSource(event.target.value))
						onChange(event.target.value)
				}}
			>
				{SOURCES.map(option => (
					<option key={option} value={option}>
						{SOURCE_LABELS[option]}
					</option>
				))}
			</select>
		</label>
	)
}

// The fields: repo, source, the target the source needs (a file or a ref), the session.
function PanelFields({ form }: { form: NewDeskForm }): ReactElement {
	const { fields } = form
	const needsTarget = fields.source === 'file' || fields.source === 'pr'
	return (
		<>
			<TextField
				label="Repository path"
				value={fields.root}
				placeholder="/home/you/projects/app"
				onChange={root => form.set('root', root)}
				autoFocus
			/>
			<SourceSelect
				source={fields.source}
				onChange={source => form.set('source', source)}
			/>
			{needsTarget && (
				<TextField
					label={fields.source === 'file' ? 'File' : 'Ref'}
					value={fields.target}
					placeholder={TARGET_HINT[fields.source]}
					onChange={target => form.set('target', target)}
				/>
			)}
			<TextField
				label="Session (optional)"
				value={fields.session}
				placeholder="defaults to the branch / file / ref"
				onChange={session => form.set('session', session)}
			/>
		</>
	)
}

// "New review": open a desk from the dashboard - the same open the CLI performs, for a repo
// on the hub's machine.
export function NewDeskPanel({
	onCancel,
}: {
	onCancel: () => void
}): ReactElement {
	const form = useNewDeskForm()
	return (
		<div className="panel-backdrop" onClick={onCancel}>
			<form
				className="panel"
				onClick={event => event.stopPropagation()}
				onSubmit={form.submit}
				aria-label="New review"
			>
				<p className="label">New review</p>
				<h2>Open a desk</h2>
				<p className="hint">
					The repo must be on this hub&apos;s machine. The desk reads
					it the way <code>syneva open</code> would from inside it.
				</p>
				<PanelFields form={form} />
				{form.error && (
					<p className="form-error" role="alert">
						{form.error}
					</p>
				)}
				<div className="panel-actions">
					<button type="button" className="btn" onClick={onCancel}>
						Cancel
					</button>
					<button
						type="submit"
						className="btn primary"
						disabled={form.busy}
					>
						{form.busy ? 'Opening…' : 'Open desk'}
					</button>
				</div>
			</form>
		</div>
	)
}
