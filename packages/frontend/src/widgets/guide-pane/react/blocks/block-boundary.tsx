import { Component } from 'react'

import type { ReactNode } from 'react'

type Props = { fallback: ReactNode; children: ReactNode }
type State = { hasFailed: boolean }

// React still hands error boundaries to class components only (getDerivedStateFromError has no hook form): this is the one class in the desk, the smallest one possible, so a block that fails to render keeps its text and leaves the rest of the pane, the diff and the verdict controls intact.
export class BlockBoundary extends Component<Props, State> {
	override state: State = { hasFailed: false }

	static getDerivedStateFromError(): State {
		return { hasFailed: true }
	}

	override render(): ReactNode {
		if (this.state.hasFailed) return this.props.fallback
		return this.props.children
	}
}
