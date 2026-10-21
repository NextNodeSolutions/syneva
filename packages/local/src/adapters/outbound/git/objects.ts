// Many git objects through ONE `git cat-file --batch` process: naming the code of a thousand-file diff reads both sides of every file, and a spawn per side would cost seconds.
import { spawn } from 'node:child_process'

import { AdapterError } from '@syneva/core/application/errors'

const NEWLINE = 0x0a
// "<oid> <type> <size>": the size is the header's third field.
const SIZE_FIELD = 2

function runBatch(root: string, input: string): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const child = spawn(
			'git',
			['-c', 'core.quotePath=false', 'cat-file', '--batch'],
			{ cwd: root },
		)
		const chunks: Buffer[] = []
		child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))
		child.on('error', error =>
			reject(new AdapterError(error.message, { cause: error })),
		)
		child.on('close', code => {
			if (code === 0) resolve(Buffer.concat(chunks))
			else
				reject(
					new AdapterError(
						`git cat-file --batch exited with ${code}`,
					),
				)
		})
		child.stdin.end(input)
	})
}

// The batch answers in request order: "<oid> <type> <size>\n<bytes>\n" for a found object, "<spec> missing\n" otherwise.
function parseBatch(
	output: Buffer,
	specs: readonly string[],
): Map<string, string> {
	const objects = new Map<string, string>()
	let position = 0
	for (const spec of specs) {
		const headerEnd = output.indexOf(NEWLINE, position)
		if (headerEnd < 0) break
		const header = output.subarray(position, headerEnd).toString('utf8')
		position = headerEnd + 1
		const size = Number(header.split(' ')[SIZE_FIELD])
		if (!Number.isInteger(size)) continue
		objects.set(
			spec,
			output.subarray(position, position + size).toString('utf8'),
		)
		position += size + 1
	}
	return objects
}

export async function readObjects(
	root: string,
	specs: readonly string[],
): Promise<Map<string, string>> {
	// A path with a newline cannot travel through the batch protocol: it stays unread, like a missing object.
	const wanted = [...new Set(specs)].filter(spec => !spec.includes('\n'))
	if (!wanted.length) return new Map()
	const output = await runBatch(root, `${wanted.join('\n')}\n`)
	return parseBatch(output, wanted)
}
