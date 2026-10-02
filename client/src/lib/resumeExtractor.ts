import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import mammoth from 'mammoth'

// Configure PDF.js worker
if (typeof window !== 'undefined') {
	pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker
}

export interface ExtractedDocument {
	rawText: string
	fileName: string
}

/**
 * Extracts raw verbatim text from an uploaded file (PDF, DOCX, TXT).
 */
export async function extractTextFromFile(file: File): Promise<ExtractedDocument> {
	const fileName = file.name
	const lower = fileName.toLowerCase()

	// 1. PDF handling
	if (lower.endsWith('.pdf')) {
		try {
			const arrayBuffer = await file.arrayBuffer()
			const loadingTask = pdfjsLib.getDocument({
				data: new Uint8Array(arrayBuffer),
				useSystemFonts: true,
			})
			const pdf = await loadingTask.promise
			const pageTexts: string[] = []

			for (let i = 1; i <= pdf.numPages; i++) {
				const page = await pdf.getPage(i)
				const content = await page.getTextContent()

				// Build lines from text items considering vertical positions
				let lastY: number | null = null
				let pageStr = ''

				for (const item of content.items) {
					if ('str' in item && typeof item.str === 'string') {
						const transform = item.transform as number[] | undefined
						const currentY = transform && transform[5] !== undefined ? transform[5] : null

						if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 6) {
							pageStr += '\n'
						} else if (pageStr.length > 0 && !pageStr.endsWith(' ') && !pageStr.endsWith('\n')) {
							pageStr += ' '
						}
						pageStr += item.str
						if (currentY !== null) {
							lastY = currentY
						}
					}
				}
				pageTexts.push(pageStr.trim())
			}

			const rawText = pageTexts.filter(Boolean).join('\n\n')
			if (rawText.trim().length > 0) {
				return { rawText, fileName }
			}
		} catch (err) {
			console.warn('PDF extraction failed or document is scanned/empty, falling back to text read:', err)
		}
	}

	// 2. DOCX / DOC handling
	if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
		try {
			const arrayBuffer = await file.arrayBuffer()
			const result = await mammoth.extractRawText({ arrayBuffer })
			if (result.value && result.value.trim().length > 0) {
				return { rawText: result.value.trim(), fileName }
			}
		} catch (err) {
			console.warn('DOCX extraction failed, falling back to text read:', err)
		}
	}

	// 3. Fallback: plain text reader
	try {
		const rawText = await file.text()
		return { rawText, fileName }
	} catch (err) {
		console.error('Failed to read file as text:', err)
		return { rawText: `[Uploaded ${fileName}]`, fileName }
	}
}
