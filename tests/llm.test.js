import assert from 'assert'
import { callJudge } from '../lib/llm.js'

async function run(){
  // When OPENAI_API_KEY is not set, callJudge returns mock data
  const res = await callJudge({file_text:'Test case', lawyerA_text:'A', lawyerB_text:'B'}, [])
  assert(res && typeof res.verdict === 'string', 'callJudge should return an object with verdict')
  console.log('llm tests passed (mock)')
}

run().catch(e=>{ console.error(e); process.exit(1) })
