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
	const reason = spec.unavailable?.()
	const isUnavailable = !!reason
	// The reason sits inside the label, so it is part of the control's accessible name too. The
	// span around the name is a flex item, hence a block: the reason, a block, goes under it.
	return (
		<label {...stylex.props(settings.row)}>
			<span>
				{spec.label}
				{isUnavailable && (
					<span {...stylex.props(settings.reason)}>{reason}</span>
				)}
			</span>
			<span
				{...stylex.props(
					field.selectBox,
					settings.box,
					isUnavailable && settings.unavailable,
				)}
			>
				<select
					{...stylex.props(
						field.base,
						field.select,
						settings.control,
						settings.select,
					)}
					value={String(spec.get())}
					disabled={isUnavailable}
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

// A setting this tab may not change stands disabled, its reason in its place (the hub sends no
// value for it then).
function SettingText({ spec }: { spec: TextSpec }): ReactElement {
	const lockedBy = spec.lockedBy?.()
	return (
		<label {...stylex.props(settings.row)}>
			{spec.label}
			<input
				{...stylex.props(field.base, settings.control, settings.text)}
				type="text"
				placeholder={lockedBy ?? spec.placeholder}
				disabled={Boolean(lockedBy)}
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
	// The desk's state too: a setting this desk cannot apply says so once the state names its
	// capabilities; and whether the web serves the tab, which locks the machine's own settings.
	useStoreFields('settings', 'diffStyle', 'state', 'isRelayed')
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
