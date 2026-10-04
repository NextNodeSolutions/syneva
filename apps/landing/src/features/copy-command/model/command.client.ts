// Copy buttons: every [data-command] carries its own field and status. A
// failed copy (no clipboard permission) selects the command for a manual copy.
const FEEDBACK_MS = 1800

// Command.astro renders all three parts, so a missing one is a broken box.
const missing = (part: string): Error =>
	new Error(
		`A [data-command] box has no ${part}: render it with Command.astro.`,
	)

function bindCommand(box: Element): void {
	const button = box.querySelector('[data-copy]')
	const field = box.querySelector('input')
	const status = box.querySelector('[data-copy-status]')
	if (!button) throw missing('copy button ([data-copy])')
	if (!field) throw missing('command field (<input>)')
	if (!status) throw missing('copy status ([data-copy-status])')
	let reset: ReturnType<typeof setTimeout> | undefined
	let isFailing = false
	const clear = (): void => {
		isFailing = false
		button.classList.remove('is-copied')
		status.classList.remove('is-error')
		status.textContent = ''
	}
	const copy = async (): Promise<void> => {
		clearTimeout(reset)
		try {
			await navigator.clipboard.writeText(field.value)
			isFailing = false
			status.textContent = 'Copied. Paste it into your terminal.'
			status.classList.remove('is-error')
			button.classList.add('is-copied')
			reset = setTimeout(clear, FEEDBACK_MS)
		} catch {
			button.classList.remove('is-copied')
			field.focus()
			field.select()
			isFailing = true
			status.textContent = 'Copy unavailable. The command is selected.'
			status.classList.add('is-error')
		}
	}
	button.addEventListener('click', () => {
		void copy()
	})
	// A success clears itself; a failure stays until the visitor leaves the
	// selected command, so it can be read however long that takes.
	field.addEventListener('blur', () => {
		if (isFailing) clear()
	})
	// A click into the field selects the whole command, ready to copy.
	field.addEventListener('focus', () => field.select())
}

export function bindCommands(): void {
	document.querySelectorAll('[data-command]').forEach(bindCommand)
}
