import { currentFileOrNull } from '@entities/review/changes'
import { bricksOf } from '@entities/review/guide/bricks'
import {
	changeSpan,
	changesByFile,
	orderedDomainChanges,
} from '@entities/review/guide/navigation'
import * as stylex from '@stylexjs/stylex'

import { chromeCtx } from '../../chrome/context'

import { BrickRow, Verdict } from './coverage-brick'
import { coverage } from './coverage-list.styles'

import type { GuideDomain } from '@entities/review/guide/model'
import type { ChangeState, ReviewState } from '@entities/review/model'
import type { ReactElement } from 'react'

// The folder gives way, the file name never does: a long path ellipsizes its directories, not what the reviewer scans for.
function PathLabel({ path }: { path: string }): ReactElement {
	const slash = path.lastIndexOf('/')
	const dir = slash >= 0 ? path.slice(0, slash + 1) : ''
	const name = slash >= 0 ? path.slice(slash + 1) : path
	return (
		<span {...stylex.props(coverage.path)} title={path}>
			{dir && <span {...stylex.props(coverage.dir)}>{dir}</span>}
			<span {...stylex.props(coverage.name)}>{name}</span>
		</span>
	)
}

function selectFile(state: ReviewState, path: string): void {
	const { S } = chromeCtx()
	const index = state.files.findIndex(file => file.path === path)
	if (index >= 0) S.selectFile?.(index)
}

// What the file row says beside the path: how many blocks the domain owns in it, or the whole-file operation alone.
function scopeLabel(changes: readonly ChangeState[]): string {
	if (!changes.length) return 'whole file'
	return changes.length === 1 ? '1 block' : `${changes.length} blocks`
}

// One file the domain touches: the path once, then its bricks - the declarations its blocks sit in, each a row the reviewer lands on. The head of the list lands on the file's first block.
function FileGroup({
	path,
	changes,
	isWholeFile,
	isCurrent,
	state,
}: {
	path: string
	changes: readonly ChangeState[]
	isWholeFile: boolean
	isCurrent: boolean
	state: ReviewState
}): ReactElement {
	const { S } = chromeCtx()
	const [first] = changes
	const bricks = bricksOf(changes)
	return (
		<div {...stylex.props(coverage.file, isCurrent && coverage.current)}>
			<button
				{...stylex.props(coverage.row)}
				onClick={() =>
					first
						? S.jumpToSpan?.(changeSpan(first))
						: selectFile(state, path)
				}
			>
				<PathLabel path={path} />
				<span {...stylex.props(coverage.lines)}>
					{scopeLabel(changes)}
				</span>
				{changes.length > 0 && <Verdict changes={changes} />}
			</button>
			{bricks.map(brick => (
				<BrickRow key={brick.key} brick={brick} />
			))}
			{isWholeFile && changes.length > 0 && (
				<span {...stylex.props(coverage.brick, coverage.lines)}>
					whole file
				</span>
			)}
		</div>
	)
}

// The changed code the domain owns, one entry per file in reading order: its bricks, then the whole-file operations no block carries.
export function CoverageList({
	domain,
	state,
}: {
	domain: GuideDomain
	state: ReviewState
}): ReactElement {
	const { S } = chromeCtx()
	const shown = currentFileOrNull(state.files, S.preview, S.fileIndex)
	const groups = changesByFile(orderedDomainChanges(domain, state))
	const grouped = new Set(groups.map(group => group.path))
	const wholeFiles = new Set(
		domain.members
			.filter(member => member.kind === 'file')
			.map(member => member.path),
	)
	const fileOnly = [...wholeFiles]
		.filter(path => !grouped.has(path))
		.map(path => ({ path, changes: [] }))
	return (
		<div>
			{[...groups, ...fileOnly].map(group => (
				<FileGroup
					key={group.path}
					path={group.path}
					changes={group.changes}
					isWholeFile={wholeFiles.has(group.path)}
					isCurrent={shown?.path === group.path}
					state={state}
				/>
			))}
		</div>
	)
}
