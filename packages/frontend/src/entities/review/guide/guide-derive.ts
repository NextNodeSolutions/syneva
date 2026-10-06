export function isGuideBaseStale(
	baseDiffHash: string,
	guideBaseDiffHash: string | undefined,
): boolean {
	return !!guideBaseDiffHash && guideBaseDiffHash !== baseDiffHash
}
