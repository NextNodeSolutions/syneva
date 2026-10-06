import { deskUrl } from '@shared/api/base'
import { api } from '@shared/api/client'
import {
	assertObject,
	optString,
	requiredString,
	requiredStringArray,
} from '@shared/api/decode'
import { API_PATHS } from '@syneva/contracts/routes'

export type TreeListing = { files: string[] }

export const fetchTree = async (): Promise<TreeListing> => {
	const raw = await api(API_PATHS.tree)
	const o = assertObject(raw, API_PATHS.tree)
	return { files: requiredStringArray(o, 'files', API_PATHS.tree) }
}

export type FileContents = { oldContents: string; newContents: string }

export const fetchFileContents = async (
	path: string,
): Promise<FileContents> => {
	const endpoint = `${API_PATHS.fileContents}?path=${encodeURIComponent(path)}`
	const raw = await api(endpoint)
	const o = assertObject(raw, endpoint)
	// Empty strings are VALID sides (added file → empty old, deleted file → empty new, empty file → both), so only an absent field is a decode failure - never test the strings for truthiness.
	const error = optString(o, 'error', endpoint)
	if (error) throw new Error(error)
	return {
		oldContents: requiredString(o, 'oldContents', endpoint),
		newContents: requiredString(o, 'newContents', endpoint),
	}
}

// The only place the blob path is spelled; shared consumers (the markdown runtime) receive this
// resolver injected instead of the route. The URL lands in an <img src>, so it is built with the
// desk prefix here rather than through the JSON transport.
export const repoBlobUrl = (path: string): string =>
	deskUrl(`${API_PATHS.blob}?path=${encodeURIComponent(path)}`)

export type PreviewPayload = { path: string; contents: string }

export const fetchPreviewFile = async (
	path: string,
): Promise<PreviewPayload> => {
	const endpoint = `${API_PATHS.file}?path=${encodeURIComponent(path)}`
	const raw = await api(endpoint)
	const o = assertObject(raw, endpoint)
	return {
		path: requiredString(o, 'path', endpoint),
		contents: requiredString(o, 'contents', endpoint),
	}
}
