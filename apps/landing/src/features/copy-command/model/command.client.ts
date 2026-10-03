// Copy buttons: every [data-command] carries its own field and status. A
// failed copy (no clipboard permission) selects the command for a manual copy.
const FEEDBACK_MS = 1800

function bindCommand(box: Element): void {
	const button = box.querySelector('[data-copy]')
	const field = box.querySelector('input')
	const status = box.querySelector('[data-copy-status]')
	if (!button || !field || !status) return
	let reset: ReturnType<typeof setTimeout> | undefined
	const copy = async (): Promise<void> => {
		clearTimeout(reset)
		try {
			await navigator.clipboard.writeText(field.value)
			status.textContent = 'Copied. Paste it into your terminal.'
			status.classList.remove('is-error')
			button.classList.add('is-copied')
		} catch {
			button.classList.remove('is-copied')
			field.focus()
			field.select()
			status.textContent = 'Copy unavailable. The command is selected.'
			status.classList.add('is-error')
		}
		reset = setTimeout(() => {
			button.classList.remove('is-copied')
			status.textContent = ''
		}, FEEDBACK_MS)
	}
	button.addEventListener('click', () => {
		void copy()
	})
	// A click into the field selects the whole command, ready to copy.
	field.addEventListener('focus', () => field.select())
}

export function bindCommands(): void {
	document.querySelectorAll('[data-command]').forEach(bindCommand)
}
