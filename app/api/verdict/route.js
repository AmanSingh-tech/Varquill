import { getCase, listArguments, addVerdict } from '../../../lib/db.js'
import { callJudge } from '../../../lib/aiService.js'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const case_id = searchParams.get('case_id')
    
    if (!case_id) {
      return Response.json({ error: 'case_id required' }, { status: 400 })
    }

    const c = await getCase(case_id)
    if (!c) {
      return Response.json({ error: 'case not found' }, { status: 404 })
    }

    const args = await listArguments(case_id)
    
    return Response.json({ case: c, arguments: args, verdict: null })
  } catch (e) {
    console.error('Verdict GET error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const caseId = body.caseId || body.case_id

    if (!caseId) {
      return Response.json({ error: 'caseId required' }, { status: 400 })
    }

    const c = await getCase(caseId)
    if (!c) {
      return Response.json({ error: 'case not found' }, { status: 404 })
    }

    const args = await listArguments(caseId)
    const result = await callJudge(c, args)
    
    // Handle both string and object responses
    let verdictText, reasoning, confidence
    if (typeof result === 'string') {
      verdictText = result
      confidence = 50
      reasoning = ''
    } else {
      verdictText = result.verdict || result.text || 'No verdict provided'
      reasoning = result.reasoning || ''
      confidence = result.confidence || 50
    }
    
    // Combine verdict and reasoning into a single text field for storage
    const fullVerdictText = reasoning ? `${verdictText}\n\nReasoning: ${reasoning}` : verdictText
    
    // Calculate round number based on number of arguments
    const round = args.length + 1
    
    const v = await addVerdict(caseId, fullVerdictText, round, confidence)
    
    return Response.json({
      verdict: verdictText,
      reasoning: reasoning,
      confidence: confidence,
      arguments: args
    })
  } catch (e) {
    console.error('Verdict POST error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
