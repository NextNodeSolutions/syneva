import { deriveFlowIndex } from '../change/flow-index'

import { CARET_CLOSED, CARET_OPEN } from './tree-structure'

import type { ReviewState } from '../model'
import type { FileRow, TreeRow } from './tree-rows'

export function hasReviewedMaterial(state: ReviewState | null): boolean {
	return (state?.decisions ?? []).some(d => d.status === 'accepted')
}

const REVIEWED_GROUP_KEY = 'group:reviewed'

export function isReviewedGroupExpanded(foldExpanded: Set<string>): boolean {
	return foldExpanded.has(REVIEWED_GROUP_KEY)
}

export function toggleReviewedGroup(foldExpanded: Set<string>): void {
	if (foldExpanded.has(REVIEWED_GROUP_KEY))
		foldExpanded.delete(REVIEWED_GROUP_KEY)
	else foldExpanded.add(REVIEWED_GROUP_KEY)
}

export function reviewedPaths(
	state: ReviewState | null,
	shouldHideReviewed: boolean,
): string[] {
	if (!shouldHideReviewed || !state) return []
	return [
		...deriveFlowIndex(state, { distill: shouldHideReviewed }).distilled,
	]
}

function approvedFileRow(path: string, fileIndex: number | undefined): FileRow {
	return {
		key: `file:${path}`,
		kind: 'file',
		depth: 1,
		name: path.split('/').pop() ?? path,
		changed: false,
		path,
		fileIndex,
		testToggle: false,
		testKey: '',
		testCaret: CARET_CLOSED,
		changeType: null,
		state: 'approved',
		movedFrom: '',
	}
}

export function pushReviewedGroup(
	rows: TreeRow[],
	reviewed: string[],
	isOpen: boolean,
	fileIndexOf: (path: string) => number | undefined,
): void {
	if (!reviewed.length) return
	rows.push({
		kind: 'foldgrp',
		key: 'group:reviewed',
		count: reviewed.length,
		open: isOpen,
		caret: isOpen ? CARET_OPEN : CARET_CLOSED,
		group: 'reviewed',
	})
	if (!isOpen) return
	const ordered = [...reviewed]
	ordered.sort((a, b) => a.localeCompare(b))
	for (const path of ordered)
		rows.push(approvedFileRow(path, fileIndexOf(path)))
}
