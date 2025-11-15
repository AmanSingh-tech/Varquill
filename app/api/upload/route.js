import { createCase } from '../../../lib/db.js'

// Force dynamic rendering to avoid build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || ''

    // Handle multipart file upload - not supported yet
    if (contentType.includes('multipart/form-data')) {
      return Response.json(
        { error: 'File upload via app router requires additional setup. Use text input for now.' }, 
        { status: 501 }
      )
    }

    // Handle JSON text upload
    const body = await request.json()
    const text = body.text || ''
    const parts = text.split('\n---\n')
    const a = parts[0] || ''
    const b = parts[1] || ''
    const c = await createCase({ lawyerA_text: a, lawyerB_text: b, file_text: text })
    
    return Response.json({ case_id: c.id, extracted_text: text })
  } catch (e) {
    console.error('Upload error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
