type RenderFunnel = {
	render: () => Promise<void>
	deferRender: () => void
}

let funnel: RenderFunnel | null = null

export function registerRenderFunnel(registered: RenderFunnel): void {
	funnel = registered
}

function needFunnel(): RenderFunnel {
	if (!funnel)
		throw new Error('render requested before the funnel registered')
	return funnel
}

export function render(): Promise<void> {
	return needFunnel().render()
}

export function deferRender(): void {
	needFunnel().deferRender()
}
