import mongoose from 'mongoose'

const ArgumentSchema = new mongoose.Schema({
  caseId: { type: String, required: true, index: true },
  side: { type: String, required: true },
  text: { type: String, required: true },
  round: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Argument || mongoose.model('Argument', ArgumentSchema)
