import { addArgument, listArguments, getCase, addVerdict } from '../../../lib/db.js'
import { callJudge } from '../../../lib/aiService.js'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    const caseId = body.caseId || body.case_id
    const { side, text } = body

    if (!caseId || !side || !text) {
      return Response.json({ error: 'caseId, side and text required' }, { status: 400 })
    }

    const c = await getCase(caseId)
    if (!c) {
      return Response.json({ error: 'case not found' }, { status: 404 })
    }

    const arg = await addArgument(caseId, side, text)
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
    
    // Combine verdict and reasoning into one text field for storage
    const fullVerdictText = reasoning ? `${verdictText}\n\nReasoning: ${reasoning}` : verdictText
    const currentRound = Math.floor(args.length / 2) + 1
    
    const v = await addVerdict(caseId, fullVerdictText, currentRound, confidence)
    
    return Response.json({
      verdict: verdictText,
      reasoning: reasoning,
      confidence: confidence,
      arguments: args
    })
  } catch (e) {
    console.error('Argument error:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
