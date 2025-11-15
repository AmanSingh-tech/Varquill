import { latestVerdict } from './db.js'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

function buildJudgePrompt(caseData, argsList){
  // Improved prompt that instructs the model to return a JSON object wrapped in <JSON>...</JSON>
  let sections = []
  sections.push('You are an impartial AI judge. Read the case facts and all arguments, then produce a short verdict, reasoning, and a confidence score (0-100).')

  if(caseData.file_text) sections.push(`Case text:\n${caseData.file_text}`)
  if(caseData.lawyerA_text) sections.push(`Lawyer A initial text:\n${caseData.lawyerA_text}`)
  if(caseData.lawyerB_text) sections.push(`Lawyer B initial text:\n${caseData.lawyerB_text}`)

  if(argsList && argsList.length){
    let atext = argsList.map((a,i)=>`${i+1}. [${a.side}] ${a.text}`).join('\n')
    sections.push(`Arguments so far:\n${atext}`)
  }

  sections.push('\nOUTPUT FORMAT INSTRUCTIONS:')
  sections.push('Return ONLY a single JSON object wrapped between the markers <JSON> and </JSON>. Do NOT include any other text outside these markers. The JSON must have these keys:')
  sections.push('- verdict: a short string stating the decision (one or two lines)')
  sections.push('- reasoning: a short explanation supporting the decision')
  sections.push('- confidence: an integer between 0 and 100')
  sections.push('\nExample:')
  sections.push('<JSON>{"verdict":"Favor Lawyer A","reasoning":"Evidence X was stronger...","confidence":72}</JSON>')

  return sections.join('\n\n')
}

export async function callJudge(caseData, argsList=[]){
  // If no API key available, return a mock
  const key = process.env.OPENAI_API_KEY
  const prompt = buildJudgePrompt(caseData, argsList)

  if(!key){
    return { verdict: `Mock verdict: favoring Lawyer A (sample).`, confidence: 62, reasoning: 'No API key - this is a mocked response.' }
  }

  const body = {
    model: 'gpt-4',
    messages: [{role:'system',content:'You are an AI judge.'},{role:'user',content:prompt}],
    max_tokens: 600,
    temperature: 0.2
  }

  const res = await fetch(OPENAI_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
    body: JSON.stringify(body)
  })

  if(!res.ok){
    const text = await res.text()
    throw new Error('LLM error: '+text)
  }
  const j = await res.json()
  const content = j.choices?.[0]?.message?.content || ''

  // Extract JSON between markers <JSON>...</JSON>
  const m = content.match(/<JSON>([\s\S]*?)<\/JSON>/i)
  const payload = m ? m[1].trim() : content

  try{
    const obj = JSON.parse(payload)
    return { verdict: obj.verdict || '', confidence: obj.confidence ?? null, reasoning: obj.reasoning || '' }
  }catch(e){
    // fallback: return trimmed content as verdict with null confidence
    return { verdict: (payload||content).toString().slice(0,1000), confidence: null, reasoning: null }
  }
}
