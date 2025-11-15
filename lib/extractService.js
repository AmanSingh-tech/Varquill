import fs from 'fs'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

/**
 * Extract text from a buffer based on file extension
 * @param {Buffer} buffer - File buffer
 * @param {string} ext - File extension (.pdf, .docx, .txt, etc.)
 * @returns {Promise<string>} Extracted text
 */
export async function extractText(buffer, ext) {
  const extension = ext.toLowerCase()
  
  if (extension === '.txt') {
    return buffer.toString('utf8')
  }
  
  if (extension === '.pdf') {
    const data = await pdfParse(buffer)
    return data.text
  }
  
  if (extension === '.docx' || extension === '.doc') {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }
  
  // Fallback: try to read as text
  return buffer.toString('utf8')
}

/**
 * Extract text from a file path
 * @param {string} filePath - Path to file
 * @param {string} ext - File extension
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromFile(filePath, ext) {
  const buffer = fs.readFileSync(filePath)
  return extractText(buffer, ext)
}
