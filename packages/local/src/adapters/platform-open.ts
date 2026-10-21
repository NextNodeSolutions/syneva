// The one per-platform opener shared by the desk's browser tab (inbound/http) and the editor
// fallback (outbound/editor), so a platform rule change lands on both callers at once.
export function platformOpenCommand(target: string): {
	command: string
	args: string[]
} {
	if (process.platform === 'darwin')
		return { command: 'open', args: [target] }
	if (process.platform === 'win32')
		return { command: 'cmd', args: ['/c', 'start', '', target] }
	return { command: 'xdg-open', args: [target] }
}
