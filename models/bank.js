import mongoose from "mongoose";

const bankSchema = new mongoose.Schema({
  bank_name: { type: String, unique: true },
  ifsc_code: { type: String },
  account_number: { type: String },
  current_balance: { type: Number, default: 0.0 },
  created_by: { type: String },
  createdAt: { type: Date, default: Date.now },
  ttlExpiresAt: { type: Date, expires: "3600s" },
});

const Bank = mongoose.models.bank || mongoose.model("bank", bankSchema);
export default Bank;
