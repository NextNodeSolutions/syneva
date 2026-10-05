import { useStoreFields } from '@shared/lib/use-store-version'
import * as stylex from '@stylexjs/stylex'
import { caption, field } from '@syneva/design-system/controls.styles'

import {
	APPEARANCE_SELECTS,
	BEHAVIOR_SELECTS,
	CODE_SIZE,
	DIFF_SELECTS,
	EDITOR_COMMAND,
	TREE_SELECTS,
} from './settings-descriptors'
import { settings } from './settings.styles'

import type { ReactElement } from 'react'
import type { Option, OptionGroup } from './select-options'
import type { NumberSpec, SelectSpec, TextSpec } from './settings-descriptors'

// A table-driven settings pane: each control is a descriptor (label + options +
// read/write through the store), so the grid renders from data instead of four
// near-identical JSX blocks. Descriptors read the live store through chromeCtx() at
// call time - the pane re-renders on every store bump.

function isGrouped(
	options: Option[] | OptionGroup[],
): options is OptionGroup[] {
	const [first] = options
	return !!first && 'group' in first
}

function OptionList({
	options,
}: {
	options: Option[] | OptionGroup[]
}): ReactElement {
	if (!isGrouped(options))
		return (
			<>
				{options.map(option => (
					<option key={option.value} value={option.value}>
						{option.name}
					</option>
				))}
			</>
		)
	return (
		<>
			{options.map(group => (
				<optgroup key={group.group} label={group.group}>
					{group.options.map(option => (
						<option key={option.value} value={option.value}>
							{option.name}
						</option>
					))}
				</optgroup>
			))}
		</>
	)
}

function SettingSelect({ spec }: { spec: SelectSpec }): ReactElement {
	return (
		<label {...stylex.props(settings.row)}>
			{spec.label}
			<span {...stylex.props(field.selectBox, settings.box)}>
				<select
					{...stylex.props(
						field.base,
						field.select,
						settings.control,
						settings.select,
					)}
					value={String(spec.get())}
					onChange={event => spec.set(event.target.value)}
				>
					<OptionList options={spec.options} />
				</select>
				<svg
					{...stylex.props(field.chevron, settings.chevron)}
					viewBox="0 0 12 12"
					aria-hidden="true"
				>
					<path d="m3 4.5 3 3 3-3" />
				</svg>
			</span>
		</label>
	)
}

function SettingNumber({ spec }: { spec: NumberSpec }): ReactElement {
	return (
		<label {...stylex.props(settings.row)}>
			{spec.label}
			<input
				{...stylex.props(field.base, settings.control, settings.number)}
				type="number"
				min={spec.min}
				max={spec.max}
				step={spec.step}
				value={spec.get()}
				onChange={event => spec.set(Number(event.target.value))}
			/>
		</label>
	)
}

function SettingText({ spec }: { spec: TextSpec }): ReactElement {
	return (
		<label {...stylex.props(settings.row)}>
			{spec.label}
			<input
				{...stylex.props(field.base, settings.control, settings.text)}
				type="text"
				placeholder={spec.placeholder}
				spellCheck={false}
				value={spec.get()}
				onChange={event => spec.set(event.target.value)}
			/>
		</label>
	)
}

function SettingSection({
	title,
	selects,
	number,
	text,
}: {
	title: string
	selects: SelectSpec[]
	number?: NumberSpec
	text?: TextSpec
}): ReactElement {
	useStoreFields('settings', 'diffStyle')
	return (
		<section>
			<div
				{...stylex.props(caption.base, caption.upper, settings.section)}
			>
				{title}
			</div>
			{selects.map(spec => (
				<SettingSelect key={spec.label} spec={spec} />
			))}
			{number && <SettingNumber spec={number} />}
			{text && <SettingText spec={text} />}
		</section>
	)
}

export function SettingsPane(): ReactElement {
	return (
		<div>
			<SettingSection title="Diff" selects={DIFF_SELECTS} />
			<SettingSection
				title="Appearance"
				selects={APPEARANCE_SELECTS}
				number={CODE_SIZE}
			/>
			<SettingSection title="File tree" selects={TREE_SELECTS} />
			<SettingSection
				title="Behavior"
				selects={BEHAVIOR_SELECTS}
				text={EDITOR_COMMAND}
			/>
		</div>
	)
}
