import { parse as parseXml } from 'fast-xml-parser'
import JSZip from 'jszip'
import * as pdfjsLib from 'pdfjs-dist'
import type { CandidateProfile } from '../types'

// pdfjs worker will be loaded via CDN at runtime if not bundled; but for Vite we can set it like this
// @ts-ignore - types may not include GlobalWorkerOptions
// eslint-disable-next-line
;(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
	// @ts-ignore
	(pdfjsLib as any).GlobalWorkerOptions.workerSrc ||
		'//cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.min.js'

export async function extractTextFromPdf(file: File): Promise<string> {
	const arrayBuffer = await file.arrayBuffer()
	// @ts-ignore
	const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise
	let fullText = ''
	for (let i = 1; i <= pdf.numPages; i++) {
		const page = await pdf.getPage(i)
		const content = await page.getTextContent()
		const strings = content.items.map((item: any) => item.str)
		fullText += strings.join(' ') + '\n'
	}
	return fullText
}

export async function extractTextFromDocx(file: File): Promise<string> {
	const arrayBuffer = await file.arrayBuffer()
	const zip = await JSZip.loadAsync(arrayBuffer)
	const documentXml = await zip.file('word/document.xml')?.async('string')
	if (!documentXml) return ''
	const json = parseXml(documentXml, { ignoreAttributes: false }) as any
	// Flatten text from w:t nodes
	const texts: string[] = []
	function walk(node: any) {
		if (!node || typeof node !== 'object') return
		if (node['w:t']) {
			if (typeof node['w:t'] === 'string') texts.push(node['w:t'])
			else if (Array.isArray(node['w:t'])) texts.push(...node['w:t'])
		}
		for (const key of Object.keys(node)) {
			walk(node[key])
		}
	}
	walk(json)
	return texts.join(' ')
}

export async function extractResumeText(file: File): Promise<string> {
	const ext = file.name.toLowerCase()
	if (ext.endsWith('.pdf')) return extractTextFromPdf(file)
	if (ext.endsWith('.docx')) return extractTextFromDocx(file)
	throw new Error('Unsupported file type. Please upload PDF or DOCX.')
}

export interface ParsedProfile {
	name?: string
	email?: string
	phone?: string
}

export function parseProfileFromText(text: string): ParsedProfile {
	const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
	const phoneMatch = text.match(/(?:\+\d{1,3}[\s-]?)?(?:\(\d{2,4}\)[\s-]?)?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{0,4}/)

	// Heuristic for name: take first non-empty line without email/phone and not common headings
	const lines = text
		.split(/\r?\n|
\s{2,}/)
		.map(l => l.trim())
		.filter(Boolean)
	const skipWords = ['resume', 'curriculum vitae', 'cv', 'profile']
	let name: string | undefined
	for (const line of lines) {
		const lower = line.toLowerCase()
		if (emailMatch && line.includes(emailMatch[0])) continue
		if (phoneMatch && line.includes(phoneMatch[0])) continue
		if (skipWords.some(w => lower.includes(w))) continue
		// Likely a name if few words and letters only
		const wordCount = line.split(/\s+/).length
		if (wordCount <= 4 && /[a-zA-Z]/.test(line)) {
			name = line
			break
		}
	}

	return {
		name,
		email: emailMatch?.[0],
		phone: phoneMatch?.[0]?.replace(/\s+/g, ' ').trim()
	}
}

export function buildCandidateProfile(partial: ParsedProfile): Partial<CandidateProfile> {
	const profile: Partial<CandidateProfile> = {}
	if (partial.name) profile.name = partial.name
	if (partial.email) profile.email = partial.email
	if (partial.phone) profile.phone = partial.phone
	return profile
}


