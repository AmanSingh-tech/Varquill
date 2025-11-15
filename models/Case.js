import mongoose from 'mongoose'

const CaseSchema = new mongoose.Schema({
  lawyerAText: { type: String, default: '' },
  lawyerBText: { type: String, default: '' },
  fileText: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Case || mongoose.model('Case', CaseSchema)
