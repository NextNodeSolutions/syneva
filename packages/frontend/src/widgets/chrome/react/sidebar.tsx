import { useStoreFields } from '@shared/lib/use-store-version'
import { deskControl, tabs } from '@shared/ui/desk-control.styles'
import { Icon } from '@shared/ui/icon'
import { Kbd } from '@shared/ui/kbd'
import { tip } from '@shared/ui/tip.styles'
import * as stylex from '@stylexjs/stylex'
import { caption, control } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { chromeCtx } from '../context'

import { glyph, row, sidebar } from './sidebar.styles'
import { ChangedIcon, StateBadge } from './tree-badges'
import { Chevron, indentStyle, MovedFrom } from './tree-parts'
import { WalkNode } from './walkthrough-rows'

import type { TreeRow } from '@entities/review/file/tree-rows'
import type { Style } from '@shared/lib/cx'
import type { ReactElement } from 'react'

function activePath(S: ReturnType<typeof chromeCtx>['S']): string | null {
	if (S.overviewOpen) return null
	return S.preview?.path ?? S.state?.files.at(S.fileIndex)?.path ?? null
}

function TestCaret({
	testKey,
	testCaret,
}: {
	testKey: string
	testCaret: string
}): ReactElement {
	const { S } = chromeCtx()
	return (
		<span
			{...stylex.props(glyph.testCaret)}
			onClick={event => {
				event.stopPropagation()
				S.toggleTestDir?.(testKey)
			}}
		>
			<Chevron open={testCaret === '▾'} />
		</span>
	)
}

function DirRowBody({
	node,
}: {
	node: Extract<TreeRow, { kind: 'dir' }>
}): ReactElement {
	return (
		<>
			<Chevron open={node.open} />
			<Icon id="gly-folder" css={glyph.folder} />
			<span {...stylex.props(row.name)}>{node.name}</span>
		</>
	)
}

function FileRowBody({
	node,
}: {
	node: Extract<TreeRow, { kind: 'file' | 'test' }>
}): ReactElement {
	return (
		<>
			<span {...stylex.props(glyph.spacer)} />
			{node.changeType && <ChangedIcon changeType={node.changeType} />}
			<span {...stylex.props(row.name)}>{node.name}</span>
			{node.movedFrom && <MovedFrom from={node.movedFrom} />}
			{node.testToggle && (
				<TestCaret testKey={node.testKey} testCaret={node.testCaret} />
			)}
			{node.state && (
				<span {...stylex.props(row.trail)}>
					<StateBadge state={node.state} />
				</span>
			)}
		</>
	)
}

function FoldGroupBody({
	node,
}: {
	node: Extract<TreeRow, { kind: 'foldgrp' }>
}): ReactElement {
	return (
		<>
			<Chevron open={node.open} />
			<span {...stylex.props(row.name)}>
				{node.group === 'reviewed' ? 'Reviewed' : 'Renamed'}
			</span>
			<span {...stylex.props(row.count)}>
				{node.count + (node.count === 1 ? ' file' : ' files')}
			</span>
		</>
	)
}

function rowStyles(node: TreeRow, isActive: boolean): Style {
	if (node.kind === 'foldgrp') return [row.base, row.fold]
	return [
		row.base,
		indentStyle(node.depth),
		node.changed && row.changed,
		node.kind === 'test' && row.test,
		isActive && row.active,
	]
}

function TreeRowNode({
	node,
	isActive,
}: {
	node: TreeRow
	isActive: boolean
}): ReactElement {
	const { S } = chromeCtx()
	return (
		<div
			role="button"
			tabIndex={0}
			{...stylex.props(rowStyles(node, isActive))}
			data-key={node.key}
			onClick={() => S.rowClick?.(node)}
		>
			{node.kind === 'dir' && <DirRowBody node={node} />}
			{(node.kind === 'file' || node.kind === 'test') && (
				<FileRowBody node={node} />
			)}
			{node.kind === 'foldgrp' && <FoldGroupBody node={node} />}
		</div>
	)
}

function TreeTabs(): ReactElement {
	const { S } = chromeCtx()
	const tab = (pane: 'tree' | 'walkthrough', label: string): ReactElement => (
		<button
			{...stylex.props(tabs.tab, S.sidebarTab === pane && tabs.on)}
			aria-selected={S.sidebarTab === pane}
			role="tab"
			onClick={() => {
				S.sidebarTab = pane
			}}
		>
			{label}
			{S.sidebarTab !== pane && <Kbd keys="w" />}
		</button>
	)
	return (
		<div {...stylex.props(tabs.strip, sidebar.tabs)} role="tablist">
			{tab('tree', 'Tree')}
			{tab('walkthrough', 'Walkthrough')}
		</div>
	)
}

function TreePane({ active }: { active: string | null }): ReactElement {
	const { S } = chromeCtx()
	const rows = S.treeRows?.() ?? []
	const anyOpen = S.treeAnyOpen?.() ?? false
	return (
		<>
			<div {...stylex.props(sidebar.head)}>
				<span {...stylex.props(caption.base, caption.upper)}>
					Files
				</span>
				<button
					{...stylex.props(
						press.control,
						control.base,
						control.quiet,
						deskControl.mini,
						deskControl.iconMini,
						tip.host,
						tip.end,
					)}
					data-tip={anyOpen ? 'Collapse all' : 'Expand all'}
					aria-label={anyOpen ? 'Collapse all' : 'Expand all'}
					onClick={() => S.toggleAllDirs?.()}
				>
					<Icon
						id={anyOpen ? 'gly-collapse-all' : 'gly-expand-all'}
					/>
				</button>
			</div>
			<div {...stylex.props(sidebar.pane)}>
				{rows.map(node => (
					<TreeRowNode
						key={node.key}
						node={node}
						isActive={Boolean(
							active &&
							(node.key === `file:${active}` ||
								node.key === `test:${active}`),
						)}
					/>
				))}
			</div>
		</>
	)
}

export function Sidebar({ hidden }: { hidden: boolean }): ReactElement {
	const { S } = chromeCtx()
	useStoreFields(
		'state',
		'fileIndex',
		'preview',
		'overviewOpen',
		'sidebarTab',
		'treeDrawerOpen',
		'foldExpanded',
		'expandedDirs',
		'collapsedDirs',
		'loadedOversized',
		'settings',
	)
	const guided = S.hasGuide?.() ?? false
	const showTree = !guided || S.sidebarTab === 'tree'
	return (
		<aside
			{...stylex.props(
				sidebar.aside,
				S.treeDrawerOpen && sidebar.drawerOpen,
				hidden && sidebar.hidden,
			)}
		>
			{guided && <TreeTabs />}
			{showTree && <TreePane active={activePath(S)} />}
			{guided && S.sidebarTab === 'walkthrough' && (
				<div {...stylex.props(sidebar.pane)}>
					{(S.walkthroughRows?.() ?? []).map(node => (
						<WalkNode key={node.key} node={node} />
					))}
				</div>
			)}
			<button
				{...stylex.props(sidebar.settings)}
				onClick={() => S.openSettings?.()}
			>
				<Icon id="gly-settings" />
				<span>Settings</span>
				<Kbd keys="⇧," css={sidebar.settingsKey} />
			</button>
		</aside>
	)
}
