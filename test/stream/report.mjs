// The check's ledger: one line per assertion as it is decided, the count of failures at the end.
export function createReport(out = process.stdout) {
	const results = []
	const report = {
		section(title) {
			out.write(`\n# ${title}\n`)
		},
		check(name, isOk, detail = '') {
			results.push(isOk)
			const why = !isOk && detail ? `: ${detail}` : ''
			out.write(`${isOk ? 'ok  ' : 'FAIL'} ${name}${why}\n`)
			return isOk
		},
		// A step that waits on the hub: its timeout or throw is that step's failure, not the run's.
		async step(name, body) {
			try {
				const outcome = await body()
				report.check(name, true)
				return outcome
			} catch (error) {
				report.check(name, false, error.message)
				return null
			}
		},
		failures: () => results.filter(isOk => !isOk).length,
		total: () => results.length,
	}
	return report
}
