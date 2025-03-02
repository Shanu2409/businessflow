import mongoose from "mongoose";

const bankSchema = new mongoose.Schema({
  bank_name: { type: String, unique: true, required: true },
  ifsc_code: { type: String, required: false },
  check: { type: Boolean, default: false, required: true },
  account_number: { type: String, required: true },
  current_balance: { type: Number, default: 0.0 },
  created_by: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Bank = mongoose.models.bank || mongoose.model("bank", bankSchema);
export default Bank;
