// RAG service: uses Mongoose Document model when available, otherwise file-based docs.json
import fs from 'fs'
import path from 'path'
import dbConnect from './dbConnect.js'

const DOC_FILE = path.join(process.cwd(), 'data', 'docs.json')

async function getDocModel() {
  const conn = await dbConnect()
  if (!conn) return null
  try {
    const Document = (await import('../models/Document.js')).default
    return Document
  } catch (e) {
    console.warn('Document model not available:', e.message)
    return null
  }
}

function ensureFile() {
  if (!fs.existsSync(DOC_FILE)) {
    const dir = path.dirname(DOC_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(DOC_FILE, JSON.stringify({ docs: [] }, null, 2))
  }
}

export async function addDocument({ title = '', text = '' }) {
  const DocModel = await getDocModel()
  if (DocModel) {
    const d = await DocModel.create({ title, text })
    return { id: d._id.toString(), title: d.title, text: d.text }
  }

  ensureFile()
  const db = JSON.parse(fs.readFileSync(DOC_FILE, 'utf8'))
  const id = (db.docs.length + 1).toString()
  const d = { id, title, text }
  db.docs.push(d)
  fs.writeFileSync(DOC_FILE, JSON.stringify(db, null, 2))
  return d
}

export async function listDocuments() {
  const DocModel = await getDocModel()
  if (DocModel) {
    const docs = await DocModel.find().sort({ createdAt: -1 })
    return docs.map(d => ({ id: d._id.toString(), title: d.title, text: d.text }))
  }

  ensureFile()
  const db = JSON.parse(fs.readFileSync(DOC_FILE, 'utf8'))
  return db.docs
}

// naive text-match retrieval: returns docs containing the query tokens
export async function retrieve(query, limit = 3) {
  const docs = await listDocuments()
  const q = query.toLowerCase().split(/\s+/).filter(Boolean)
  const scored = docs.map(d => {
    const t = (d.title + ' ' + d.text).toLowerCase()
    let score = 0
    q.forEach(tok => {
      if (t.includes(tok)) score += 1
    })
    return { ...d, score }
  }).filter(d => d.score > 0)
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}
