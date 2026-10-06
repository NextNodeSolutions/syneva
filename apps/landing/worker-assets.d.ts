// Vite turns an asset imported with ?url into the path it is served from. The site's program gets that from vite/client; the Worker's (tsconfig.worker.json) has no Vite types, so the email's font imports declare it here.
declare module '*?url' {
	const url: string
	export default url
}
