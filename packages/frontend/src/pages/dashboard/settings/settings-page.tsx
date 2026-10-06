import { useRef } from 'react'

import { FONTS, SANS_FONTS } from '@entities/settings/settings'
import { useEntrance } from '@shared/lib/use-entrance'
import { SelectField } from '@shared/ui/select-field'
import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'

import { menu } from '../overview/react/menu.styles'
import { PageHead } from '../react/page-head'
import { PageSection } from '../react/page-section'
import { pageSection } from '../react/section.styles'

import { useHubSettings } from './use-hub-settings'

import type { Settings } from '@entities/settings/model'
import type { ReactElement } from 'react'
import type { SaveState } from './use-hub-settings'

const SAVE_WORDS: Record<SaveState, string> = {
	idle: 'Saved to ~/.syneva/settings.json on this hub, for every desk.',
	saving: 'Saving…',
	saved: 'Saved. Every desk follows it.',
	failed: 'The hub did not keep this change. It applies to this page only.',
}

const APPEARANCES: readonly { id: Settings['appearance']; label: string }[] = [
	{ id: 'light', label: 'Light' },
	{ id: 'dark', label: 'Night' },
]

function fontOptions(
	table: Record<string, { label: string }>,
): { value: string; label: string }[] {
	return Object.entries(table).map(([value, font]) => ({
		value,
		label: font.label,
	}))
}

type SectionProps = {
	settings: Settings
	change: (next: Partial<Settings>) => void
}

function AppearanceChoice({ settings, change }: SectionProps): ReactElement {
	return (
		<div
			{...stylex.props(menu.segmented)}
			role="group"
			aria-label="Appearance"
		>
			{APPEARANCES.map(option => (
				<button
					key={option.id}
					type="button"
					aria-pressed={settings.appearance === option.id}
					onClick={() => change({ appearance: option.id })}
					{...stylex.props(
						focus.inset,
						menu.segment,
						settings.appearance === option.id && menu.segmentOn,
					)}
				>
					{option.label}
				</button>
			))}
		</div>
	)
}

function TypeChoices({ settings, change }: SectionProps): ReactElement {
	return (
		<>
			<SelectField
				label="Interface font"
				value={settings.uiFont}
				options={fontOptions(SANS_FONTS)}
				onChange={event =>
					change({ uiFont: event.currentTarget.value })
				}
			/>
			<SelectField
				label="Code font"
				value={settings.font}
				options={fontOptions(FONTS)}
				onChange={event => change({ font: event.currentTarget.value })}
			/>
		</>
	)
}

// The reviewer's preferences, the same file every desk reads: the appearance (the light field
// or its night mirror) and the two voices. A change shows at once and is saved on the hub.
export function SettingsPage(): ReactElement {
	const root = useRef<HTMLDivElement>(null)
	const { settings, save, change } = useHubSettings()
	// The sections arrive with the saved settings: the entrance plays again once they are read
	// (the pending head has barely started, and is held back from view anyway).
	useEntrance(root, settings ? 'settings' : 'settings-pending')
	return (
		<div ref={root} {...stylex.props(pageSection.page)}>
			<PageHead
				title="Settings"
				lede={SAVE_WORDS[save]}
				isPending={!settings}
			/>
			{settings && (
				<>
					<PageSection
						title="Appearance"
						note="The hub and every desk, in the light field or its night mirror."
					>
						<AppearanceChoice settings={settings} change={change} />
					</PageSection>
					<PageSection
						title="Type"
						note="Geist sets the interface and Geist Mono the code; both ship with the hub, the others load when chosen."
					>
						<TypeChoices settings={settings} change={change} />
					</PageSection>
					<PageSection
						title="Desks"
						note="How a diff shows (layout, code theme, separators, wrapping) is set from any desk's Settings, Shift and comma, and applies to every desk."
					>
						<p {...stylex.props(pageSection.note)}>
							Every desk reads these same preferences.
						</p>
					</PageSection>
				</>
			)}
		</div>
	)
}
