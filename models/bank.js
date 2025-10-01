import mongoose from "mongoose";

const bankSchema = new mongoose.Schema({
  bank_name: {
    type: String,
    required: true,
    set: (value) => (value ? value.toUpperCase() : value),
  },
  ifsc_code: {
    type: String,
    required: false,
    set: (value) => (value ? value.toUpperCase() : value),
  },
  check: { type: Boolean, default: false, required: true },
  account_number: { type: String, required: true },
  current_balance: { type: Number, default: 0.0 },
  created_by: { type: String, required: true },
  group: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Compound index for unique bank_name per group
bankSchema.index({ bank_name: 1, group: 1 }, { unique: true });

const Bank = mongoose.models.bank || mongoose.model("bank", bankSchema);
export default Bank;
