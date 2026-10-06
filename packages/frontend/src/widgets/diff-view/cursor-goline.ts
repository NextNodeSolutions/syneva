import { diffCtx } from './context'
import { cursorJumpTo, landAt } from './cursor'
import { D } from './runtime'

const GOLINE_COMMIT_MS = 800

let golineTimer: ReturnType<typeof setTimeout> | undefined

export function golineActive(): boolean {
	return !!diffCtx().S.golineBuffer
}

export function golineDigit(d: string): void {
	if (!diffCtx().S.golineBuffer && d === '0') return
	diffCtx().S.golineBuffer += d
	clearTimeout(golineTimer)
	golineTimer = setTimeout(golineCommit, GOLINE_COMMIT_MS)
}

export function golineCancel(): void {
	diffCtx().S.golineBuffer = ''
	clearTimeout(golineTimer)
}

export function golineCommit(): void {
	const n = parseInt(diffCtx().S.golineBuffer, 10)
	golineCancel()
	if (!Number.isFinite(n)) return
	// Prefer the additions/new side - the number a reviewer reads off the gutter; goline never triggers an expansion, so a miss means the line is not rendered, unless a virtualized diff just has not mounted it (its VirtualNav scrolls there).
	if (landAt('additions', n)) return
	if (D.virtual?.scrollToLine({ side: 'additions', line: n })) {
		cursorJumpTo('additions', n)
		return
	}
	diffCtx().toast(`Line ${n} isn't visible in this diff`)
}
