import mongoose from 'mongoose'

const Payment = new mongoose.Schema({
  createdAt: { type: Number, required: true },
  walletId: { type: String, required: true },
  chain: { type: String, required: true },
  status: { type: String, required: true, default: 'pending' }, // "pending" , "completed" , " cancelled",
  webhook: { type: String },
  amountChain: { type: Number, required: true },
  amountUSD: { type: Number, required: true },
  completedAt: { type: Number },
  description: { type: String },
  targetAddress: { type: String, required: true },
  handledTx: { type: String },
  metadata: { type: Object, default: {} },
  validationAttemps: { type: Array, default: [] }
})

export default mongoose.model('payment', Payment)
