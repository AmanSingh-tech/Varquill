import dbConnect from './dbConnect.js'

async function getModels(){
  const conn = await dbConnect()
  if(!conn) {
    throw new Error('MongoDB connection required. Please set MONGODB_URI environment variable.')
  }
  try{
    const Case = (await import('../models/Case.js')).default
    const Argument = (await import('../models/Argument.js')).default
    const Verdict = (await import('../models/Verdict.js')).default
    return { Case, Argument, Verdict }
  }catch(e){
    console.error('Failed to load Mongoose models:', e.message)
    throw new Error('Database models not available')
  }
}

export async function createCase({lawyerA_text='', lawyerB_text='', file_text='' } = {}){
  const models = await getModels()
  const c = await models.Case.create({ lawyerAText: lawyerA_text, lawyerBText: lawyerB_text, fileText: file_text })
  return { id: c._id.toString(), lawyerA_text: c.lawyerAText, lawyerB_text: c.lawyerBText, file_text: c.fileText, created_at: c.createdAt }
}

export async function getCase(id){
  const models = await getModels()
  const c = await models.Case.findById(id)
  return c ? { id: c._id.toString(), lawyerA_text: c.lawyerAText, lawyerB_text: c.lawyerBText, file_text: c.fileText, created_at: c.createdAt } : null
}

export async function addArgument(case_id, side, text){
  const models = await getModels()
  const rounds = await models.Argument.countDocuments({ caseId: case_id })
  const arg = await models.Argument.create({ caseId: case_id, side, text, round: rounds+1 })
  return { case_id: arg.caseId, side: arg.side, text: arg.text, round: arg.round, created_at: arg.createdAt }
}

export async function listArguments(case_id){
  const models = await getModels()
  const args = await models.Argument.find({ caseId: case_id }).sort({ round: 1 })
  return args.map(a=>({ case_id: a.caseId, side: a.side, text: a.text, round: a.round, created_at: a.createdAt }))
}

export async function addVerdict(case_id, text, round=null, confidence=null){
  const models = await getModels()
  const v = await models.Verdict.create({ caseId: case_id, text, round: round ?? undefined, confidence: confidence ?? undefined })
  return { case_id: v.caseId, text: v.text, round: v.round, confidence: v.confidence, created_at: v.createdAt }
}

export async function latestVerdict(case_id){
  const models = await getModels()
  const v = await models.Verdict.findOne({ caseId: case_id }).sort({ createdAt: -1 })
  return v ? { case_id: v.caseId, text: v.text, round: v.round, confidence: v.confidence, created_at: v.createdAt } : null
}

export async function listCases(){
  const models = await getModels()
  const cs = await models.Case.find().sort({ createdAt: -1 })
  return cs.map(c=>({ id: c._id.toString(), lawyerA_text: c.lawyerAText, lawyerB_text: c.lawyerBText, file_text: c.fileText, created_at: c.createdAt }))
}
