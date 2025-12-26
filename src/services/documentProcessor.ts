import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// Set worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export const processPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let text = ''

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const strings = content.items.map((item: any) => item.str)
        text += strings.join(' ') + '\n'
    }

    return text
}

export const processDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value
}

export const extractRequirements = (text: string): { id: string; content: string }[] => {
    // Simple pattern matching for "REQ-001", "R123", etc.
    // Healthcare requirements often follow specific prefixes.
    const lines = text.split('\n')
    const requirements: { id: string; content: string }[] = []

    // Basic regex to find IDs like REQ-001 or [REQ-001]
    const idRegex = /(REQ-\d+|[A-Z]{2,}-\d+)/i

    let currentId = ''
    let currentContent = ''

    lines.forEach(line => {
        const match = line.match(idRegex)
        if (match) {
            if (currentId) {
                requirements.push({ id: currentId, content: currentContent.trim() })
            }
            currentId = match[0]
            currentContent = line.replace(idRegex, '').trim()
        } else if (currentId) {
            currentContent += ' ' + line.trim()
        }
    })

    if (currentId) {
        requirements.push({ id: currentId, content: currentContent.trim() })
    }

    // Fallback: If no structured IDs found, split by paragraphs and assign IDs
    if (requirements.length === 0) {
        text.split(/\n\s*\n/).forEach((para, index) => {
            const content = para.trim()
            if (content.length > 20) {
                requirements.push({
                    id: `REQ-${String(index + 1).padStart(3, '0')}`,
                    content
                })
            }
        })
    }

    return requirements
}
