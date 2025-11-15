/**
 * AI Service - handles LLM interactions, prompts, and summarization
 * Using Google Gemini API
 */

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

/**
 * Build a judge prompt from case data and arguments
 */
function buildJudgePrompt(caseData, argsList) {
  let sections = []
  sections.push('You are an impartial AI judge. Read the case facts and all arguments, then produce a verdict.')

  if (caseData.file_text) sections.push(`Case text:\n${caseData.file_text}`)
  if (caseData.lawyerA_text) sections.push(`Lawyer A initial text:\n${caseData.lawyerA_text}`)
  if (caseData.lawyerB_text) sections.push(`Lawyer B initial text:\n${caseData.lawyerB_text}`)

  if (argsList && argsList.length) {
    let atext = argsList.map((a, i) => `${i + 1}. [${a.side}] ${a.text}`).join('\n')
    sections.push(`Arguments so far:\n${atext}`)
  }

  sections.push('\nProvide your response in valid JSON format with these exact keys:')
  sections.push('{"verdict": "your decision here", "reasoning": "your brief explanation in 2-3 sentences", "confidence": 75}')
  sections.push('\nThe verdict should state which lawyer you favor. Keep reasoning under 100 words. Confidence is 0-100.')
  sections.push('Return ONLY the JSON object without markdown code blocks. No ```json wrapper.')

  return sections.join('\n\n')
}

/**
 * Call Gemini API to get a judge verdict
 * @param {Object} caseData - Case information
 * @param {Array} argsList - List of arguments
 * @returns {Promise<{verdict: string, confidence: number|null, reasoning: string|null}>}
 */
export async function callJudge(caseData, argsList = []) {
  const key = process.env.GEMINI_API_KEY
  const prompt = buildJudgePrompt(caseData, argsList)

  if (!key) {
    return {
      verdict: `Mock verdict: favoring Lawyer A (sample).`,
      confidence: 62,
      reasoning: 'No Gemini API key - this is a mocked response.'
    }
  }

  const body = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,  // Increased to 4096 for longer responses
      topP: 0.9,
      topK: 40
    },
    // Disable thought tokens to maximize actual output
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_NONE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_NONE"
      }
    ]
  }

  const url = `${GEMINI_URL}?key=${key}`
  
  console.log('Calling Gemini API...')
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!res.ok) {
      const text = await res.text()
      console.error('Gemini API error response:', res.status, text)
      throw new Error(`Gemini API error (${res.status}): ${text}`)
    }
    
    const j = await res.json()
    console.log('Gemini API response received')
    
    // Check for MAX_TOKENS issue
    if (j.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
      console.warn('Response truncated due to MAX_TOKENS limit')
      console.warn('Thought tokens used:', j.usageMetadata?.thoughtsTokenCount)
      
      // Try to extract partial JSON if available
      const partialContent = j.candidates?.[0]?.content?.parts?.[0]?.text || ''
      if (partialContent) {
        console.log('Attempting to parse partial response...')
        // Continue processing below
      } else {
        throw new Error('Response was cut off due to length limits. The AI used too many internal reasoning tokens. Please try with a shorter case or fewer arguments.')
      }
    }
    
    const content = j.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!content) {
      console.warn('No content in Gemini response')
      console.warn('Response structure:', JSON.stringify(j, null, 2))
      throw new Error('Empty response from Gemini. The AI may have exceeded token limits.')
    }

    console.log('Gemini response content:', content)

    // Try to extract JSON from the response
    let payload = content.trim()
    
    // Try 1: JSON in code block with json marker
    let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/i)
    if (jsonMatch) {
      payload = jsonMatch[1].trim()
    } else {
      // Try 2: Plain code block
      jsonMatch = content.match(/```\s*([\s\S]*?)\s*```/i)
      if (jsonMatch) {
        payload = jsonMatch[1].trim()
      } else {
        // Try 3: JSON markers <JSON>...</JSON>
        jsonMatch = content.match(/<JSON>([\s\S]*?)<\/JSON>/i)
        if (jsonMatch) {
          payload = jsonMatch[1].trim()
        } else {
          // Try 4: Extract anything between { and }
          jsonMatch = content.match(/\{[\s\S]*\}/i)
          if (jsonMatch) {
            payload = jsonMatch[0].trim()
          }
        }
      }
    }

    try {
      const obj = JSON.parse(payload)
      return {
        verdict: obj.verdict || '',
        confidence: obj.confidence ?? null,
        reasoning: obj.reasoning || ''
      }
    } catch (e) {
      console.warn('JSON parse failed:', e.message)
      console.warn('Attempted to parse:', payload.substring(0, 200))
      
      // If MAX_TOKENS, try to extract partial verdict at least
      if (j.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
        // Try to extract verdict field even if incomplete
        const verdictMatch = payload.match(/"verdict"\s*:\s*"([^"]+)"/i)
        const confMatch = payload.match(/"confidence"\s*:\s*(\d+)/i)
        
        if (verdictMatch) {
          return {
            verdict: verdictMatch[1],
            confidence: confMatch ? parseInt(confMatch[1]) : 50,
            reasoning: 'Response was truncated. Analysis incomplete due to length limits.'
          }
        }
      }
      
      // Fallback: return content as verdict
      return {
        verdict: content.slice(0, 500),
        confidence: 50,
        reasoning: 'Unable to parse JSON response from AI. Raw response returned.'
      }
    }
  } catch (error) {
    console.error('Gemini API fetch failed:', error.name, error.message)
    // Return mock response on network error
    return {
      verdict: `Unable to reach Gemini API. Mock verdict: The case presents valid arguments from both sides. Based on contract law principles, further evidence is needed.`,
      confidence: 50,
      reasoning: `Network error (${error.name}): ${error.message}. Please check your internet connection and API key validity.`
    }
  }

  const j = await res.json()
  const content = j.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Extract JSON between markers <JSON>...</JSON>
  const m = content.match(/<JSON>([\s\S]*?)<\/JSON>/i)
  const payload = m ? m[1].trim() : content

  try {
    const obj = JSON.parse(payload)
    return {
      verdict: obj.verdict || '',
      confidence: obj.confidence ?? null,
      reasoning: obj.reasoning || ''
    }
  } catch (e) {
    // fallback: return trimmed content as verdict with null confidence
    return {
      verdict: (payload || content).toString().slice(0, 1000),
      confidence: null,
      reasoning: null
    }
  }
}

/**
 * Summarize long text to prevent token overflow
 * @param {string} text - Text to summarize
 * @param {number} maxLength - Max length before summarization
 * @returns {Promise<string>} Original or summarized text
 */
export async function summarizeIfNeeded(text, maxLength = 10000) {
  if (!text || text.length <= maxLength) return text

  const key = process.env.GEMINI_API_KEY
  if (!key) {
    // Fallback: simple truncation
    return text.slice(0, maxLength) + '\n...(truncated)'
  }

  try {
    const body = {
      contents: [{
        parts: [{
          text: `Summarize the following legal text concisely:\n\n${text.slice(0, 15000)}`
        }]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024  // Increased from 500 to 1024
      }
    }

    const url = `${GEMINI_URL}?key=${key}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!res.ok) throw new Error('Summarization failed')

    const j = await res.json()
    return j.candidates?.[0]?.content?.parts?.[0]?.text || text.slice(0, maxLength)
  } catch (e) {
    console.warn('Summarization error:', e.message)
    return text.slice(0, maxLength) + '\n...(truncated)'
  }
}
