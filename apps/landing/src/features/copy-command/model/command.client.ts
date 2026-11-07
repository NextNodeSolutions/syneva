const FEEDBACK_MS = 1800

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
	field.addEventListener('blur', () => {
		if (isFailing) clear()
	})
	field.addEventListener('focus', () => field.select())
}

export function bindCommands(): void {
	document.querySelectorAll('[data-command]').forEach(bindCommand)
}
