import mongoose from 'mongoose'

const VerdictSchema = new mongoose.Schema({
  caseId: { type: String, required: true, index: true },
  text: { type: String, required: true },
  round: { type: Number },
  confidence: { type: Number },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Verdict || mongoose.model('Verdict', VerdictSchema)
