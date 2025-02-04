import mongoose from 'mongoose'

const Wallet = new mongoose.Schema({
  owner: { type: String, required: true },
  label: { type: String },
  description: { type: String },
  hdIndex: { type: Number, required: true },
  addresses: { type: Object, default: {} }
})

export default mongoose.model('wallet', Wallet)
