import { useStoreFields } from '@shared/lib/use-store-version'
import { deskControl, tabs } from '@shared/ui/desk-control.styles'
import { Kbd } from '@shared/ui/kbd'
import * as stylex from '@stylexjs/stylex'
import { caption, control } from '@syneva/design-system/controls.styles'
import { kbd } from '@syneva/design-system/inline.styles'
import { press } from '@syneva/design-system/press.styles'

import { chromeCtx } from '../context'

import { modal } from './modal.styles'
import { SettingsPane } from './settings-pane'
import { settings } from './settings.styles'

import type { ReactElement } from 'react'

function ShortcutsPane(): ReactElement {
	const { S } = chromeCtx()
	const groups = S.helpGroups?.() ?? []
	return (
		<div {...stylex.props(settings.keys)}>
			{groups.map(grp => (
				<div {...stylex.props(settings.group)} key={grp.group}>
					<div
						{...stylex.props(
							caption.base,
							caption.upper,
							settings.groupHead,
						)}
					>
						{grp.group}
					</div>
					{grp.items.map(binding => (
						<div
							{...stylex.props(settings.key)}
							key={binding.combo}
						>
							<Kbd keys={binding.combo} />
							<span>{binding.desc}</span>
						</div>
					))}
				</div>
			))}
		</div>
	)
}

function SettingsTabs(): ReactElement {
	const { S } = chromeCtx()
	const tab = (
		pane: 'settings' | 'shortcuts',
		label: string,
	): ReactElement => (
		<button
			{...stylex.props(tabs.tab, S.settingsTab === pane && tabs.on)}
			role="tab"
			aria-selected={S.settingsTab === pane}
			onClick={() => {
				S.settingsTab = pane
			}}
		>
			{label}
		</button>
	)
	return (
		<div {...stylex.props(tabs.strip, settings.tabs)} role="tablist">
			{tab('settings', 'Settings')}
			{tab('shortcuts', 'Shortcuts')}
		</div>
	)
}

export function SettingsModal(): ReactElement {
	const { S } = chromeCtx()
	useStoreFields('settingsOpen', 'settingsTab')
	if (!S.settingsOpen) return <></>
	return (
		<div
			{...stylex.props(modal.backdrop)}
			onClick={event => {
				if (event.target === event.currentTarget) S.closeSettings?.()
			}}
		>
			<div
				{...stylex.props(modal.sheet, modal.settings)}
				role="dialog"
				aria-modal="true"
				aria-label="Settings"
			>
				<SettingsTabs />
				{S.settingsTab === 'settings' ? (
					<SettingsPane />
				) : (
					<ShortcutsPane />
				)}
				<div {...stylex.props(modal.actions)}>
					<button
						{...stylex.props(
							press.control,
							control.base,
							deskControl.compact,
							control.primary,
						)}
						onClick={() => S.closeSettings?.()}
					>
						Done <Kbd keys="Esc" css={kbd.onFill} />
					</button>
				</div>
			</div>
		</div>
	)
}
