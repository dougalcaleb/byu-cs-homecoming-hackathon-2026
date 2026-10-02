/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** logo.dev publishable key (pk_...) */
	readonly VITE_LOGO_DEV_TOKEN?: string
}

declare module 'mammoth' {
	interface ExtractRawTextOptions {
		arrayBuffer?: ArrayBuffer
		buffer?: Buffer
	}
	interface MammothResult {
		value: string
		messages: Array<{ type: string; message: string }>
	}
	export function extractRawText(options: ExtractRawTextOptions): Promise<MammothResult>
}

declare module '*?url' {
	const src: string
	export default src
}
