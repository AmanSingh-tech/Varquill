import { addDocument, listDocuments, retrieve } from '../../../lib/rag.js'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    
    if (query) {
      // Retrieve documents matching query
      const results = await retrieve(query, 5)
      return Response.json({ results })
    }
    
    // List all documents
    const docs = await listDocuments()
    return Response.json({ docs })
  } catch (e) {
    console.error('RAG GET error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { title, text } = body

    if (!text) {
      return Response.json({ error: 'text required' }, { status: 400 })
    }

    const d = await addDocument({ title: title || '', text })
    return Response.json({ doc: d })
  } catch (e) {
    console.error('RAG POST error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
